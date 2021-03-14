import { ContextMessageUpdate } from 'telegraf'
import { User } from '../../entity/User';
import { NOTIFICATION_LEVEL } from '../../types';
import { logger } from '../../logger';
import { Group } from '../../entity/Group';

export type withUserAndGroupType = {
  user: User
  group?: Group
}

export async function withUserAndGroup(ctx: ContextMessageUpdate, next) {
  try {
    // attach user to ctx
    const telegramUserId = ctx.from.id
    let user = await User.findOne(telegramUserId)

    if (!user) {
      user = new User()
      user.telegramId = telegramUserId
      user.telegramHandle = ctx.from.username
      user.telegramChatId = ctx.from.id
      user.firstName = ctx.from.first_name
      user.lastName = ctx.from.last_name
      user.languageCode = ctx.from.language_code
      user.dacNotificationLevel = NOTIFICATION_LEVEL.NONE
      await user.save()
    
      logger.verbose(`new user:`, user)
    }

    // @ts-ignore
    ctx.user = user

    // attach group to ctx
    const isGroupChat = ctx.chat.type === `group`
    if(isGroupChat) {
      const telegramGroupId = ctx.chat.id
      let group = await Group.findOne(telegramGroupId)

      if (!group) {
        group = new Group()
        group.telegramId = telegramGroupId
        group.telegramChatId = ctx.chat.id
        group.groupName = ctx.chat.title
        // take language code from admin's settings
        group.languageCode = ctx.from.language_code
        group.dacNotificationLevel = NOTIFICATION_LEVEL.NONE
      }
      await group.save()

      logger.verbose(`new group:`, group)
    }


    // @ts-ignore
    ctx.group = group

    next()
  } catch (err) {
    logger.error(`withUserAndGroup middleware: ${err.message}\n${JSON.stringify(ctx.message.from)}`)
    // ctx.replyWithMarkdown(`Could not find and create your user. Please contact support`)
  }
}