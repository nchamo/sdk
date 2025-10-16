import { timeoutPromise } from '@shared/timeouts';
import { ChainId, TimeString, Timestamp, TokenAddress } from '@types';
import { IPriceService, IPriceSource, PriceInput, PriceResult } from './types';

export class PriceService implements IPriceService {
  constructor(private readonly priceSource: IPriceSource) {}

  supportedChains() {
    return Object.entries(this.supportedQueries())
      .filter(([, support]) => support.getCurrentPrices || support.getHistoricalPrices)
      .map(([chainId]) => Number(chainId));
  }

  supportedQueries() {
    return this.priceSource.supportedQueries();
  }

  async getCurrentPricesInChain({
    chainId,
    tokens,
    config,
  }: {
    chainId: ChainId;
    tokens: TokenAddress[];
    config?: { timeout?: TimeString };
  }): Promise<Record<TokenAddress, PriceResult>> {
    const input = tokens.map((token) => ({ chainId, token }));
    const result = await this.getCurrentPrices({ tokens: input, config });
    return result[chainId] ?? {};
  }

  async getCurrentPrices({
    tokens,
    config,
  }: {
    tokens: PriceInput[];
    config?: { timeout?: TimeString };
  }): Promise<Record<ChainId, Record<TokenAddress, PriceResult>>> {
    if (tokens.length === 0) {
      return {};
    }
    return timeoutPromise(this.priceSource.getCurrentPrices({ tokens, config }), config?.timeout, {
      description: 'Timeouted while fetching current prices',
    });
  }

  async getHistoricalPricesInChain({
    chainId,
    tokens,
    timestamp,
    searchWidth,
    config,
  }: {
    chainId: ChainId;
    tokens: TokenAddress[];
    timestamp: Timestamp;
    searchWidth?: TimeString;
    config?: { timeout?: TimeString };
  }) {
    const input = tokens.map((token) => ({ chainId, token }));
    const result = await this.getHistoricalPrices({ tokens: input, timestamp, searchWidth, config });
    return result[chainId] ?? {};
  }

  async getHistoricalPrices({
    config,
    searchWidth,
    tokens,
    timestamp,
  }: {
    tokens: PriceInput[];
    timestamp: Timestamp;
    searchWidth?: TimeString;
    config?: { timeout?: TimeString };
  }) {
    const input = tokens.map((token) => ({ ...token, timestamp }));
    const result = await this.getBulkHistoricalPrices({ tokens: input, searchWidth, config });
    return Object.fromEntries(
      Object.entries(result).map(([chainId, tokens]) => [
        chainId,
        Object.fromEntries(Object.entries(tokens).map(([token, prices]) => [token, prices[timestamp]])),
      ])
    );
  }

  async getBulkHistoricalPrices({
    tokens,
    searchWidth,
    config,
  }: {
    tokens: { chainId: ChainId; token: TokenAddress; timestamp: Timestamp }[];
    searchWidth?: TimeString;
    config?: { timeout?: TimeString };
  }): Promise<Record<ChainId, Record<TokenAddress, Record<Timestamp, PriceResult>>>> {
    if (tokens.length === 0) {
      return {};
    }
    return timeoutPromise(this.priceSource.getHistoricalPrices({ tokens, searchWidth, config }), config?.timeout, {
      description: 'Timeouted while fetching bulk historical prices',
    });
  }
  getChart({
    tokens,
    span,
    period,
    bound,
    searchWidth,
    config,
  }: {
    tokens: PriceInput[];
    span: number;
    period: TimeString;
    bound: { from: Timestamp } | { upTo: Timestamp | 'now' };
    searchWidth?: TimeString;
    config?: { timeout?: TimeString };
  }): Promise<Record<ChainId, Record<TokenAddress, PriceResult[]>>> {
    return timeoutPromise(this.priceSource.getChart({ tokens, span, period, bound, searchWidth, config }), config?.timeout, {
      description: 'Timeouted while fetching chart prices',
    });
  }
}
