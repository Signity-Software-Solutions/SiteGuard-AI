import type { PPEType, PPEVisualState, Rect } from '@/types'
import { PPE_TYPES } from '@/types'

/**
 * Scripted per-camera person detections, anchored to the people visible in each camera's
 * still frame (boxes are % of frame, hand-placed). Positions jitter slightly over time like a
 * real detector would. Worker identity is NOT modelled - the tracker assigns track IDs
 * (Worker #17 = track 17) and no face recognition is involved.
 *
 * Track IDs are allocated in first-seen order: cameras in CAMERAS order, actors in this order.
 * Cameras 1–2 hold 16 people, so the first person on camera 3 (Tower Level 12) is Worker #17.
 */
export interface DemoActorScript {
  id: string
  cameraId: string
  box: Rect
  ppe: Record<PPEType, PPEVisualState>
  authorized: boolean
}

function ppe(off: PPEType[] = [], improper: PPEType[] = []): Record<PPEType, PPEVisualState> {
  const r = {} as Record<PPEType, PPEVisualState>
  for (const p of PPE_TYPES) r[p] = off.includes(p) ? 'off' : improper.includes(p) ? 'improper' : 'on'
  return r
}

const A = (id: number, cameraId: string, x: number, y: number, width: number, height: number, state = ppe(), authorized = true): DemoActorScript => ({
  id: `A${String(id).padStart(2, '0')}`,
  cameraId,
  box: { x, y, width, height },
  ppe: state,
  authorized,
})

export const DEMO_ACTORS: DemoActorScript[] = [
  // CAM-01 Main Gate - workers 1–4 (two wear caps instead of hard hats)
  A(1, 'CAM-01', 16.4, 16, 21.5, 84, ppe(['helmet'])),
  A(2, 'CAM-01', 25, 16.4, 17.6, 83.6, ppe([], ['helmet'])),
  A(3, 'CAM-01', 47.3, 12.5, 34.8, 87.5),
  A(4, 'CAM-01', 77, 5.5, 23, 94.5),
  // CAM-02 Foundation Slab - workers 5–16
  A(5, 'CAM-02', 18.2, 12.9, 2.7, 11.8),
  A(6, 'CAM-02', 30.1, 6, 2.1, 11.4),
  A(7, 'CAM-02', 35.9, 4.2, 2.5, 11.8),
  A(8, 'CAM-02', 43.4, 7.6, 1.8, 11.5, ppe([], ['helmet'])),
  A(9, 'CAM-02', 53.7, 13.9, 3.3, 10),
  A(10, 'CAM-02', 30.9, 22.9, 3.2, 13.5),
  A(11, 'CAM-02', 35.3, 21.5, 2.3, 12.9),
  A(12, 'CAM-02', 25.2, 29.2, 4.7, 6.7, ppe(['safetyShoes'])),
  A(13, 'CAM-02', 80.7, 19.7, 2.7, 6.7),
  A(14, 'CAM-02', 66, 53.5, 2.6, 7.6),
  A(15, 'CAM-02', 74.1, 51.7, 4, 11.9),
  A(16, 'CAM-02', 80.7, 53, 2.3, 8, ppe(), false), // not authorised for the restricted bay
  // CAM-03 Tower Level 12 - workers 17–21 (17 & 18 work the open deck: no goggles, no harness)
  A(17, 'CAM-03', 38, 17.4, 28.4, 80.5, ppe(['goggles', 'harness'])),
  A(18, 'CAM-03', 64.5, 7.6, 27.3, 92.4, ppe(['goggles', 'harness'])),
  A(19, 'CAM-03', 7.4, 32.6, 7.4, 49.4),
  A(20, 'CAM-03', 24.6, 37.5, 7, 32),
  A(21, 'CAM-03', 34, 52, 7.4, 16),
  // CAM-04 Rigging Bay - workers 22–29 (harnessed crew; worker 26 has none)
  A(22, 'CAM-04', 16, 9.4, 11.7, 76.7),
  A(23, 'CAM-04', 27.7, 13.2, 7.4, 28),
  A(24, 'CAM-04', 27.3, 31.2, 12.5, 20),
  A(25, 'CAM-04', 26.2, 46.5, 17.5, 40.3),
  A(26, 'CAM-04', 39.5, 27.5, 16.4, 52.8, ppe(['harness'])),
  A(27, 'CAM-04', 54.1, 5.3, 12.5, 74.2),
  A(28, 'CAM-04', 71.5, 4.9, 12, 84),
  A(29, 'CAM-04', 80.9, 6.3, 8.4, 69),
  // CAM-05 Formwork Deck · Level 8 - workers 30–31
  A(30, 'CAM-05', 21, 56, 8.2, 16, ppe(['goggles'])),
  A(31, 'CAM-05', 70.7, 38.6, 4.1, 24.6),
  // CAM-06 Haul Road - workers 32–33
  A(32, 'CAM-06', 47.7, 21.5, 9.8, 52),
  A(33, 'CAM-06', 58.2, 22.9, 13, 52),
  // CAM-07 Welding Bay - worker 34 (no hi-vis)
  A(34, 'CAM-07', 2, 2, 62, 96, ppe(['safetyVest'])),
]

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
