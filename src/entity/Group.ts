import {Entity, PrimaryColumn, Column, Index, BaseEntity} from "typeorm";
import { NOTIFICATION_LEVEL } from "../types";

@Entity()
export class Group extends BaseEntity {
    @PrimaryColumn()
    telegramId: number;

    @Column()
    telegramChatId: number;

    @Column({ nullable: true })
    groupName: string;

    @Column({ nullable: true })
    languageCode: string;

    @Column()
    dacNotificationLevel: number;

    get DacNotificationLevel() {
        return this.dacNotificationLevel as NOTIFICATION_LEVEL
    }
}
