/**
 * Shared types. Pure TypeScript - no Vue imports anywhere under types/, domain/, services/ or mock/.
 * Coordinates use the same percent-of-frame convention as the office AI Vision zones
 * ({x, y, width, height} in 0–100).
 */

export const PPE_TYPES = ['helmet', 'safetyVest', 'safetyShoes', 'goggles', 'harness'] as const
export type PPEType = (typeof PPE_TYPES)[number]

export interface PPEDetection {
  detected: boolean
  /** Model confidence in the stated `detected` value (0–1). */
  confidence: number
}
export type PPEDetectionResult = Record<PPEType, PPEDetection>

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type CheckStatus = 'PASS' | 'WARNING' | 'FAIL' | 'NOT_REQUIRED'
export type ComplianceStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT' | 'UNKNOWN'

export type ViolationType =
  | 'MISSING_HELMET'
  | 'MISSING_VEST'
  | 'MISSING_SHOES'
  | 'MISSING_GOGGLES'
  | 'MISSING_HARNESS'
  | 'IMPROPER_PPE'
  | 'RESTRICTED_ZONE_ENTRY'
  // Reserved extension points - not produced by the demo rule engine yet:
  | 'FALL_DETECTED'
  | 'UNSAFE_CLIMBING'
  | 'MACHINERY_PROXIMITY'
  | 'FIRE_SMOKE'
  | 'CROWD_DENSITY'
  | 'MISSING_BARRICADE'
  | 'UNSAFE_LADDER'

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

// ── Sites / cameras / zones ────────────────────────────────────────────────
export type ZoneType = 'safe' | 'restricted' | 'high-risk' | 'production' | 'storage'

export interface Zone {
  id: string
  name: string
  type: ZoneType
  color: string
  description: string
}

export interface ZoneRegion {
  zoneId: string
  rect: Rect
}

export interface CameraConfig {
  id: string
  name: string
  location: string
  /** Static frame shown for this camera (public path). Empty for offline cameras. */
  image: string
  defaultZoneId: string
  /** Later regions win where regions overlap. */
  regions: ZoneRegion[]
  online: boolean
}

// ── Policy ─────────────────────────────────────────────────────────────────
export interface ZoneRule {
  zoneId: string
  required: Record<PPEType, boolean>
  severity: Record<PPEType, Severity>
  restricted: boolean
  restrictedSeverity: Severity
}
export type PolicyConfig = Record<string, ZoneRule>

// ── Frames / detection / tracking ──────────────────────────────────────────
export type PPEVisualState = 'on' | 'off' | 'improper'

/** What a demo "camera" draws. Only the demo scene renderer + demo detectors read this. */
export interface DemoActorRender {
  actorId: string
  bbox: Rect
  ppe: Record<PPEType, PPEVisualState>
  phase: number
  authorized: boolean
}

export interface Frame {
  cameraId: string
  /** Seconds on the demo clock. */
  t: number
  timestamp: number
  demo?: { actors: DemoActorRender[] }
}

export interface PersonDetection {
  bbox: Rect
  confidence: number
  /** Opaque hook the demo detector hands to the mock PPE provider. Real providers ignore it. */
  demoActorId?: string
}

export interface TrackedPerson extends PersonDetection {
  trackId: number
}

export interface PPECheck {
  ppe: PPEType
  required: boolean
  status: CheckStatus
  detected: boolean | null
  confidence: number | null
  severity: Severity
}

export interface Violation {
  type: ViolationType
  severity: Severity
  ppe?: PPEType
  zoneId: string
  message: string
}

export interface ComplianceResult {
  trackId: number
  zoneId: string
  overallStatus: ComplianceStatus
  riskLevel: Severity
  riskScore: number
  checks: PPECheck[]
  violations: Violation[]
}

export interface TrackedWorker {
  trackId: number
  label: string
  cameraId: string
  bbox: Rect
  zoneId: string
  detectionConfidence: number
  ppe: PPEDetectionResult | null
  compliance: ComplianceResult
  /** Demo-only: drives which figure the demo scene highlights. */
  demoActorId?: string
}

// ── Alerts ─────────────────────────────────────────────────────────────────
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED'

export interface SafetyAlert {
  id: string
  type: ViolationType
  severity: Severity
  status: AlertStatus
  trackId: number
  workerLabel: string
  cameraId: string
  cameraName: string
  zoneId: string
  zoneName: string
  message: string
  detectedAt: number
  acknowledgedAt?: number
  resolvedAt?: number
  resolvedBy?: 'auto' | 'operator'
  riskLevel: Severity
  evidence: { checks: PPECheck[]; bbox: Rect }
  source: 'live' | 'history'
}
