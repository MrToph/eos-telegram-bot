import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
import Config from "../entity/Config";
import bot from "../bot";
import { fetchHeadBlockNumber } from "../eos/fetch";
import { formatTimeDifference } from "../utils";

const BLOCKS_IN_10_MINUTES = 2 * 10 * 60
export default class HealthController {
    async version(request: Request, response: Response, next: NextFunction) {
      const config = await Config.findOne(0)
      const lastProcessedBlock = config ? config.lastCommittedBlockNumber : NaN
      const currentBlock = await fetchHeadBlockNumber()
  
      const diffBlock = currentBlock - lastProcessedBlock
      const diffBlockString = `${diffBlock} (${formatTimeDifference(Math.floor(diffBlock / 2))})`
  
      // something seems wrong
      if(diffBlock > BLOCKS_IN_10_MINUTES) {
        return JSON.stringify({
          version: process.env.npm_package_version,
          lastProcessedBlock,
          blocksBehind: diffBlockString,
        })
      }
      
      return `healthy`
    }
}