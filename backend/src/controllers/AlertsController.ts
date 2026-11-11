import { Controller } from '@tsed/di'
import { Get, Description } from '@tsed/schema'
import { QueryParams } from '@tsed/platform-params'
import { buildHistory } from '../data/history'
import { defaultPolicy } from '../data/policy'
import { resolveAnchor } from './anchor'

@Controller('/alerts')
export class AlertsController {
  @Get('/history')
  @Description('~14 days of resolved historical violations. `anchor` = demo clock origin in epoch ms (defaults to today 14:32).')
  history(@QueryParams('anchor') anchor?: string) {
    return buildHistory(resolveAnchor(anchor), defaultPolicy())
  }
}
