import { env } from '../shared/config/env'
import { logger } from '../shared/infra/logger'
import { createApp } from './app'

createApp().listen(env.PORT, () => {
  logger.info(`Weave API em http://localhost:${env.PORT}`)
})
