import Telegraf from 'telegraf'
import { User } from '../entity/User'
import { logger } from '../logger'
import { NOTIFICATION_LEVEL, ExtendedContextMessageUpdate } from '../types'
import setupHelp from './commands/help'
import setupStart from './commands/start'
import setupSettings from './commands/settings'
import setupInfo from './commands/info'
import { withUserAndGroup } from './middlewares/withUserAndGroup'
import setupBroadcast from './commands/broadcast'

const { WEBHOOK_DOMAIN, WEBHOOK_PATH } = process.env
logger.info(`WEBHOOK config`, { WEBHOOK_DOMAIN, WEBHOOK_PATH })

const bot = new Telegraf(process.env.BOT_TOKEN) as Telegraf<ExtendedContextMessageUpdate>

bot.use(withUserAndGroup)
setupStart(bot)
setupHelp(bot)
setupInfo(bot)
setupBroadcast(bot)
setupSettings(bot)

export const initBot = async () => {
  if (!WEBHOOK_DOMAIN) {
    logger.verbose(`Not using webhooks`)
    bot.launch()
    return
  } else {
    if (!WEBHOOK_PATH) throw new Error(`Must set WEBHOOK_PATH env var`)
    // npm install -g localtunnel && lt --port 3000
    // for testing invoke with `WEBHOOK_DOMAIN=https://----.localtunnel.me npm start`
    const webhookUrl = `${WEBHOOK_DOMAIN}/${WEBHOOK_PATH}`
    try {
      const success = await bot.telegram.setWebhook(webhookUrl)
      // const success = true
      if (success) {
        logger.info(`New webhook set to ${webhookUrl}`)
        return logger.info(await bot.telegram.getWebhookInfo())
      }
      throw Error(`Failed to update webhook`)
    } catch (error) {
      logger.error(error.message)
    }
  }
}

export default bot;
