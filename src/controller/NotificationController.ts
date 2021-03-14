import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {User} from "../entity/User";
import { sendToUser } from "../bot/utils";

export default class NotificationController {

    private userRepository = getRepository(User);

    async notify(request: Request, response: Response, next: NextFunction) {
        const { telegram, message } = request.body
        if(!telegram || !message) return next(Error(`must provide 'telegram' and 'message' arguments`))

        const cleanedTelegram = telegram.replace(/^\@/i, "").trim()
        const user = await this.userRepository.findOne({ telegramHandle: cleanedTelegram });
        if(!user) return next(Error(`User with telegramId '${telegram}' did not start chatting with the bot and can therefore not be messaged.`))

        try {
          const fromApp = request.authFrom
          await sendToUser(user, `❕ Message from ${fromApp}❕\n${message}`)
          return JSON.stringify({ success: true })
        } catch (error) {
          return next(error)
        }
    }
}