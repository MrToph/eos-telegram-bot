import path from 'path'
import { createConnection, getConnection, ConnectionOptions, getConnectionOptions } from "typeorm";
import { logger } from "./logger";
import { isProduction } from './utils';
import TelegramTransport from './logger/TelegramTransport';
import { User } from './entity/User';

let connection = null;

const fileName = `telegram.sqlite`;
// CHANGEME: depending on where you want to log on production
const dbPath =
  isProduction()
    ? `/storage/${fileName}`
    : `${fileName}`;


logger.info(`Database path: ${path.resolve(dbPath)}`)

export const getDb = async () => {
  if (!connection) {
    // get options from ormconfig.json
    let options = (await getConnectionOptions().catch(() => ({}))) as ConnectionOptions

    connection = await createConnection({
      ...options,
      type: `sqlite`,
      database: dbPath,
    });
    await connection.runMigrations();

    if (process.env.ADMIN_TELEGRAM_HANDLE) {
      logger.add(new TelegramTransport({
        level: `error`,
        getChatId: async () => {
          // wait until DB is ready
          try {
            const admin = await User.findOne({
              telegramHandle: process.env.ADMIN_TELEGRAM_HANDLE
            })

            if (admin) return admin.telegramChatId
          } catch (err) {
            console.error(err.message)
          }
          return undefined
        }
      }))
    }
  }

  return connection;
};
