import {getRepository} from "typeorm";
import {NextFunction, Request, Response} from "express";
import {User} from "../entity/User";

export default class UserController {

    private userRepository = getRepository(User);

    async all(request: Request, response: Response, next: NextFunction) {
        const users = await this.userRepository.find();
        return JSON.stringify({
            users: users.map(u => u.telegramHandle)
        })
    }
}