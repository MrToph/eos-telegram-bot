import { logger } from "../logger";

export default function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  logger.error(`errorHandler: ${err.message}`);
  res.status(500);
  res.json({ error: err.message });
}
