import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { EventBus } from '@/domain/events'
import { SafetyPipeline } from '@/services/pipeline'
import { DemoCameraSource } from '@/services/camera/DemoCameraSource'
import { DemoPersonDetector, MockPPEInferenceProvider } from '@/services/inference/MockPPEInferenceProvider'
import { CAMERAS, defaultPolicy } from '@/data/reference'
import type { SafetyAlert } from '@/types'

async function run(ticks: number) {
  const bus = new EventBus()
  const alerts: SafetyAlert[] = []
  bus.subscribe({ handle: (e) => { if (e.type === 'SafetyViolationDetected') alerts.push(e.alert) } })
  const policy = defaultPolicy()
  const p = new SafetyPipeline({
    sources: CAMERAS.map((c) => new DemoCameraSource(c)),
    detector: new DemoPersonDetector(),
    inference: new MockPPEInferenceProvider(),
    getPolicy: () => policy,
    bus,
  })
  let snap = await p.step(0, 0, 0)
  for (let i = 1; i <= ticks; i++) snap = await p.step(i, i * 0.25, i * 250)
  return { snap, alerts }
}

describe('demo pipeline (deterministic)', () => {
  it('tracks 34 workers; Worker #17 is on the tower deck with goggles + harness violations', async () => {
    const { snap } = await run(8)
    expect(snap.workers).toHaveLength(34)
    const w17 = snap.workers.find((w) => w.trackId === 17)!
    expect(w17.cameraId).toBe('CAM-03')
    expect(w17.zoneId).toBe('z-highrise')
    expect(w17.compliance.riskLevel).toBe('HIGH')
    expect(w17.compliance.violations.map((v) => v.type)).toEqual(['MISSING_GOGGLES', 'MISSING_HARNESS'])
  })

  it('headline stats at start: 24 compliant, 8 non-compliant, 2 warning; 4 critical alerts', async () => {
    const { snap, alerts } = await run(8)
    const by = (s: string) => snap.workers.filter((w) => w.compliance.overallStatus === s).length
    expect([by('COMPLIANT'), by('NON_COMPLIANT'), by('WARNING')]).toEqual([24, 8, 2])
    expect(alerts.filter((a) => a.severity === 'CRITICAL')).toHaveLength(4)
    expect(alerts.find((a) => a.message === 'Worker #17 entered High-Rise Floor without safety harness.')).toBeTruthy()
  })

  it('Worker #16 is in the restricted bay and raises an alert', async () => {
    const { alerts } = await run(12)
    expect(alerts.some((a) => a.type === 'RESTRICTED_ZONE_ENTRY' && a.trackId === 16)).toBe(true)
  })

  it('is identical across runs', async () => {
    const a = await run(40)
    const b = await run(40)
    expect(JSON.stringify(a.snap.workers)).toBe(JSON.stringify(b.snap.workers))
    expect(a.alerts.map((x) => x.id + x.message)).toEqual(b.alerts.map((x) => x.id + x.message))
  })
})

describe('layering', () => {
  it('types/, domain/, services/, data/, api/ never import Vue or the UI', () => {
    const walk = (d: string): string[] =>
      readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]))
    for (const dir of ['src/types', 'src/domain', 'src/services', 'src/data', 'src/api']) {
      for (const f of walk(dir)) {
        const src = readFileSync(f, 'utf8')
        expect(src, f).not.toMatch(/from ['"](vue|pinia|vue-router)['"]/)
        expect(src, f).not.toMatch(/@\/(components|views|stores)/)
      }
    }
  })
})
