import { setReferenceData } from '@/data/reference'
import { SITE, ZONES, CAMERAS } from '../../backend/src/data/site'
import { DEMO_ACTORS } from '../../backend/src/data/actors'
import { defaultPolicy } from '../../backend/src/data/policy'
import { buildDailyCompliance, buildHistory, demoAnchorMs } from '../../backend/src/data/history'

/**
 * Tests run without a server: install exactly what the backend would serve, straight from its data modules.
 * (The REST contract itself is covered by the backend's own tests.)
 */
const anchor = demoAnchorMs()
setReferenceData({
  site: SITE,
  zones: ZONES,
  cameras: CAMERAS,
  actors: DEMO_ACTORS,
  defaultPolicy: defaultPolicy(),
  history: buildHistory(anchor, defaultPolicy()),
  dailyCompliance: buildDailyCompliance(anchor),
})
