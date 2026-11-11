import type { CameraConfig, DailyCompliance, DemoActorScript, PolicyConfig, SafetyAlert, SiteInfo, Zone } from '@/types'

/** Base URL of the backend. Dev: '/api' is proxied by Vite. Production: set VITE_API_URL at build time. */
const BASE = ((import.meta as { env?: Record<string, string> }).env?.VITE_API_URL ?? '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json' } })
  } catch {
    throw new ApiError(`Cannot reach the backend at ${BASE}${path}`)
  }
  if (!res.ok) throw new ApiError(`GET ${path} failed (${res.status})`, res.status)
  return (await res.json()) as T
}

export interface SiteBundle {
  site: SiteInfo
  zones: Zone[]
  cameras: CameraConfig[]
}

export const api = {
  getSite: () => get<SiteBundle>('/site'),
  getActors: () => get<DemoActorScript[]>('/actors'),
  getDefaultPolicy: () => get<PolicyConfig>('/policy/defaults'),
  getHistory: (anchor: number) => get<SafetyAlert[]>(`/alerts/history?anchor=${anchor}`),
  getDailyCompliance: (anchor: number) => get<DailyCompliance[]>(`/analytics/daily-compliance?anchor=${anchor}`),
}
