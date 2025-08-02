import { ChainId, TimeString, Timestamp, TokenAddress } from '@types';
import { IFetchService } from '@services/fetch/types';
import { PriceResult, IPriceSource, PricesQueriesSupport, PriceInput } from '../types';
import { getChainByKey } from '@chains';
import { reduceTimeout } from '@shared/timeouts';
import { filterRejectedResults, groupByChain, isSameAddress } from '@shared/utils';
import { Addresses } from '@shared/constants';
import { ALCHEMY_NETWORKS } from '@shared/alchemy';
import { alchemySupportedChains, AlchemySupportedChains } from '@services/providers/provider-sources/alchemy-provider';

export class AlchemyPriceSource implements IPriceSource {
  private readonly fetch: IFetchService;
  private readonly apiKey: string;
  private readonly supported: ChainId[];

  constructor({ key, onChains, fetch }: { key: string; onChains?: AlchemySupportedChains; fetch: IFetchService }) {
    this.fetch = fetch;
    this.apiKey = key;
    if (onChains === undefined) {
      this.supported = alchemySupportedChains();
    } else if (Array.isArray(onChains)) {
      this.supported = onChains;
    } else {
      const chains = alchemySupportedChains({ onlyFree: onChains.allInTier === 'free tier' });
      this.supported = onChains.except ? chains.filter((chain) => !onChains.except!.includes(chain)) : chains;
    }
  }

  supportedQueries() {
    const support: PricesQueriesSupport = {
      getCurrentPrices: true,
      getHistoricalPrices: false,
      getBulkHistoricalPrices: false,
      getChart: false,
    };
    const entries = Object.entries(ALCHEMY_NETWORKS)
      .filter(([chainId]) => this.supported.includes(Number(chainId)))
      .filter(
        ([
          _,
          {
            price: { supported },
          },
        ]) => supported
      )
      .map(([chainId]) => [chainId, support]);
    return Object.fromEntries(entries);
  }

  async getCurrentPrices({
    tokens,
    config,
  }: {
    tokens: PriceInput[];
    config: { timeout?: TimeString } | undefined;
  }): Promise<Record<ChainId, Record<TokenAddress, PriceResult>>> {
    const chunks = generateChunks(tokens);
    const reducedTimeout = reduceTimeout(config?.timeout, '100');
    const promises = chunks.map((chunk) => this.getCurrentPricesInChunk(chunk, reducedTimeout));
    const pricesResults = await filterRejectedResults(promises);

    const result: Record<ChainId, Record<TokenAddress, PriceResult>> = {};
    for (const { chainId, token, price, closestTimestamp } of pricesResults.flat()) {
      if (!result[chainId]) {
        result[chainId] = {};
      }
      result[chainId][token] = { price, closestTimestamp };
    }
    return result;
  }

  getHistoricalPrices(_: {
    tokens: PriceInput[];
    timestamp: Timestamp;
    searchWidth: TimeString | undefined;
    config: { timeout?: TimeString } | undefined;
  }): Promise<Record<ChainId, Record<TokenAddress, PriceResult>>> {
    // Only supports historical prices searching by token symbol
    return Promise.reject(new Error('Operation not supported'));
  }

  getBulkHistoricalPrices(_: {
    tokens: { chainId: ChainId; token: TokenAddress; timestamp: Timestamp }[];
    searchWidth: TimeString | undefined;
    config: { timeout?: TimeString } | undefined;
  }): Promise<Record<ChainId, Record<TokenAddress, Record<Timestamp, PriceResult>>>> {
    return Promise.reject(new Error('Operation not supported'));
  }

  async getChart(_: {
    tokens: PriceInput[];
    span: number;
    period: TimeString;
    bound: { from: Timestamp } | { upTo: Timestamp | 'now' };
    searchWidth?: TimeString;
    config: { timeout?: TimeString } | undefined;
  }): Promise<Record<ChainId, Record<TokenAddress, PriceResult[]>>> {
    return Promise.reject(new Error('Operation not supported'));
  }

  private async getCurrentPricesInChunk(chunk: PriceInput[], timeout?: TimeString) {
    const url = `https://api.g.alchemy.com/prices/v1/${this.apiKey}/tokens/by-address`;
    const response = await this.fetch.fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: chunk.map(({ chainId, token }) => ({
          network: ALCHEMY_NETWORKS[chainId].key,
          address: isSameAddress(token, Addresses.NATIVE_TOKEN)
            ? // Most chains don't support native tokens, so we use the wrapped native token when possible
              getChainByKey(chainId)?.wToken ?? Addresses.ZERO_ADDRESS
            : token,
        })),
      }),
      timeout,
    });

    if (!response.ok) {
      return [];
    }
    const body: Response = await response.json();
    return chunk
      .map(({ chainId, token }, index) => {
        const tokenPrice = body.data[index].prices[0];
        if (!tokenPrice) return;
        const timestamp = Math.floor(new Date(tokenPrice.lastUpdatedAt).getTime() / 1000);
        return { chainId, token, price: Number(tokenPrice.value), closestTimestamp: timestamp };
      })
      .filter((result): result is { chainId: ChainId; token: TokenAddress; price: number; closestTimestamp: Timestamp } => result !== undefined);
  }
}

function generateChunks(tokens: PriceInput[]) {
  const groupedByChain = groupByChain(tokens, ({ token }) => token);
  const tokensSortedByChain = Object.entries(groupedByChain)
    .sort(([, tokensA], [, tokensB]) => tokensB.length - tokensA.length) // Sort by chain with most tokens, descending
    .flatMap(([chainId, tokens]) => tokens.map((token) => ({ chainId: Number(chainId), token })));

  const chunks: PriceInput[][] = [];
  let chunk: PriceInput[] = [];
  let chainsInChunk: Set<ChainId> = new Set();
  for (const token of tokensSortedByChain) {
    if (chunk.length === 25 || (chainsInChunk.size === 3 && !chainsInChunk.has(token.chainId))) {
      chunks.push(chunk);
      chunk = [];
      chainsInChunk = new Set();
    }
    chunk.push(token);
    chainsInChunk.add(token.chainId);
  }
  if (chunk.length > 0) {
    chunks.push(chunk);
  }
  return chunks;
}

type Response = { data: { address: TokenAddress; prices: { currency: string; value: string; lastUpdatedAt: string }[] }[] };
