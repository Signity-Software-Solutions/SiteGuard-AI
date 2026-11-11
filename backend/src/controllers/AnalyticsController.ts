import { Controller } from '@tsed/di'
import { Get } from '@tsed/schema'
import { QueryParams } from '@tsed/platform-params'
import { buildDailyCompliance } from '../data/history'
import { resolveAnchor } from './anchor'

@Controller('/analytics')
export class AnalyticsController {
  @Get('/daily-compliance')
  dailyCompliance(@QueryParams('anchor') anchor?: string) {
    return buildDailyCompliance(resolveAnchor(anchor))
  }
}
