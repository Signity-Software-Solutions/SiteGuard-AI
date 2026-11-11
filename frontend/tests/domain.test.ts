import { describe, expect, it } from 'vitest'
import { evaluateCompliance, riskFromScore } from '@/domain/rules'
import { AlertManager } from '@/domain/alertManager'
import { resolveZoneId } from '@/domain/zones'
import { CAMERAS, defaultPolicy, zoneById } from '@/data/reference'
import type { PPEDetectionResult } from '@/types'

const det = (d: boolean, c = 0.9) => ({ detected: d, confidence: c })
const ppe = (over: Partial<PPEDetectionResult> = {}): PPEDetectionResult => ({
  helmet: det(true), safetyVest: det(true), safetyShoes: det(true), goggles: det(true), harness: det(true), ...over,
})
const policy = defaultPolicy()
const highrise = zoneById('z-highrise')

describe('rule engine', () => {
  it('Worker #17: missing goggles + harness → NON_COMPLIANT, HIGH risk, CRITICAL harness violation', () => {
    const r = evaluateCompliance({
      person: { trackId: 17, label: 'Worker #17', authorized: true },
      zone: highrise, rule: policy['z-highrise'],
      ppe: ppe({ goggles: det(false), harness: det(false, 0.91) }),
    })
    expect(r.overallStatus).toBe('NON_COMPLIANT')
    expect(r.riskLevel).toBe('HIGH')
    expect(r.violations.map((v) => [v.type, v.severity])).toEqual([
      ['MISSING_GOGGLES', 'HIGH'],
      ['MISSING_HARNESS', 'CRITICAL'],
    ])
    expect(r.violations[1].message).toBe('Worker #17 entered High-Rise Floor without safety harness.')
  })

  it('all PPE present → COMPLIANT / LOW', () => {
    const r = evaluateCompliance({ person: { trackId: 1, label: 'Worker #1' }, zone: highrise, rule: policy['z-highrise'], ppe: ppe() })
    expect(r.overallStatus).toBe('COMPLIANT')
    expect(r.riskLevel).toBe('LOW')
    expect(r.checks.every((c) => c.status === 'PASS')).toBe(true)
  })

  it('low-confidence detection → WARNING (improper PPE), not NON_COMPLIANT', () => {
    const r = evaluateCompliance({ person: { trackId: 2, label: 'Worker #2' }, zone: highrise, rule: policy['z-highrise'], ppe: ppe({ helmet: det(true, 0.6) }) })
    expect(r.overallStatus).toBe('WARNING')
    expect(r.violations[0].type).toBe('IMPROPER_PPE')
  })

  it('unrequired PPE is ignored; requirements come from the zone rule', () => {
    const r = evaluateCompliance({
      person: { trackId: 3, label: 'Worker #3' }, zone: zoneById('z-entrance'), rule: policy['z-entrance'],
      ppe: ppe({ goggles: det(false), harness: det(false) }),
    })
    expect(r.overallStatus).toBe('COMPLIANT')
    expect(r.checks.find((c) => c.ppe === 'harness')?.status).toBe('NOT_REQUIRED')
  })

  it('editing the rule changes the outcome', () => {
    const rule = structuredClone(policy['z-highrise'])
    rule.required.harness = false
    const r = evaluateCompliance({ person: { trackId: 17, label: 'Worker #17' }, zone: highrise, rule, ppe: ppe({ harness: det(false) }) })
    expect(r.violations).toHaveLength(0)
  })

  it('restricted zone flags unauthorised workers; missing inference → UNKNOWN', () => {
    const z = zoneById('z-restricted')
    const bad = evaluateCompliance({ person: { trackId: 12, label: 'Worker #12', authorized: false }, zone: z, rule: policy['z-restricted'], ppe: ppe() })
    expect(bad.violations.map((v) => v.type)).toEqual(['RESTRICTED_ZONE_ENTRY'])
    const unk = evaluateCompliance({ person: { trackId: 12, label: 'Worker #12' }, zone: z, rule: policy['z-restricted'], ppe: null })
    expect(unk.overallStatus).toBe('UNKNOWN')
  })

  it('risk thresholds', () => {
    expect([0, 2, 4, 8, 12, 16].map(riskFromScore)).toEqual(['LOW', 'LOW', 'MEDIUM', 'HIGH', 'HIGH', 'CRITICAL'])
  })
})

describe('zones + alert manager', () => {
  it('resolves zone from foot point, falling back to camera default', () => {
    const cam = CAMERAS.find((c) => c.id === 'CAM-02')!
    expect(resolveZoneId(cam, { x: 80, y: 55, width: 2, height: 8 })).toBe('z-restricted')
    expect(resolveZoneId(cam, { x: 10, y: 20, width: 3, height: 10 })).toBe('z-excavation')
    expect(resolveZoneId(cam, { x: 10, y: 150, width: 5, height: 10 })).toBe('z-excavation')
  })

  it('debounces, dedupes and auto-resolves', () => {
    const m = new AlertManager({ confirmTicks: 3, clearTicks: 2 })
    const result = evaluateCompliance({ person: { trackId: 8, label: 'Worker #8' }, zone: zoneById('z-welding'), rule: policy['z-welding'], ppe: ppe({ goggles: det(false) }) })
    const obs = { cameraId: 'CAM-02', cameraName: 'Material Yard', zoneName: 'Welding Area', trackId: 8, label: 'Worker #8', bbox: { x: 1, y: 1, width: 1, height: 1 }, result }
    expect(m.ingest([obs], 1)).toHaveLength(0)
    expect(m.ingest([obs], 2)).toHaveLength(0)
    const ev = m.ingest([obs], 3)
    expect(ev).toHaveLength(1)
    expect(ev[0].type).toBe('SafetyViolationDetected')
    expect(m.ingest([obs], 4)).toHaveLength(0) // no duplicate
    expect(m.ingest([], 5)).toHaveLength(0)
    const out = m.ingest([], 6)
    expect(out.map((e) => e.type)).toEqual(['SafetyViolationResolved'])
  })
})
