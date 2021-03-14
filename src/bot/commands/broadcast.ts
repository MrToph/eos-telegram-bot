import { Telegraf } from 'telegraf'
import { ExtendedContextMessageUpdate, NOTIFICATION_LEVEL } from '../../types'
import { sendToAll } from '../utils'

export default function setupBroadcast(bot: Telegraf<ExtendedContextMessageUpdate>) {
  bot.command(`broadcast`, async (ctx) => {
    if(ctx.user.telegramHandle !== process.env.ADMIN_TELEGRAM_HANDLE) {
      return ctx.replyWithMarkdown(`Unauthorized to broadcast`)
    }
    
    const message = ctx.message.text.replace(`/broadcast`, ``)
    await sendToAll(NOTIFICATION_LEVEL.IMPORTANT, message)
  })
}