import type { DemoActorScript, Rect } from '@/types'

const r2 = (n: number) => Math.round(n * 100) / 100

/** Small deterministic detector-style jitter around the anchor box (± ~0.2 % of frame). */
export function actorBBox(a: DemoActorScript, t: number): { bbox: Rect; phase: number } {
  const seed = a.id.charCodeAt(1) * 7 + a.id.charCodeAt(2) * 13
  const period = 9 + (seed % 7)
  const ph = (seed % 628) / 100
  const dx = 0.2 * Math.sin((2 * Math.PI * t) / period + ph)
  const dy = 0.12 * Math.sin((2 * Math.PI * t) / (period * 1.3) + ph * 1.7)
  const b = a.box
  return {
    bbox: { x: r2(Math.max(0, b.x + dx)), y: r2(Math.max(0, b.y + dy)), width: b.width, height: b.height },
    phase: t,
  }
}
