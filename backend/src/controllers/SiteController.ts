import { Controller } from '@tsed/di'
import { Get } from '@tsed/schema'
import { CAMERAS, SITE, ZONES } from '../data/site'

@Controller('/site')
export class SiteController {
  /** Site, zones and cameras in one call - the frontend needs all three at startup. */
  @Get('/')
  site() {
    return { site: SITE, zones: ZONES, cameras: CAMERAS }
  }
}
