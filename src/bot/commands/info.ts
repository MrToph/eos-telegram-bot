import { Telegraf } from 'telegraf'
import Config from '../../entity/Config'
import { ExtendedContextMessageUpdate } from '../../types'
import { fetchHeadBlockNumber } from '../../eos/fetch'
import { formatTimeDifference } from '../../utils'

export default function setupInfo(bot: Telegraf<ExtendedContextMessageUpdate>) {
  bot.command(`info`, async (ctx) => {
    const config = await Config.findOne(0)
    const lastProcessedBlock = config ? config.lastCommittedBlockNumber : NaN
    const currentBlock = await fetchHeadBlockNumber()

    const diffBlock = currentBlock - lastProcessedBlock
    const diffBlockString = `${diffBlock} (${formatTimeDifference(Math.floor(diffBlock / 2))})`

    const message = JSON.stringify({
      version: process.env.npm_package_version,
      lastProcessedBlock,
      blocksBehind: diffBlockString,
      user: ctx.user,
      group: ctx.group,
    }, null, 2)

    ctx.replyWithMarkdown(`ℹ️ Bot and User info:

\`\`\`json
${message}
\`\`\`
`)
  })
}