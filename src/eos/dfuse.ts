import { createDfuseClient } from "@dfuse/client";
import nodeFetch from "node-fetch";
import WebSocketClient from "ws";
import { IncomingMessage } from "http";
import { logger } from "../logger";

const { DFUSE_API_KEY, EOS_NETWORK } = process.env;

if (!DFUSE_API_KEY) {
  throw new Error(`No dfuse API key in env variable "DFUSE_API_KEY" set`);
}

const network = EOS_NETWORK || "mainnet";

(global as any).WebSocket = WebSocketClient;

async function webSocketFactory(url: string, protocols: string[] = []) {
  const webSocket = new WebSocketClient(url, protocols, {
    handshakeTimeout: 30 * 1000, // 30s
    maxPayload: 10 * 1024 * 1000 * 1000, // 10Mb
  });

  const onUpgrade = (response: any) => {
    logger.info(`ws.onUpgrade: response status code: ${response.statusCode}`);

    webSocket.removeListener("upgrade", onUpgrade);
  };

  webSocket.on("upgrade", onUpgrade);

  return webSocket;
}

const client = createDfuseClient({
  apiKey: DFUSE_API_KEY,
  network,
  httpClientOptions: {
    fetch: nodeFetch,
  },
  graphqlStreamClientOptions: {
    socketOptions: {
      // The WebSocket factory used for GraphQL stream must use this special protocols set
      // We intend on making the library handle this for you automatically in the future,
      // for now, it's required otherwise, the GraphQL will not connect correctly.
      webSocketFactory: (url) => webSocketFactory(url, ["graphql-ws"]),
    },
  },
  streamClientOptions: {
    socketOptions: {
      webSocketFactory: (url) => webSocketFactory(url),
    },
  },
});

export default client;
