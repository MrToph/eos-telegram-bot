import { Telegraf, ContextMessageUpdate, Composer, Markup } from 'telegraf'
import Stage from 'telegraf/stage'
import WizardScene from 'telegraf/scenes/wizard'
import session from 'telegraf/session'
import { logger } from '../../logger';


const stepHandler = new Composer();
stepHandler.action("next", ctx => {
  ctx.reply("Step 2. Via inline button");
  return (ctx as any).wizard.next();
});
stepHandler.command("next", ctx => {
  ctx.reply("Step 2. Via command");
  return (ctx as any).wizard.next();
});
stepHandler.use(ctx =>
  ctx.replyWithMarkdown("Press `Next` button or type /next")
);

const settingsWizard = new WizardScene('settings',
  (ctx) => {
    ctx.reply('Step 1', Markup.inlineKeyboard([
      Markup.urlButton('❤️', 'http://telegraf.js.org'),
      Markup.callbackButton('➡️ Next', 'next')
    ] as any).extra())
    return ctx.wizard.next()
  },
  stepHandler,
  (ctx) => {
    ctx.reply('Step 3')
    return ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('Step 4')
    return ctx.wizard.next()
  },
  (ctx) => {
    ctx.reply('Done')
    return ctx.scene.leave()
  }
)

const stage = new Stage([settingsWizard]);
stage.command('cancel', (ctx) => {
    ctx.reply("Operation canceled");
    return ctx.scene.leave();
});

export default function setupSettings(bot: Telegraf<ContextMessageUpdate & { scene : any }>) {
  bot.use(session())
  bot.use(stage.middleware()) 
  bot.command('settings', async ctx => {
    await ctx.scene.enter('settings');
  })
}