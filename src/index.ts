import "reflect-metadata";
import express from "express";
import bodyParser from "body-parser";
import { Request, Response } from "express";
import "./dotenv";
import { Routes } from "./routes";
import { logger } from "./logger";
import bot, { initBot } from "./bot";
import { getDb } from "./db";
import Watcher from "./eos/watcher";
import client from "./eos/dfuse";
import errorHandler from "./middlewares/errorHandler";
import checkAuth from "./middlewares/checkAuth";

async function start() {
  const connection = await getDb();

  // create express app
  const app = express();
  app.use(bodyParser.json());

  // register express routes from defined application routes
  Routes.forEach((route) => {
    const handlers = [
      route.isAuthenticated ? checkAuth : undefined,
      (req: Request, res: Response, next: Function) => {
        const result = new (route.controller as any)()[route.action](
          req,
          res,
          next
        );
        if (result instanceof Promise) {
          result.then((result) =>
            result !== null && result !== undefined
              ? res.send(result)
              : undefined
          );
        } else if (result !== null && result !== undefined) {
          res.json(result);
        }
      },
    ].filter(Boolean);
    (app as any)[route.method](route.route, ...handlers);
  });
  app.use(errorHandler);

  await initBot();
  // setup express app here
  // this does NOT work with body-parser. Instead use custom route
  // app.use(bot.webhookCallback(`/${process.env.WEBHOOK_PATH}`))
  // app.post(`/${process.env.WEBHOOK_PATH}`, (req, res) => {
  //     logger.debug(req.body)
  //     return bot.handleUpdate(req.body, res)
  // })

  // start express server
  app.listen(3000);

  const watcher = new Watcher(client);
  watcher.start();

  logger.info(
    "Express server has started on port 3000. Open http://localhost:3000/info"
  );
}

start().catch((error) => logger.error(error.message || error));

// dfuse sometimes soft-crashes with an unhandled promise
// breaking the contract
// TODO: just reset dfuse client + restart watcher
process.on("unhandledRejection", function (reason, p) {
  let message = reason ? (reason as any).stack : reason;
  logger.error(`Possibly Unhandled Rejection at: ${message}`);
  // application specific logging here
  process.exit(1);
});
