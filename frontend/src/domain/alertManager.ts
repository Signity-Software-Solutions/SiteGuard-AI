import type { ComplianceResult, Rect, SafetyAlert, Violation } from '@/types'
import type { SafetyEvent } from './events'

export interface Observation {
  cameraId: string
  cameraName: string
  zoneName: string
  trackId: number
  label: string
  bbox: Rect
  result: ComplianceResult
}

interface KeyState {
  streak: number
  missed: number
  alertId: string | null
}

export interface AlertManagerOptions {
  /** Consecutive ticks a violation must persist before an alert is raised (debounce). */
  confirmTicks: number
  /** Consecutive ticks a violation must be absent before the alert auto-resolves. */
  clearTicks: number
  startSeq: number
}

/**
 * Turns per-tick compliance observations into alert lifecycle events:
 * debounce → SafetyViolationDetected → (cleared for N ticks) → SafetyViolationResolved.
 * One open alert per (track, camera, violation type, zone) - no duplicate spam.
 */
export class AlertManager {
  private states = new Map<string, KeyState>()
  private seq: number
  private opts: AlertManagerOptions

  constructor(opts: Partial<AlertManagerOptions> = {}) {
    this.opts = { confirmTicks: 3, clearTicks: 6, startSeq: 3001, ...opts }
    this.seq = this.opts.startSeq
  }

  reset(): void {
    this.states.clear()
    this.seq = this.opts.startSeq
  }

  ingest(observations: Observation[], nowMs: number): SafetyEvent[] {
    const events: SafetyEvent[] = []
    const current = new Map<string, { obs: Observation; v: Violation }>()
    for (const obs of observations) {
      for (const v of obs.result.violations) {
        current.set(`${obs.trackId}|${obs.cameraId}|${v.type}|${v.zoneId}`, { obs, v })
      }
    }

    for (const [key, { obs, v }] of current) {
      let st = this.states.get(key)
      if (!st) {
        st = { streak: 0, missed: 0, alertId: null }
        this.states.set(key, st)
      }
      st.streak++
      st.missed = 0
      if (!st.alertId && st.streak >= this.opts.confirmTicks) {
        const alert: SafetyAlert = {
          id: `V-${this.seq++}`,
          type: v.type,
          severity: v.severity,
          status: 'ACTIVE',
          trackId: obs.trackId,
          workerLabel: obs.label,
          cameraId: obs.cameraId,
          cameraName: obs.cameraName,
          zoneId: v.zoneId,
          zoneName: obs.zoneName,
          message: v.message,
          detectedAt: nowMs,
          riskLevel: obs.result.riskLevel,
          evidence: { checks: obs.result.checks, bbox: obs.bbox },
          source: 'live',
        }
        st.alertId = alert.id
        events.push({ type: 'SafetyViolationDetected', alert })
      }
    }

    for (const [key, st] of [...this.states]) {
      if (current.has(key)) continue
      st.missed++
      if (!st.alertId) {
        this.states.delete(key)
        continue
      }
      if (st.missed >= this.opts.clearTicks) {
        events.push({ type: 'SafetyViolationResolved', alertId: st.alertId, at: nowMs })
        this.states.delete(key)
      }
    }
    return events
  }
}
