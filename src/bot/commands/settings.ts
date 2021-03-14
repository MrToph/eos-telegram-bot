import { Markup, Telegraf } from "telegraf";
import { logger } from "../../logger";
import { NOTIFICATION_LEVEL, ExtendedContextMessageUpdate } from "../../types";
import { userInfo } from "os";
import { checkGroupAdmin } from "../middlewares/checkGroupAdmin";
import { Group } from "../../entity/Group";

const allNotificationLevels = [
  NOTIFICATION_LEVEL.ALL,
  NOTIFICATION_LEVEL.IMPORTANT,
  NOTIFICATION_LEVEL.NONE
]

const getTextForNotificationLevel = (level: NOTIFICATION_LEVEL) => {
  switch(level) {
    case NOTIFICATION_LEVEL.ALL:
      return `All`
    case NOTIFICATION_LEVEL.IMPORTANT:
      return `Important`
    case NOTIFICATION_LEVEL.NONE:
      return `None`
  }
}

export default function setupSettings(
  bot: Telegraf<ExtendedContextMessageUpdate>
) {
  bot.action(allNotificationLevels.map(l => `settings/notifications/${l}`), checkGroupAdmin, async ctx => {
    try {
      const level = Number.parseInt(ctx.callbackQuery.data.split(`/`).pop(), 10) as NOTIFICATION_LEVEL

      if(ctx.group) {
        ctx.group.dacNotificationLevel = level
        ctx.group.save()
      } else {
        ctx.user.dacNotificationLevel = level;
        ctx.user.save()
      }

      await ctx.editMessageText(`🗣️ Notifications changed to "${getTextForNotificationLevel(level)}"`, {
        reply_markup: Markup.inlineKeyboard(
          []
        )
      });
    } catch (error) {
      logger.error(`setupSettings failed with: `, error.message)
      return ctx.editMessageText(`Failed.`)
    }
  });

  bot.action("settings/notifications", checkGroupAdmin, async ctx => {
    const activeNotificationLevel = ctx.group ? ctx.group.dacNotificationLevel : ctx.user.dacNotificationLevel
    await ctx.editMessageText(`🗣️ Receive Notifications`, {
      reply_markup: Markup.inlineKeyboard(
        allNotificationLevels.map(level =>
          Markup.callbackButton(`${getTextForNotificationLevel(level)}${level === activeNotificationLevel ? ` ✅` : ``}`, `settings/notifications/${level}`)
        )
      )
    });
  });
 
  bot.command("settings", checkGroupAdmin, async ctx => {
    await ctx.reply(
      `⚙️ Change settings${ctx.group ? ` for group` : ``}`,
      Markup.inlineKeyboard([
        Markup.callbackButton("🗣️ Notifications", "settings/notifications")
      ]).extra()
    );
  });
}
