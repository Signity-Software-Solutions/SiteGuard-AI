import type { PPEDetectionResult, PolicyConfig, PPEType, SafetyAlert, ViolationType } from '@/types'
import { PPE_TYPES } from '@/types'
import { PPE_META } from '@/domain/catalog'
import { evaluateCompliance } from '@/domain/rules'
import { CAMERAS, ZONES, cameraById, zoneById } from './site'

/** Seeded PRNG (mulberry32): "random-looking" but identical on every load. */
function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pick<T>(r: () => number, items: { v: T; w: number }[]): T {
  const total = items.reduce((s, i) => s + i.w, 0)
  let x = r() * total
  for (const i of items) {
    x -= i.w
    if (x <= 0) return i.v
  }
  return items[items.length - 1].v
}

/** Demo clock origin: today at 14:32:00 local time. */
export function demoAnchorMs(now = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 32, 0, 0).getTime()
}

// A few workers are repeat offenders so "repeated violations" analytics has a story to tell.
const HEAVY: Record<number, number> = { 17: 10, 8: 8, 23: 7, 4: 6, 16: 6, 10: 4, 12: 4 }
const WORKER_WEIGHTS = Array.from({ length: 24 }, (_, i) => ({ v: i + 1, w: HEAVY[i + 1] ?? 1 }))

const ZONE_WEIGHTS = [
  { v: 'z-highrise', w: 5 }, { v: 'z-welding', w: 4 }, { v: 'z-crane', w: 3 }, { v: 'z-excavation', w: 2 },
  { v: 'z-material', w: 2 }, { v: 'z-entrance', w: 2 }, { v: 'z-restricted', w: 1.2 },
]
const PPE_WEIGHTS: Record<PPEType, number> = { helmet: 3, goggles: 2.2, harness: 2, safetyVest: 1.2, safetyShoes: 0.7 }
const ZONE_CAMERA: Record<string, string[]> = {
  "z-entrance": ["CAM-01"], "z-material": ["CAM-03"], "z-welding": ["CAM-07"], "z-excavation": ["CAM-02", "CAM-06"],
  "z-crane": ["CAM-04"], "z-restricted": ["CAM-02"], "z-highrise": ["CAM-03", "CAM-05"],
}

/** ~14 days of resolved historical violations, evaluated through the real rule engine. */
export function buildHistory(anchorMs: number, policy: PolicyConfig, days = 14): SafetyAlert[] {
  const r = rng(20240611)
  const raw: { at: number; trackId: number; zoneId: string; cameraId: string; ppe?: PPEType; kind: 'missing' | 'improper' | 'restricted' }[] = []
  const dayMs = 86_400_000
  const startOfToday = anchorMs - (14 * 3600 + 32 * 60) * 1000

  for (let d = 0; d < days; d++) {
    const dayStart = startOfToday - d * dayMs
    const dow = new Date(dayStart).getDay()
    const weekend = dow === 0 || dow === 6
    // Gradual improvement story: more violations in the past, fewer recently.
    const base = weekend ? 3 : 7 + Math.round((d / days) * 7)
    const count = d === 0 ? 7 : base + Math.floor(r() * 4)
    for (let i = 0; i < count; i++) {
      const latest = d === 0 ? 14 * 3600 + 10 * 60 : 17 * 3600 + 30 * 60
      const secs = 7 * 3600 + Math.floor(r() * (latest - 7 * 3600))
      const zoneId = pick(r, ZONE_WEIGHTS)
      const cams = ZONE_CAMERA[zoneId]
      const cameraId = cams[Math.floor(r() * cams.length)]
      const trackId = pick(r, WORKER_WEIGHTS)
      const rule = policy[zoneId]
      if (zoneId === 'z-restricted' && r() < 0.8) {
        raw.push({ at: dayStart + secs * 1000, trackId, zoneId, cameraId, kind: 'restricted' })
        continue
      }
      const reqd = PPE_TYPES.filter((p) => rule.required[p])
      const ppe = pick(r, reqd.map((p) => ({ v: p, w: PPE_WEIGHTS[p] })))
      raw.push({ at: dayStart + secs * 1000, trackId, zoneId, cameraId, ppe, kind: r() < 0.08 ? 'improper' : 'missing' })
    }
  }

  raw.sort((a, b) => a.at - b.at)
  return raw
    .map((e, idx): SafetyAlert => {
      const label = `Worker #${e.trackId}`
      const detections = {} as PPEDetectionResult
      for (const p of PPE_TYPES) detections[p] = { detected: true, confidence: 0.93 }
      if (e.kind === 'missing' && e.ppe) detections[e.ppe] = { detected: false, confidence: 0.9 }
      if (e.kind === 'improper' && e.ppe) detections[e.ppe] = { detected: true, confidence: 0.63 }
      const result = evaluateCompliance({
        person: { trackId: e.trackId, label, authorized: e.kind !== 'restricted' },
        zone: zoneById(e.zoneId),
        rule: policy[e.zoneId],
        ppe: detections,
      })
      const type: ViolationType =
        e.kind === 'restricted' ? 'RESTRICTED_ZONE_ENTRY' : e.kind === 'improper' ? 'IMPROPER_PPE' : PPE_META[e.ppe as PPEType].violation
      const v = result.violations.find((x) => x.type === type) ?? result.violations[0]
      const resolvedAfter = (2 + Math.floor(r() * 24)) * 60_000
      const cam = cameraById(e.cameraId) ?? CAMERAS[0]
      const zone = ZONES.find((z) => z.id === e.zoneId) ?? ZONES[0]
      return {
        id: `V-${1001 + idx}`,
        type: v?.type ?? type,
        severity: v?.severity ?? 'MEDIUM',
        status: 'RESOLVED',
        trackId: e.trackId,
        workerLabel: label,
        cameraId: cam.id,
        cameraName: cam.name,
        zoneId: zone.id,
        zoneName: zone.name,
        message: v?.message ?? `${label} violated a safety rule in ${zone.name}.`,
        detectedAt: e.at,
        acknowledgedAt: e.at + Math.floor(resolvedAfter / 3),
        resolvedAt: e.at + resolvedAfter,
        resolvedBy: r() < 0.65 ? 'operator' : 'auto',
        riskLevel: result.riskLevel,
        evidence: { checks: result.checks, bbox: { x: 30, y: 40, width: 8, height: 26 } },
        source: 'history',
      }
    })
    .sort((a, b) => b.detectedAt - a.detectedAt)
}

export interface DailyCompliance {
  date: number
  pct: number
}

/** Daily site compliance % for the `days` days before today (oldest first). Deterministic. */
export function buildDailyCompliance(anchorMs: number, days = 13): DailyCompliance[] {
  const r = rng(77)
  const startOfToday = anchorMs - (14 * 3600 + 32 * 60) * 1000
  const out: DailyCompliance[] = []
  for (let i = days; i >= 1; i--) {
    const date = startOfToday - i * 86_400_000
    const trend = 60 + ((days - i) / days) * 9
    const wiggle = (r() - 0.5) * 6
    out.push({ date, pct: Math.round(Math.min(96, trend + wiggle * 0.6)) })
  }
  return out
}
