import type { PolicyConfig, PPEType, Severity, ZoneRule } from '../models/types'
import { ZONES } from './site'

/** Default per-item severity. Clients can override per zone on the PPE Rules page. */
export const DEFAULT_SEVERITY: Record<PPEType, Severity> = {
  helmet: 'CRITICAL',
  safetyVest: 'HIGH',
  safetyShoes: 'HIGH',
  goggles: 'HIGH',
  harness: 'CRITICAL',
}

const REQUIRED: Record<string, PPEType[]> = {
  'z-entrance': ['helmet', 'safetyVest', 'safetyShoes'],
  'z-material': ['helmet', 'safetyVest', 'safetyShoes'],
  'z-highrise': ['helmet', 'safetyVest', 'safetyShoes', 'goggles', 'harness'],
  'z-crane': ['helmet', 'safetyVest', 'safetyShoes', 'harness'],
  'z-excavation': ['helmet', 'safetyVest', 'safetyShoes'],
  'z-welding': ['helmet', 'safetyVest', 'safetyShoes', 'goggles'],
  'z-restricted': ['helmet', 'safetyVest', 'safetyShoes'],
}

export function defaultRule(zoneId: string): ZoneRule {
  const req = REQUIRED[zoneId] ?? ['helmet', 'safetyVest', 'safetyShoes']
  return {
    zoneId,
    required: {
      helmet: req.includes('helmet'),
      safetyVest: req.includes('safetyVest'),
      safetyShoes: req.includes('safetyShoes'),
      goggles: req.includes('goggles'),
      harness: req.includes('harness'),
    },
    severity: { ...DEFAULT_SEVERITY },
    restricted: zoneId === 'z-restricted',
    restrictedSeverity: 'MEDIUM',
  }
}

export function defaultPolicy(): PolicyConfig {
  return Object.fromEntries(ZONES.map((z) => [z.id, defaultRule(z.id)]))
}
