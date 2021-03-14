import { ContextMessageUpdate } from 'telegraf'
import { logger } from '../../logger';

export async function checkGroupAdmin(ctx: ContextMessageUpdate, next) {
  try {
    const isGroupChat = ctx.from.id !== ctx.chat.id
    
    if(isGroupChat) {
      const fromUser = await ctx.getChatMember(ctx.from.id)
      logger.info(fromUser)
      if(![`creator`, `administrator`].includes(fromUser.status)) {
        return ctx.replyWithMarkdown(`Unauthorized`)
      }
    }

    next()
  } catch (err) {
    logger.error(`checkGroupAdmin middleware:`, err.message, ctx)
  }
}