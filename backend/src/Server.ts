import { Configuration, inject } from '@tsed/di'
import { PlatformApplication } from '@tsed/platform-http'
import cors from 'cors'
import { HealthController } from './controllers/HealthController'
import { SiteController } from './controllers/SiteController'
import { PolicyController } from './controllers/PolicyController'
import { ActorsController } from './controllers/ActorsController'
import { AlertsController } from './controllers/AlertsController'
import { AnalyticsController } from './controllers/AnalyticsController'

const origins = (process.env.CORS_ORIGIN ?? '*').split(',').map((o) => o.trim())

@Configuration({
  httpPort: Number(process.env.PORT ?? 8083),
  acceptMimes: ['application/json'],
  logger: { level: 'info' },
  mount: {
    '/api': [HealthController, SiteController, PolicyController, ActorsController, AlertsController, AnalyticsController],
  },
})
export class Server {
  protected app = inject(PlatformApplication)

  $beforeRoutesInit(): void {
    this.app.use(cors({ origin: origins.includes('*') ? true : origins }))
  }
}
