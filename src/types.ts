import { ContextMessageUpdate } from "telegraf"
import { withUserAndGroupType } from "./bot/middlewares/withUserAndGroup"

export enum NOTIFICATION_LEVEL {
  NONE, // never notify
  IMPORTANT,
  ALL,
}

export type TProposalsRow = {
  modifieddate: number
  transactionid: string
  proposalname: string
}

export type ExtendedContextMessageUpdate = ContextMessageUpdate & withUserAndGroupType