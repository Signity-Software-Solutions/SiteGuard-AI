import 'reflect-metadata'
import { PlatformExpress } from '@tsed/platform-express'
import { Server } from './Server'

async function bootstrap() {
  const platform = await PlatformExpress.bootstrap(Server)
  await platform.listen()
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
