import { TEosAction } from "../eos/types";
import bot from "./index";
import { User } from "../entity/User";
import { NOTIFICATION_LEVEL } from "../types";
import { Markup } from "telegraf";
import { fetchMsigMetadata } from "../eos/fetch";
import { logger } from "../logger";
import { ParseMode } from "telegraf/typings/telegram-types";
import { getUsersToNotify, sendToUsers, sendToAll } from "./utils";

const getNotificationLevelForAction = (action: TEosAction) => {
  switch (action.name) {
    case "cancelled":
    case "executed":
    case "proposed":
        return NOTIFICATION_LEVEL.IMPORTANT;
    case "clean":
    case "approved":
    case "unapproved":
    default:
      return NOTIFICATION_LEVEL.ALL;
  }
};

const getMessageForAction = async (action: TEosAction): Promise<[string, any]> => {
  const memberClientButton = Markup.urlButton(
    "🔎 VIGOR.ai",
    `https://vigor.ai/dac-activity/review-msigs`
  );

  const defaultOptions = {
    parse_mode: `Markdown` as ParseMode,
    disable_web_page_preview: true,
    // reply_markup: Markup.inlineKeyboard([memberClientButton]),
  };

  switch (action.name) {
    case "proposed":
      const metadata = JSON.parse(action.data.metadata);
      const description = metadata.description
        ? `\n${metadata.description}`
        : ``;
      return [
        `🚨 New Proposal by ${action.data.proposer} (_${action.data.proposal_name}_):
*${metadata.title}*${description}
`,
        {
          ...defaultOptions,
          reply_markup: Markup.inlineKeyboard([
            memberClientButton,
            // getBloksButton(action.data.proposer, action.data.proposal_name)
          ])
        }
      ];
    case `cancelled`: {
      const metadata = await fetchMsigMetadata(action)
      const description = metadata.description
        ? `\n${metadata.description}`
        : ``;
      return [
        `🔥 Proposal by ${action.data.proposer} was cancelled (_${action.data.proposal_name}_):
*${metadata.title}*${description}
`,
        defaultOptions
      ];
    }
    case `executed`: {
      const metadata = await fetchMsigMetadata(action)
      const description = metadata.description
        ? `\n${metadata.description}`
        : ``;
      return [
        `🚀 Proposal by ${action.data.proposer} was executed (_${action.data.proposal_name}_):
*${metadata.title}*${description}
`,
        defaultOptions
      ];
    }
    case `approved`: {
      const metadata = await fetchMsigMetadata(action)
      return [
        `✅ Proposal *"${metadata.title}"* was approved by ${action.data.approver}. (_${action.data.proposal_name}_)`,
        defaultOptions
      ];
    }
    case `unapproved`: {
      const metadata = await fetchMsigMetadata(action)
      return [
        `❌ Proposal *"${metadata.title}"* was unapproved by ${action.data.unapprover}. (_${action.data.proposal_name}_)`,
        defaultOptions
      ];
    }
    default: {
      return [
        `👀 New VigorDAC action: *${action.name}*

\`\`\`json
${JSON.stringify(action.data, null, 2)}
\`\`\`
      `,
        defaultOptions
      ];
    }
  }
};

const onAction = async (action: TEosAction) => {
  const notificationLevel = getNotificationLevelForAction(action);

  const args = await getMessageForAction(action);
  await sendToAll(notificationLevel, args[0], args[1])
};

export default onAction;
