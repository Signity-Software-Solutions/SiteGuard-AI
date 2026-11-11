import type { PPEType, Severity, ViolationType, ZoneType } from '@/types'

export const PPE_META: Record<PPEType, { label: string; short: string; noun: string; violation: ViolationType }> = {
  helmet: { label: 'Safety Helmet', short: 'Helmet', noun: 'a safety helmet', violation: 'MISSING_HELMET' },
  safetyVest: { label: 'Safety Vest', short: 'Vest', noun: 'a safety vest', violation: 'MISSING_VEST' },
  safetyShoes: { label: 'Safety Shoes', short: 'Shoes', noun: 'safety shoes', violation: 'MISSING_SHOES' },
  goggles: { label: 'Safety Goggles', short: 'Goggles', noun: 'safety goggles', violation: 'MISSING_GOGGLES' },
  harness: { label: 'Safety Harness', short: 'Harness', noun: 'a safety harness', violation: 'MISSING_HARNESS' },
}

export const VIOLATION_LABELS: Record<ViolationType, string> = {
  MISSING_HELMET: 'No safety helmet',
  MISSING_VEST: 'No safety vest',
  MISSING_SHOES: 'No safety shoes',
  MISSING_GOGGLES: 'No safety goggles',
  MISSING_HARNESS: 'No safety harness',
  IMPROPER_PPE: 'Improper PPE',
  RESTRICTED_ZONE_ENTRY: 'Restricted zone entry',
  FALL_DETECTED: 'Fall detected',
  UNSAFE_CLIMBING: 'Unsafe climbing',
  MACHINERY_PROXIMITY: 'Too close to machinery',
  FIRE_SMOKE: 'Fire / smoke',
  CROWD_DENSITY: 'Crowd detected',
  MISSING_BARRICADE: 'Missing barricade',
  UNSAFE_LADDER: 'Unsafe ladder usage',
}

/** Violation types the current rule engine can actually emit. */
export const ACTIVE_VIOLATION_TYPES: ViolationType[] = [
  'MISSING_HELMET', 'MISSING_VEST', 'MISSING_SHOES', 'MISSING_GOGGLES', 'MISSING_HARNESS',
  'IMPROPER_PPE', 'RESTRICTED_ZONE_ENTRY',
]
export const ROADMAP_VIOLATION_TYPES: ViolationType[] = [
  'FALL_DETECTED', 'UNSAFE_CLIMBING', 'MACHINERY_PROXIMITY', 'FIRE_SMOKE', 'CROWD_DENSITY', 'MISSING_BARRICADE', 'UNSAFE_LADDER',
]

export const SEVERITIES: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
export const SEVERITY_WEIGHT: Record<Severity, number> = { LOW: 1, MEDIUM: 2, HIGH: 4, CRITICAL: 8 }

/** Zone types where a missing item reads as "entered <zone> without …". */
export const STRICT_ZONE_TYPES: ZoneType[] = ['high-risk', 'restricted']
