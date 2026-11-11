import { Controller } from '@tsed/di'
import { Get } from '@tsed/schema'
import { defaultPolicy } from '../data/policy'

@Controller('/policy')
export class PolicyController {
  /** Baseline PPE policy per zone. Client-side edits are layered on top by the frontend. */
  @Get('/defaults')
  defaults() {
    return defaultPolicy()
  }
}
