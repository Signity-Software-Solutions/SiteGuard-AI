import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { SafetyAlert } from '@/types'
import { EventBus, type EventSink, type SafetyEvent } from '@/domain/events'
import { compliancePct } from '@/domain/analytics'
import { SafetyPipeline, type TickSnapshot } from '@/services/pipeline'
import { DemoCameraSource } from '@/services/camera/DemoCameraSource'
import { DemoPersonDetector, MockPPEInferenceProvider } from '@/services/inference/MockPPEInferenceProvider'
import { CAMERAS, ZONES } from '@/data/reference'
import { dailyComplianceSeries, historyAlerts } from '@/data/reference'
import { demoAnchorMs } from '@/domain/clock'
import { usePolicyStore } from './policy'

const TICK_MS = 250
const DEMO_SECONDS_PER_TICK = 0.25
/** No pop-up notifications while the first frames load (alerts still appear in the list). */
const SETTLE_TICKS = 20

export interface Toast {
  id: number
  alert: SafetyAlert
}

/**
 * Runtime store: owns the pipeline loop, the alert list and derived dashboard numbers.
 * It *reads* results from the domain/services layers - it never evaluates compliance itself.
 */
export const useSiteStore = defineStore('site', () => {
  const policyStore = usePolicyStore()
  const anchor = demoAnchorMs()

  const bus = new EventBus()
  const pipeline = new SafetyPipeline({
    sources: CAMERAS.map((c) => new DemoCameraSource(c)),
    detector: new DemoPersonDetector(),
    inference: new MockPPEInferenceProvider(), // ← swap for a RealPPEInferenceProvider in production
    getPolicy: () => policyStore.policy,
    bus,
  })

  const dailyCompliance = dailyComplianceSeries()

  const alerts = ref<SafetyAlert[]>(historyAlerts())
  const snapshot = shallowRef<TickSnapshot | null>(null)
  const running = ref(false)
  const tick = ref(0)
  const toasts = ref<Toast[]>([])
  let toastSeq = 1
  let timer: ReturnType<typeof setInterval> | null = null
  let busy = false

  // Dashboard alert sink - future sinks (email, Slack, webhook, SMS) subscribe the same way.
  const dashboardSink: EventSink = {
    handle(e: SafetyEvent) {
      if (e.type === 'SafetyViolationDetected') {
        alerts.value.unshift(e.alert)
        if (e.alert.severity === 'CRITICAL' && tick.value >= SETTLE_TICKS) pushToast(e.alert)
      } else {
        const a = alerts.value.find((x) => x.id === e.alertId)
        if (a && a.status !== 'RESOLVED') {
          a.status = 'RESOLVED'
          a.resolvedAt = e.at
          a.resolvedBy = 'auto'
        }
      }
    },
  }
  bus.subscribe(dashboardSink)

  function pushToast(alert: SafetyAlert) {
    const id = toastSeq++
    toasts.value.push({ id, alert })
    if (toasts.value.length > 3) toasts.value.shift()
    setTimeout(() => dismissToast(id), 6000)
  }
  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  async function runTick() {
    if (busy) return
    busy = true
    try {
      const n = tick.value
      snapshot.value = await pipeline.step(n, n * DEMO_SECONDS_PER_TICK, anchor + n * TICK_MS)
      tick.value = n + 1
    } finally {
      busy = false
    }
  }

  function start() {
    if (timer) return
    running.value = true
    void runTick()
    timer = setInterval(() => void runTick(), TICK_MS)
  }
  function pause() {
    running.value = false
    if (timer) clearInterval(timer)
    timer = null
  }
  function toggle() {
    if (running.value) pause()
    else start()
  }
  /** Restart the scripted demo from t = 0 and drop live alerts (history stays). */
  function restart() {
    pause()
    pipeline.reset()
    alerts.value = alerts.value.filter((a) => a.source === 'history')
    toasts.value = []
    tick.value = 0
    snapshot.value = null
    start()
  }

  function acknowledge(id: string) {
    const a = alerts.value.find((x) => x.id === id)
    if (a && a.status === 'ACTIVE') {
      a.status = 'ACKNOWLEDGED'
      a.acknowledgedAt = demoNow.value
    }
  }
  function resolve(id: string) {
    const a = alerts.value.find((x) => x.id === id)
    if (a && a.status !== 'RESOLVED') {
      a.status = 'RESOLVED'
      a.resolvedAt = demoNow.value
      a.resolvedBy = 'operator'
    }
  }

  const demoNow = computed(() => snapshot.value?.timestamp ?? anchor)
  const workers = computed(() => snapshot.value?.workers ?? [])
  const liveAlerts = computed(() => alerts.value.filter((a) => a.source === 'live'))
  const openAlerts = computed(() => alerts.value.filter((a) => a.status !== 'RESOLVED'))

  const stats = computed(() => {
    const w = workers.value
    const count = (s: string) => w.filter((x) => x.compliance.overallStatus === s).length
    const compliant = count('COMPLIANT')
    const open = openAlerts.value
    return {
      total: w.length,
      compliant,
      nonCompliant: count('NON_COMPLIANT'),
      warning: count('WARNING'),
      compliancePct: compliancePct(w.length, compliant),
      activeViolations: open.length,
      criticalAlerts: open.filter((a) => a.severity === 'CRITICAL').length,
      camerasOnline: CAMERAS.filter((c) => c.online).length,
      camerasTotal: CAMERAS.length,
      zones: ZONES.length,
    }
  })

  return {
    anchor, alerts, snapshot, running, tick, toasts, demoNow, workers, liveAlerts, openAlerts, stats, dailyCompliance,
    start, pause, toggle, restart, acknowledge, resolve, dismissToast,
  }
})
