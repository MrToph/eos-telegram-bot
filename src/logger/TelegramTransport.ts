import Transport from 'winston-transport'
import bot from '../bot';
import { ParseMode } from 'telegraf/typings/telegram-types';

type TelegramTransportOptions = {
  level: string,
  getChatId: () => Promise<number>,
}

export default class TelegramTransport extends Transport {
  chatIdPromise
  constructor(opts:TelegramTransportOptions) {
    super(opts);
    this.chatIdPromise = opts.getChatId()
  }

  async log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      const chatId = await this.chatIdPromise
      if(chatId) {
        const messageOptions = {
          parse_mode: `Markdown` as ParseMode,
          disable_web_page_preview: true,
        };
        const message = `🥺 *Error*
\`\`\`json
${info.message}
\`\`\`
`
        await bot.telegram.sendMessage(chatId, message, messageOptions);
      }
    } catch {}

    callback();
  }
};