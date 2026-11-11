/**
 * Safety rule engine - the single owner of compliance / risk logic.
 * The UI renders ComplianceResult; it never recomputes statuses or risk.
 */
import type {
  ComplianceResult, ComplianceStatus, PPECheck, PPEDetectionResult, Severity, Violation, Zone, ZoneRule,
} from '@/types'
import { PPE_TYPES } from '@/types'
import { PPE_META, SEVERITY_WEIGHT, STRICT_ZONE_TYPES } from './catalog'

/** Detected with at least this confidence ⇒ PASS; detected below it ⇒ WARNING (improper / uncertain). */
export const PASS_CONFIDENCE = 0.75
export const IMPROPER_SEVERITY: Severity = 'MEDIUM'

/**
 * Person-level risk is an aggregate of violation weights (LOW 1, MEDIUM 2, HIGH 4, CRITICAL 8):
 *   score >= 16 → CRITICAL, >= 6 → HIGH, >= 3 → MEDIUM, otherwise LOW.
 * So a single missing harness is a CRITICAL *violation* but a HIGH *person risk*; helmet + harness
 * missing together escalates the person to CRITICAL.
 */
export const RISK_THRESHOLDS = { CRITICAL: 16, HIGH: 6, MEDIUM: 3 } as const

export function riskFromScore(score: number): Severity {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL'
  if (score >= RISK_THRESHOLDS.HIGH) return 'HIGH'
  if (score >= RISK_THRESHOLDS.MEDIUM) return 'MEDIUM'
  return 'LOW'
}

export interface EvaluationInput {
  person: { trackId: number; label: string; authorized?: boolean }
  zone: Zone
  rule: ZoneRule
  /** null = inference unavailable for this person → UNKNOWN. */
  ppe: PPEDetectionResult | null
}

const bare = (noun: string) => noun.replace(/^an? /, '')

export function evaluateCompliance({ person, zone, rule, ppe }: EvaluationInput): ComplianceResult {
  const strict = STRICT_ZONE_TYPES.includes(zone.type)
  const violations: Violation[] = []

  const checks: PPECheck[] = PPE_TYPES.map((p) => {
    const required = rule.required[p]
    const d = ppe?.[p] ?? null
    const severity = rule.severity[p]
    if (!required) {
      return { ppe: p, required, status: 'NOT_REQUIRED', detected: d?.detected ?? null, confidence: d?.confidence ?? null, severity }
    }
    if (!d) return { ppe: p, required, status: 'WARNING', detected: null, confidence: null, severity }
    const meta = PPE_META[p]
    if (!d.detected) {
      violations.push({
        type: meta.violation,
        severity,
        ppe: p,
        zoneId: zone.id,
        message: strict
          ? `${person.label} entered ${zone.name} without ${bare(meta.noun)}.`
          : `${person.label} is not wearing ${bare(meta.noun)}.`,
      })
      return { ppe: p, required, status: 'FAIL', detected: false, confidence: d.confidence, severity }
    }
    if (d.confidence < PASS_CONFIDENCE) {
      violations.push({
        type: 'IMPROPER_PPE',
        severity: IMPROPER_SEVERITY,
        ppe: p,
        zoneId: zone.id,
        message: `${person.label} has ${bare(meta.noun)} worn improperly.`,
      })
      return { ppe: p, required, status: 'WARNING', detected: true, confidence: d.confidence, severity: IMPROPER_SEVERITY }
    }
    return { ppe: p, required, status: 'PASS', detected: true, confidence: d.confidence, severity }
  })

  if (rule.restricted && !person.authorized) {
    violations.push({
      type: 'RESTRICTED_ZONE_ENTRY',
      severity: rule.restrictedSeverity,
      zoneId: zone.id,
      message: `${person.label} entered restricted zone ${zone.name}.`,
    })
  }

  const riskScore = violations.reduce((s, v) => s + SEVERITY_WEIGHT[v.severity], 0)
  let overallStatus: ComplianceStatus
  if (!ppe) overallStatus = 'UNKNOWN'
  else if (violations.some((v) => v.type !== 'IMPROPER_PPE')) overallStatus = 'NON_COMPLIANT'
  else if (violations.length > 0) overallStatus = 'WARNING'
  else overallStatus = 'COMPLIANT'

  return {
    trackId: person.trackId,
    zoneId: zone.id,
    overallStatus,
    riskLevel: riskFromScore(riskScore),
    riskScore,
    checks,
    violations,
  }
}
