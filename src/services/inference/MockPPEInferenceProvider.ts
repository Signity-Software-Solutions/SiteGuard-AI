import type { Frame, PersonDetection, PPEDetectionResult, PPEType, PPEVisualState } from '@/types'
import { PPE_TYPES } from '@/types'
import type { PPEInferenceProvider, PersonDetector } from './PPEInferenceProvider'

/** Small deterministic hash → [0,1). Same inputs always give the same output (no Math.random). */
export function hash01(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * "Detects" persons by reading the demo scene's actor list and adding a small deterministic
 * confidence jitter. Stands in for a YOLO person detector.
 */
export class DemoPersonDetector implements PersonDetector {
  readonly name = 'demo-person-detector (simulated)'
  async detectPersons(frame: Frame): Promise<PersonDetection[]> {
    return (frame.demo?.actors ?? []).map((a) => ({
      bbox: a.bbox,
      confidence: round2(0.9 + hash01(`${a.actorId}|det|${Math.floor(frame.t)}`) * 0.08),
      demoActorId: a.actorId,
    }))
  }
}

/**
 * Returns scripted PPE results for demo actors. Confidence values wobble deterministically
 * once per demo-second so the UI looks alive but every run is identical.
 */
export class MockPPEInferenceProvider implements PPEInferenceProvider {
  readonly name = 'mock-ppe-v1 (simulated)'
  readonly simulated = true

  async detectPPE(frame: Frame, person: PersonDetection): Promise<PPEDetectionResult> {
    const actor = frame.demo?.actors.find((a) => a.actorId === person.demoActorId)
    const out = {} as PPEDetectionResult
    for (const p of PPE_TYPES) {
      const state: PPEVisualState = actor?.ppe[p] ?? 'off'
      out[p] = this.one(p, state, `${person.demoActorId}|${p}|${Math.floor(frame.t)}`)
    }
    return out
  }

  private one(_p: PPEType, state: PPEVisualState, seed: string) {
    const j = hash01(seed)
    if (state === 'on') return { detected: true, confidence: round2(0.86 + j * 0.12) }
    if (state === 'improper') return { detected: true, confidence: round2(0.58 + j * 0.08) }
    return { detected: false, confidence: round2(0.84 + j * 0.13) }
  }
}
