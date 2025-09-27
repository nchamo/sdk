import ms from 'ms';
import { ChainId, TimeString, Timestamp, TokenAddress } from '@types';
import { Deferred } from '@shared/deferred';
import { PriceResult, IPriceSource, PriceInput } from '../types';

export type BatchConfig = { maxSize: number; maxDelay: TimeString };

// This price source will adds capabilities. Before executing the price fetch, it will wait until certain amount of time has passed, or the amount of tokens
// exceeds a specific limit. Now, by doing this, the returned result will contain the prices for all prices in the batch, not just the
// ones that we asked for in each query. This shouldn't be a problem since we are returning an object that is meant to be indexed by token address,
// but it might cause some weird behaviours if the client tries to iterate through all results
export class BatchPriceSource implements IPriceSource {
  private readonly currentBatching: Batching<PriceInput, Record<ChainId, Record<TokenAddress, PriceResult>>>;
  private readonly historicalBatching: Batching<
    PriceInput & { timestamp: Timestamp },
    Record<ChainId, Record<TokenAddress, Record<Timestamp, PriceResult>>>
  >;

  constructor(private readonly source: IPriceSource, config: BatchConfig) {
    this.currentBatching = new Batching((tokens, timeout) => source.getCurrentPrices({ tokens, config: { timeout } }), config);
    this.historicalBatching = new Batching(
      (tokens, timeout) => source.getHistoricalPrices({ tokens, config: { timeout }, searchWidth: undefined }),
      config
    );
  }

  supportedQueries() {
    return this.source.supportedQueries();
  }

  async getCurrentPrices({
    tokens,
    config,
  }: {
    tokens: PriceInput[];
    config?: { timeout?: TimeString };
  }): Promise<Record<ChainId, Record<TokenAddress, PriceResult>>> {
    return this.currentBatching.addTokens(tokens, config);
  }

  getHistoricalPrices({
    tokens,
    searchWidth,
    config,
  }: {
    tokens: { chainId: ChainId; token: TokenAddress; timestamp: Timestamp }[];
    searchWidth: TimeString | undefined;
    config: { timeout?: TimeString } | undefined;
  }): Promise<Record<ChainId, Record<TokenAddress, Record<Timestamp, PriceResult>>>> {
    return this.historicalBatching.addTokens(tokens, config);
  }

  async getChart({
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
    config: { timeout?: TimeString } | undefined;
  }): Promise<Record<ChainId, Record<TokenAddress, PriceResult[]>>> {
    // We won't batch this for now
    return this.source.getChart({
      tokens,
      span,
      period,
      bound,
      searchWidth,
      config,
    });
  }
}

class Batching<TInput extends PriceInput, TResult> {
  private readonly config: { maxDelay: number; maxSize: number };
  private batch:
    | undefined
    | {
        tokens: TInput[];
        timeout: NodeJS.Timeout;
        promise: Deferred<TResult>;
        fetchTimeout?: number;
      };

  constructor(private readonly fetch: (_: TInput[], fetchTimeout?: `${number}`) => Promise<TResult>, config: BatchConfig) {
    this.config = {
      maxDelay: ms(config.maxDelay),
      maxSize: config.maxSize,
    };
  }

  addTokens(input: TInput[], config?: { timeout?: TimeString }): Deferred<TResult> {
    if (!this.batch) {
      // Prepare timeout so that the batch is executed later
      const timeout = setTimeout(() => {
        const batch = this.batch!;
        this.batch = undefined;
        this.fetch(batch.tokens)
          .then((result) => {
            batch.promise.resolve(result);
          })
          .catch((err) => batch.promise.reject(err));
      }, this.config.maxDelay);

      this.batch = {
        promise: new Deferred(),
        tokens: [],
        timeout,
        fetchTimeout: undefined,
      };
    }

    const batch = this.batch;
    batch.tokens.push(...input);
    if (config?.timeout) {
      if (batch.fetchTimeout) {
        batch.fetchTimeout = Math.min(batch.fetchTimeout, ms(config.timeout));
      } else {
        batch.fetchTimeout = ms(config.timeout);
      }
    }

    if (batch.tokens.length >= this.config.maxSize) {
      // If we reached the batch size, the cancel the timeout and trigger the execution now
      clearTimeout(batch.timeout);
      this.batch = undefined;
      this.fetch(batch.tokens)
        .then((result) => batch.promise.resolve(result))
        .catch((err) => batch.promise.reject(err));
    }

    return batch.promise;
  }
}
