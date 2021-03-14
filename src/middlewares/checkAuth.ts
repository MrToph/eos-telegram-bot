import { logger } from "../logger";

export default function checkAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if(!authHeader || authHeader !== process.env.VIGORACLE_PRESHARED_SECRET) {
    res.status(401);
    return res.send(`Unauthorized`)
  }

  req.authFrom = 'vigoracle'
  return next()
}
