import { logger } from "../logger"
import client from "./dfuse"
import { DAC_MULTI_SIG_ACCOUNT } from "../constants"
import { TEosAction, GetChainInfoResult } from "./types"
import { TProposalsRow } from "../types"
import { TransactionLifecycle, ActionTrace } from "@dfuse/client"

type TMatcher = (trace: ActionTrace<any>) => boolean;
const getMatchingAction = (tx:TransactionLifecycle, matcher:TMatcher) => {
  const traces = tx.execution_trace!.action_traces

  while (traces.length > 0) {
    const curTrace = traces.shift()!

    if (matcher(curTrace)) {
      return curTrace
    }

    if (Array.isArray(curTrace.inline_traces)) {
      traces.push(...curTrace.inline_traces)
    }
  }

  return null;
}

export const fetchMsigMetadata = async (action: TEosAction) => {
  try {
    const { proposer, proposal_name } = action.data
    const blockNumber = action.blockNumber - 1 // in the past because when it's a cancelled action, it's deleted already
    const msig = await fetchRow<TProposalsRow>({ code: DAC_MULTI_SIG_ACCOUNT, scope: proposer, table: `proposals`, lower_bound: proposal_name }, blockNumber)
    
    const metadataTransaction = await client.fetchTransaction(msig.transactionid)

    const actionWithMetadata = getMatchingAction(metadataTransaction, (trace) => {
      return trace.act.data.proposer === proposer && trace.act.data.proposal_name === proposal_name && Boolean(trace.act.data.metadata)
    })

    if(!actionWithMetadata) {
      return {
        title: `Unknown`,
        description: ``,
      }
    }

    const metadata = JSON.parse(actionWithMetadata.act.data.metadata) || {}

    return {
      title: metadata.title || `Unknown`,
      description: metadata.description,
    }
  } catch (error) {
    logger.warn(`Fetching Msig (${action.data.proposal_name}) metadata failed: ${error.message}`)
    return {
      title: `Unknown`,
      description: ``,
    }
  }
}

// https://github.com/EOSIO/eosjs-api/blob/master/docs/api.md#eos.getTableRows
type GetTableRowsOptions = {
  json?: boolean
  code?: string
  scope?: string
  table?: string
  lower_bound?: number | string
  upper_bound?: number | string
  limit?: number
  key_type?: string
  index_position?: string
}

export const fetchRow = async <T>(options: GetTableRowsOptions, blockNumber?: number): Promise<T> => {
  const mergedOptions = {
      json: true,
      lower_bound: undefined,
      upper_bound: undefined,
      limit: 9999,
      ...options,
  }

  const result = await client.stateTableRow<T>(mergedOptions.code, mergedOptions.scope, mergedOptions.table, `${mergedOptions.lower_bound}`, {
      json: true,
      keyType: `name`,
      blockNum: blockNumber,
  })

  return result.row.json
}

export const fetchHeadBlockNumber =  async () => {
  const response = await client.apiRequest<GetChainInfoResult>(
    `/v1/chain/get_info`,
    `GET`,
  )
  return response.last_irreversible_block_num;
}