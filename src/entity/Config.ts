import {Entity, PrimaryColumn, Column, Index, BaseEntity} from "typeorm";

@Entity()
export default class Config extends BaseEntity {
    @PrimaryColumn() id: number

    @Column()
    lastCommittedBlockNumber: number
}
