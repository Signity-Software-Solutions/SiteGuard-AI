import type { CameraConfig, Rect } from '@/types'

/** Foot point of a bbox (bottom-centre) - what determines which ground zone a person stands in. */
export function footPoint(b: Rect): { x: number; y: number } {
  return { x: b.x + b.width / 2, y: b.y + b.height }
}

export function pointInRect(p: { x: number; y: number }, r: Rect): boolean {
  return p.x >= r.x && p.x <= r.x + r.width && p.y >= r.y && p.y <= r.y + r.height
}

export function resolveZoneId(camera: CameraConfig, bbox: Rect): string {
  const p = footPoint(bbox)
  for (let i = camera.regions.length - 1; i >= 0; i--) {
    if (pointInRect(p, camera.regions[i].rect)) return camera.regions[i].zoneId
  }
  return camera.defaultZoneId
}
