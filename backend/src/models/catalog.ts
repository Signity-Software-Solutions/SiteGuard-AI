import type { PPEType, Severity, ViolationType, ZoneType } from './types'

export const PPE_META: Record<PPEType, { label: string; short: string; noun: string; violation: ViolationType }> = {
  helmet: { label: 'Safety Helmet', short: 'Helmet', noun: 'a safety helmet', violation: 'MISSING_HELMET' },
  safetyVest: { label: 'Safety Vest', short: 'Vest', noun: 'a safety vest', violation: 'MISSING_VEST' },
  safetyShoes: { label: 'Safety Shoes', short: 'Shoes', noun: 'safety shoes', violation: 'MISSING_SHOES' },
  goggles: { label: 'Safety Goggles', short: 'Goggles', noun: 'safety goggles', violation: 'MISSING_GOGGLES' },
  harness: { label: 'Safety Harness', short: 'Harness', noun: 'a safety harness', violation: 'MISSING_HARNESS' },
}

export const SEVERITY_WEIGHT: Record<Severity, number> = { LOW: 1, MEDIUM: 2, HIGH: 4, CRITICAL: 8 }

/** Zone types where a missing item reads as "entered <zone> without …". */
export const STRICT_ZONE_TYPES: ZoneType[] = ['high-risk', 'restricted']
