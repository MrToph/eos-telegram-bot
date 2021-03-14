import {Entity, PrimaryColumn, Column, Index, BaseEntity} from "typeorm";
import { NOTIFICATION_LEVEL } from "../types";

@Entity()
export class User extends BaseEntity {
    @PrimaryColumn()
    telegramId: number;

    @Index()
    @Column()
    telegramHandle: string;

    @Column()
    telegramChatId: number;

    @Index()
    @Column({ type: 'varchar', length: 13, nullable: true })
    eosAccount: string

    @Column({ nullable: true })
    firstName: string;

    @Column({ nullable: true })
    lastName: string;

    @Column({ nullable: true })
    languageCode: string;

    @Column()
    dacNotificationLevel: number;

    get DacNotificationLevel() {
        return this.dacNotificationLevel as NOTIFICATION_LEVEL
    }
}
