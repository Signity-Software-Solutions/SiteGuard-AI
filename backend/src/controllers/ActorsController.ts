import { Controller } from '@tsed/di'
import { Get } from '@tsed/schema'
import { DEMO_ACTORS } from '../data/actors'

@Controller('/actors')
export class ActorsController {
  /** Scripted person detections that drive the demo camera feeds. */
  @Get('/')
  actors() {
    return DEMO_ACTORS
  }
}
