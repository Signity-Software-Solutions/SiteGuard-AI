import type { AlertStatus, ComplianceStatus, Severity } from '@/types'

/** Presentation-only helpers. No safety logic here. */

export const SEVERITY_CLASS: Record<Severity, string> = {
  CRITICAL: 'bg-critical/15 text-critical ring-critical/30',
  HIGH: 'bg-high/15 text-high ring-high/30',
  MEDIUM: 'bg-medium/15 text-medium ring-medium/30',
  LOW: 'bg-low/15 text-low ring-low/30',
}

export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  ACTIVE: 'Active',
  ACKNOWLEDGED: 'Acknowledged',
  RESOLVED: 'Resolved',
}
export const ALERT_STATUS_CLASS: Record<AlertStatus, string> = {
  ACTIVE: 'bg-critical/15 text-critical ring-critical/30',
  ACKNOWLEDGED: 'bg-warn/15 text-warn ring-warn/30',
  RESOLVED: 'bg-ok/15 text-ok ring-ok/30',
}

/** Overlay vocabulary requested for the camera view: COMPLIANT / WARNING / VIOLATION. */
export interface Visual {
  label: string
  hex: string
  chip: string
}
export function visualFor(s: ComplianceStatus): Visual {
  switch (s) {
    case 'COMPLIANT':
      return { label: 'COMPLIANT', hex: '#56B082', chip: 'bg-ok/15 text-ok ring-ok/30' }
    case 'WARNING':
      return { label: 'WARNING', hex: '#D6A03E', chip: 'bg-warn/15 text-warn ring-warn/30' }
    case 'NON_COMPLIANT':
      return { label: 'VIOLATION', hex: '#E06862', chip: 'bg-critical/15 text-critical ring-critical/30' }
    default:
      return { label: 'UNKNOWN', hex: '#8A94A3', chip: 'bg-mute/15 text-mute ring-mute/30' }
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
export const fmtTime = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}
export const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })
export const fmtDateTime = (ms: number) => `${fmtDate(ms)}, ${fmtTime(ms)}`
export const dayKey = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
export function fmtDuration(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`
}

/** "just now", "3 min ago", "2 h ago" relative to the monitoring clock. */
export function ago(ms: number, now: number): string {
  const s = Math.max(0, Math.round((now - ms) / 1000))
  if (s < 45) return "just now"
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`
}
