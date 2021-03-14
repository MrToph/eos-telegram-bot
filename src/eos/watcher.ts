import {
  DfuseClient,
  SearchTransactionRow,
  ActionTrace,
  GraphqlStreamMessage,
} from "@dfuse/client";
import Config from "../entity/Config";
import { logger } from "../logger";
import { TEosAction, SearchTransactionArg } from "./types";
import { sleep, isProduction } from "../utils";
import onAction from "../bot/on-action";
import { DAC_MULTI_SIG_ACCOUNT } from "../constants";
import { fetchHeadBlockNumber } from "./fetch";

const MAX_BLOCK_RANGE_PER_SEARCH = 7200 * 6; // 6 hours
// we don't want to spam people, so only look this far back if bot crashed and is restarted at some point
const MAX_PAST_LOOKUP = isProduction() ? 7200 * 1 : 7200 * 72;

const ACCOUNT_TO_WATCH = DAC_MULTI_SIG_ACCOUNT;

const isMatchingTrace = (trace: SearchTransactionArg["matchingActions"][0]) => {
  if (trace.receiver !== ACCOUNT_TO_WATCH) return false;

  // only internal actions, no token transfers etc.
  return trace.account === ACCOUNT_TO_WATCH;
};

const getActionTraces = (trans: SearchTransactionArg): TEosAction[] => {
  const matchingTraces:SearchTransactionArg["matchingActions"][0][] = [];
  const blockNumber = trans.block.num

  // BFS through transaction traces
  const traces = trans.matchingActions
  while (traces.length > 0) {
    const curTrace = traces.shift()!;

    if (isMatchingTrace(curTrace)) {
      matchingTraces.push(curTrace);
      logger.info(
        `Pending ${curTrace.account}:${curTrace.name} @ ${blockNumber}: ${JSON.stringify(curTrace.json)}`
      );
    }
  }

  return matchingTraces.map((trace) => {
    return {
      blockNumber: blockNumber,
      timestamp: trans.block.timestamp,
      account: trace.account,
      name: trace.name,
      data: trace.json,
      print: trace.console,
    };
  });
};

class Watcher {
  private client: DfuseClient;
  private config?: Config;

  private pendingActions: TEosAction[] = [];

  constructor(client: DfuseClient) {
    this.client = client;
  }

  public async start() {
    this.config = await Config.findOneOrFail({ id: 0 });
    let headBlockNumber = await fetchHeadBlockNumber();
    const diffToConfig = headBlockNumber - this.config.lastCommittedBlockNumber;
    logger.info(
      `Block number - Head: ${headBlockNumber} - Config: ${this.config.lastCommittedBlockNumber} - Diff: ${diffToConfig}`
    );

    let fromBlock = Math.max(
      this.config.lastCommittedBlockNumber,
      headBlockNumber - MAX_PAST_LOOKUP
    );
    logger.info(`Watcher starting at ${fromBlock}`);

    while (true) {
      headBlockNumber = await fetchHeadBlockNumber();
      const toBlock = Math.min(
        headBlockNumber,
        fromBlock + MAX_BLOCK_RANGE_PER_SEARCH
      );

      if (fromBlock > headBlockNumber - 60) {
        // stream at 30 seconds
        try {
          await this.startStreaming(fromBlock);
        } catch (error) {
          if (
            !(
              /action received/gi.test(error.message) ||
              /commit/gi.test(error.message)
            )
          ) {
            throw error;
          }
        }
      } else if (toBlock > fromBlock) {
        await this.getPendingActions(fromBlock, toBlock);
        await this.commit(toBlock);
        fromBlock = this.config.lastCommittedBlockNumber + 1;
      }

      if (toBlock === headBlockNumber) {
        await sleep(10 * 1e3);
      }
    }
  }

  startStreaming = async (fromBlock) => {
    return new Promise(async (_, reject) => {
      try {
        logger.info(`Starting to stream from ${fromBlock}`);
        const streamTransfer = `subscription {
          searchTransactionsForward(query: "account:${ACCOUNT_TO_WATCH} receiver:${ACCOUNT_TO_WATCH}", lowBlockNum: ${fromBlock}, irreversibleOnly: true) {
            trace {
              matchingActions { account, name }
            }
          }
        }`;

        let returned = false;

        // don't return this promise here, we never want to resolve from startStreaming
        const stream = await this.client.graphql(
          streamTransfer,
          (message: GraphqlStreamMessage<any>) => {
            logger.verbose(
              `WS-Message: ${message.type}`,
              JSON.stringify(message)
            );
            let rejectionMessage = ``;
            if (message.type === `error`) {
              rejectionMessage = message.errors
                .map((x) => x.message)
                .join(`\n`);
            } else if (message.type === `data`) {
              const traces =
                message.data.searchTransactionsForward.trace.matchingActions;
              const firstAction = traces[0];
              rejectionMessage = `action received: ${firstAction.account}:${firstAction.name}`;
              logger.info(`Watcher: streaming ${JSON.stringify(firstAction)}`);
            } else {
              rejectionMessage = `Unknown GraphQL message type received: ${message.type}`;
            }
            returned = true;
            stream
              .close()
              .catch()
              .then(() => {
                reject(new Error(rejectionMessage));
              });
          }
        );

        // restart stream and let a search commit the actual result
        await sleep((MAX_BLOCK_RANGE_PER_SEARCH / 2) * 1000);
        if (returned) return;
        await stream.close();
        reject(new Error(`commit`));
      } catch (error) {
        reject(error);
      }
    });
  };

  protected async getPendingActions(fromBlock: number, toBlock: number) {
    const transactions = [];
    let response;
    let cursor = ``;
    do {
      try {
        // blockNums are inclusive https://docs.dfuse.io/reference/eosio/graphql/
        response = await this.client.graphql(
          `query {
            searchTransactionsForward(query: "receiver:${ACCOUNT_TO_WATCH}", lowBlockNum: ${fromBlock}, highBlockNum:${toBlock} limit: 100, cursor: "${cursor}") {
              results {
                cursor
                trace {
                  block {
                    num
                    id
                    timestamp
                  }
                  id
                  matchingActions {
                    account
                    name
                    json
                    seq
                    receiver
                    console
                  }
                }
              }
            }
          }
          `
        );
      } catch (error) {
        let message = error.message;
        if (error.details && error.details.errors)
          message = `${message}. ${JSON.stringify(error.details.errors)}`;

        // sometimes dfuse seems to have a different LIB than we receive, ignore this error
        if (!/goes beyond LIB/i.test(message)) {
          logger.error(`An error occurred: ${message}`);
        }
        // try again
        await sleep(10000);
        continue;
      }
      const results = response.data.searchTransactionsForward.results
      cursor = results.length > 0 ? results[results.length - 1].cursor : ``;

      if (results.length > 0) {
        transactions.push(...results.map(res => res.trace));
      }
    } while (cursor !== ``);

    transactions.forEach((trans) => {
      const actions = getActionTraces(trans);
      this.pendingActions.push(...actions);
    });
  }

  private async commit(blockNum: number) {
    logger.verbose(`Committing all actions up to block ${blockNum}`);

    while (this.pendingActions.length > 0) {
      const action = this.pendingActions.shift();
      await onAction(action);
    }

    this.config!.lastCommittedBlockNumber = blockNum;

    // don't save in dev mode to make testing easier
    if (isProduction()) {
      await Config.save(this.config!);
    }
  }
}

export default Watcher;
