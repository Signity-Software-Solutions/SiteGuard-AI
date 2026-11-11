import type {
  CameraConfig, DailyCompliance, DemoActorScript, PolicyConfig, SafetyAlert, SiteInfo, Zone, ZoneRule,
} from '@/types'
import { api } from '@/api/client'
import { demoAnchorMs } from '@/domain/clock'

/**
 * Reference data (site, zones, cameras, scripted actors, default policy, history) comes from the backend.
 * `loadReferenceData()` runs once before the app mounts and fills these collections *in place*, so the
 * rest of the code can keep importing them synchronously - there is no mock data in the frontend.
 */
export const ZONES: Zone[] = []
export const CAMERAS: CameraConfig[] = []
export const DEMO_ACTORS: DemoActorScript[] = []
export const SITE: SiteInfo = { id: '', name: '', client: '' }

let defaults: PolicyConfig = {}
let history: SafetyAlert[] = []
let dailyCompliance: DailyCompliance[] = []

export interface ReferenceData {
  site: SiteInfo
  zones: Zone[]
  cameras: CameraConfig[]
  actors: DemoActorScript[]
  defaultPolicy: PolicyConfig
  history: SafetyAlert[]
  dailyCompliance: DailyCompliance[]
}

const replace = <T>(target: T[], next: T[]) => target.splice(0, target.length, ...next)
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

/** Install reference data (used by `loadReferenceData` and by tests). */
export function setReferenceData(d: ReferenceData): void {
  Object.assign(SITE, d.site)
  replace(ZONES, d.zones)
  replace(CAMERAS, d.cameras)
  replace(DEMO_ACTORS, d.actors)
  defaults = clone(d.defaultPolicy)
  history = d.history
  dailyCompliance = d.dailyCompliance
}

export async function loadReferenceData(anchor = demoAnchorMs()): Promise<void> {
  const [bundle, actors, defaultPolicy, hist, daily] = await Promise.all([
    api.getSite(),
    api.getActors(),
    api.getDefaultPolicy(),
    api.getHistory(anchor),
    api.getDailyCompliance(anchor),
  ])
  setReferenceData({
    site: bundle.site, zones: bundle.zones, cameras: bundle.cameras, actors,
    defaultPolicy, history: hist, dailyCompliance: daily,
  })
}

export const zoneById = (id: string): Zone => ZONES.find((z) => z.id === id) ?? ZONES[0]
export const cameraById = (id: string): CameraConfig | undefined => CAMERAS.find((c) => c.id === id)

export const defaultPolicy = (): PolicyConfig => clone(defaults)
export const defaultRule = (zoneId: string): ZoneRule => clone(defaults[zoneId])
/** Fresh copies - callers (the alert store) mutate alerts in place. */
export const historyAlerts = (): SafetyAlert[] => clone(history)
export const dailyComplianceSeries = (): DailyCompliance[] => clone(dailyCompliance)
