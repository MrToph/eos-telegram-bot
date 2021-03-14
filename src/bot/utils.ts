import { User } from "../entity/User";
import { MoreThanOrEqual } from "typeorm";
import { NOTIFICATION_LEVEL } from "../types";
import bot from ".";
import { logger } from "../logger";
import { Group } from "../entity/Group";

export const getBloksMsigLink = (proposer, proposalId) =>
  `https://bloks.io/msig/${proposer}/${proposalId}`;

export const getUsersToNotify = async (
  notificationLevel: NOTIFICATION_LEVEL
) => {
  return User.find({
    dacNotificationLevel: MoreThanOrEqual(notificationLevel),
  });
};

export const getGroupsToNotify = async (
  notificationLevel: NOTIFICATION_LEVEL
) => {
  return Group.find({
    dacNotificationLevel: MoreThanOrEqual(notificationLevel),
  });
};

export const sendToUser = async (user: User, message, messageOptions?) => {
  try {
    await bot.telegram.sendMessage(
      user.telegramChatId,
      message,
      messageOptions
    );
  } catch (error) {
    // ignore 403: Forbidden: bot was blocked by the user
    if (error.code === 403) {
      logger.info(error.message);
    } else {
      logger.error(error.message);
    }
  }
};

export const sendToUsers = async (users: User[], message, messageOptions?) => {
  for (const user of users) {
    // https://core.telegram.org/bots/api#sendmessage
    try {
      await bot.telegram.sendMessage(
        user.telegramChatId,
        message,
        messageOptions
      );
    } catch (error) {
      // ignore 403: Forbidden: bot was blocked by the user
      if (error.code !== 403) {
        logger.error(error.message);
      }
    }
  }
};

export const sendToAll = async (
  notificationLevel: NOTIFICATION_LEVEL,
  message,
  messageOptions?
) => {
  const users = await getUsersToNotify(notificationLevel);
  const groups = await getGroupsToNotify(notificationLevel);

  for (const toNotify of [...users, ...groups]) {
    // https://core.telegram.org/bots/api#sendmessage
    try {
      await bot.telegram.sendMessage(
        toNotify.telegramChatId,
        message,
        messageOptions
      );
    } catch (error) {
      // ignore 403: Forbidden: bot was blocked by the user
      if (error.code !== 403) {
        logger.error(error.message);
      }
    }
  }
};
