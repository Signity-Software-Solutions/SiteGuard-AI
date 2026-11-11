import { Controller } from '@tsed/di'
import { Get } from '@tsed/schema'

@Controller('/health')
export class HealthController {
  @Get('/')
  health() {
    return { status: 'ok', service: 'siteguard-backend' }
  }
}
