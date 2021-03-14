import { Telegraf, ContextMessageUpdate } from 'telegraf'
import { NOTIFICATION_LEVEL, ExtendedContextMessageUpdate } from '../../types';
import { User } from '../../entity/User';
import { Group } from '../../entity/Group';
import { logger } from '../../logger';
import { getHelpMessage } from './help';
import { checkGroupAdmin } from '../middlewares/checkGroupAdmin'

export const getWelcomeMessage = (chatName:string) => `Hello _${chatName}_ 👋 I'll notify you on new VigorDAC proposals.` 

export default function setupStart(bot: Telegraf<ExtendedContextMessageUpdate>) {
  bot.command('start', checkGroupAdmin, async ctx => {
    if(ctx.group) {
      // refresh some fields
      ctx.group.telegramChatId = ctx.chat.id
      ctx.group.groupName = ctx.chat.title
      // take language code from admin's settings
      ctx.group.languageCode = ctx.from.language_code
      ctx.group.dacNotificationLevel = NOTIFICATION_LEVEL.IMPORTANT
      try {
        await ctx.group.save()
      } catch (error) {
        logger.error(`could not save group`, error.message, ctx.group)
        return;
      }
    } else {
      // refresh some fields
      ctx.user.telegramHandle = ctx.from.username
      ctx.user.telegramChatId = ctx.from.id
      ctx.user.firstName = ctx.from.first_name
      ctx.user.lastName = ctx.from.last_name
      ctx.user.languageCode = ctx.from.language_code
      ctx.user.dacNotificationLevel = NOTIFICATION_LEVEL.IMPORTANT

      try {
        await ctx.user.save()
      } catch (error) {
        logger.error(`could not save user`, error.message, ctx.user)
        return;
      }
    }

    const chatName = ctx.group ? `Members of ${ctx.group.groupName}` : ctx.user.firstName
    return ctx.replyWithMarkdown(`${getWelcomeMessage(chatName)}\n${getHelpMessage()}`, { disable_web_page_preview: true })
  })
}