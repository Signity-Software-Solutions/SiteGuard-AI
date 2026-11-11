import type { PersonDetection, Rect, TrackedPerson } from '@/types'

/** Shared across cameras so track IDs are unique site-wide (Worker #17 is one number everywhere). */
export class TrackIdAllocator {
  private next = 1
  allocate(): number {
    return this.next++
  }
  reset(): void {
    this.next = 1
  }
}

interface Track {
  id: number
  bbox: Rect
  missed: number
}

function iou(a: Rect, b: Rect): number {
  const x1 = Math.max(a.x, b.x)
  const y1 = Math.max(a.y, b.y)
  const x2 = Math.min(a.x + a.width, b.x + b.width)
  const y2 = Math.min(a.y + a.height, b.y + b.height)
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1)
  const union = a.width * a.height + b.width * b.height - inter
  return union <= 0 ? 0 : inter / union
}

const center = (r: Rect) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 })

/**
 * Minimal per-camera tracker: greedy IoU/centre-distance association with a short grace period.
 * Same idea as the office project's tracker, minus Re-ID/face - stable IDs only while visible.
 * Production would swap in ByteTrack/BoT-SORT without changing the TrackedPerson contract.
 */
export class CentroidTracker {
  private tracks: Track[] = []
  constructor(
    private readonly ids: TrackIdAllocator,
    private readonly maxMissed = 8,
    private readonly maxCenterDist = 12,
  ) {}

  update(detections: PersonDetection[]): TrackedPerson[] {
    const pairs: { ti: number; di: number; score: number }[] = []
    this.tracks.forEach((t, ti) =>
      detections.forEach((d, di) => {
        const o = iou(t.bbox, d.bbox)
        const ca = center(t.bbox)
        const cb = center(d.bbox)
        const dist = Math.hypot(ca.x - cb.x, ca.y - cb.y)
        if (o > 0.1 || dist <= this.maxCenterDist) pairs.push({ ti, di, score: o + (1 - Math.min(dist / this.maxCenterDist, 1)) * 0.5 })
      }),
    )
    pairs.sort((a, b) => b.score - a.score)
    const usedT = new Set<number>()
    const usedD = new Set<number>()
    const assigned = new Map<number, number>() // di → trackIndex
    for (const p of pairs) {
      if (usedT.has(p.ti) || usedD.has(p.di)) continue
      usedT.add(p.ti)
      usedD.add(p.di)
      assigned.set(p.di, p.ti)
    }

    const out: TrackedPerson[] = []
    detections.forEach((d, di) => {
      const ti = assigned.get(di)
      let track: Track
      if (ti === undefined) {
        track = { id: this.ids.allocate(), bbox: d.bbox, missed: 0 }
        this.tracks.push(track)
      } else {
        track = this.tracks[ti]
        track.bbox = d.bbox
        track.missed = 0
      }
      out.push({ ...d, trackId: track.id })
    })
    this.tracks.forEach((t, ti) => {
      if (!usedT.has(ti) && !out.some((o) => o.trackId === t.id)) t.missed++
    })
    this.tracks = this.tracks.filter((t) => t.missed <= this.maxMissed)
    return out
  }

  reset(): void {
    this.tracks = []
  }
}
