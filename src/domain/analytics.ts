import type { SafetyAlert } from '@/types'

export interface CountRow {
  key: string
  label: string
  count: number
}

export function countBy(alerts: SafetyAlert[], key: (a: SafetyAlert) => string, label: (a: SafetyAlert) => string): CountRow[] {
  const m = new Map<string, CountRow>()
  for (const a of alerts) {
    const k = key(a)
    const row = m.get(k) ?? { key: k, label: label(a), count: 0 }
    row.count++
    m.set(k, row)
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export interface RepeatOffender {
  trackId: number
  label: string
  count: number
  critical: number
  topType: string
}

export function repeatOffenders(
  alerts: SafetyAlert[],
  typeLabel: (a: SafetyAlert) => string,
  minCount = 2,
  limit = 6,
): RepeatOffender[] {
  const m = new Map<number, { label: string; items: SafetyAlert[] }>()
  for (const a of alerts) {
    const e = m.get(a.trackId) ?? { label: a.workerLabel, items: [] }
    e.items.push(a)
    m.set(a.trackId, e)
  }
  return [...m.entries()]
    .filter(([, e]) => e.items.length >= minCount)
    .map(([trackId, e]) => ({
      trackId,
      label: e.label,
      count: e.items.length,
      critical: e.items.filter((a) => a.severity === 'CRITICAL').length,
      topType: countBy(e.items, (a) => a.type, typeLabel)[0].label,
    }))
    .sort((a, b) => b.count - a.count || a.trackId - b.trackId)
    .slice(0, limit)
}

export function compliancePct(total: number, compliant: number): number {
  return total === 0 ? 100 : Math.round((compliant / total) * 100)
}
