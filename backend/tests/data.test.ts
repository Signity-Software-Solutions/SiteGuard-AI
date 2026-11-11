import { describe, expect, it } from 'vitest'
import { buildDailyCompliance, buildHistory, demoAnchorMs } from '../src/data/history'
import { defaultPolicy } from '../src/data/policy'
import { CAMERAS, ZONES } from '../src/data/site'
import { DEMO_ACTORS } from '../src/data/actors'

describe('mock data served by the API', () => {
  it('history is deterministic and non-trivial', () => {
    const anchor = demoAnchorMs(new Date(2026, 5, 15))
    const h1 = buildHistory(anchor, defaultPolicy())
    const h2 = buildHistory(anchor, defaultPolicy())
    expect(h1.length).toBeGreaterThan(80)
    expect(h1.map((x) => x.id + x.type)).toEqual(h2.map((x) => x.id + x.type))
    expect(new Set(h1.map((x) => x.severity)).size).toBeGreaterThanOrEqual(3)
  })

  it('daily compliance covers 13 days, oldest first', () => {
    const d = buildDailyCompliance(demoAnchorMs(new Date(2026, 5, 15)))
    expect(d).toHaveLength(13)
    expect(d[0].date).toBeLessThan(d[12].date)
  })

  it('policy has a rule for every zone, and actors/cameras reference known cameras', () => {
    const policy = defaultPolicy()
    for (const z of ZONES) expect(policy[z.id]).toBeDefined()
    const cams = new Set(CAMERAS.map((c) => c.id))
    for (const a of DEMO_ACTORS) expect(cams.has(a.cameraId)).toBe(true)
  })
})
