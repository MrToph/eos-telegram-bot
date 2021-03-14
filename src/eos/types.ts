export interface IEOSNetwork {
  chainId: string;
  nodeEndpoint: string;
  protocol: string;
  host: string;
  port: number;
}

export type GetChainInfoResult = {
  server_version: string;
  chain_id: string;
  head_block_num: number;
  last_irreversible_block_num: number;
  last_irreversible_block_id: string;
  head_block_id: string;
  head_block_time: string;
  head_block_producer: string;
  virtual_block_cpu_limit: number;
  virtual_block_net_limit: number;
  block_cpu_limit: number;
  block_net_limit: number;
  server_version_string: string;
  fork_db_head_block_num: number;
  fork_db_head_block_id: string;
};

export type TEosAction = {
  blockNumber: number;
  timestamp: string;
  account: string;
  name: string;
  data: any;
  print: string;
};

export type SearchTransactionArg = {
  block: {
    num: number; // 108136148,
    id: string; // "067206d411a23b641351aaa0a4965193feb63b0d858ccb2d2b1d78d6c68e4158",
    timestamp: string; // "2020-03-03T00:44:41Z"
  };
  id: string; // "f0234e19915a47c3ba15d474357d181b583a5913c1fac691aa72894e93f4e497",
  matchingActions: [
    {
      account: string; // "dacmultisig1",
      name: string; // "proposed",
      json: any;
      seq: string; // "60477065788",
      receiver: string; // "dacmultisig1"
      console: string; // "1234"
    }
  ];
};
