import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
import Config from "../entity/Config";
import bot from "../bot";

export default class InfoController {
    async version(request: Request, response: Response, next: NextFunction) {
        const config = await Config.findOne(0)
        const lastProcessedBlock = config ? config.lastCommittedBlockNumber : NaN
        const botStatus = await bot.telegram.getWebhookInfo()
        delete botStatus.url

        return JSON.stringify({
          version: process.env.npm_package_version,
          lastProcessedBlock,
          botStatus,
        })
    }
}