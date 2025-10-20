import qs from 'qs';
import { ChainId, Timestamp, TimeString } from '@types';
import { ALCHEMY_NETWORKS } from '@shared/alchemy';
import { IFetchService } from '@services/fetch';
import { BlockInput, BlockResult, IBlocksSource } from '../types';
import { IProviderService } from '@services/providers';
import { closestBlock } from './utils';

export class AlchemyBlockSource implements IBlocksSource {
  private readonly providerService: IProviderService;
  private readonly fetchService: IFetchService;
  private readonly apiKey: string;

  constructor({ key, fetchService, providerService }: { key: string; fetchService: IFetchService; providerService: IProviderService }) {
    this.fetchService = fetchService;
    this.apiKey = key;
    this.providerService = providerService;
  }

  supportedChains(): ChainId[] {
    return Object.entries(ALCHEMY_NETWORKS)
      .filter(([, { blocks }]) => blocks.supported)
      .map(([chainId]) => Number(chainId));
  }

  async getBlocksClosestToTimestamps({
    timestamps,
    config,
  }: {
    timestamps: BlockInput[];
    config?: { timeout?: TimeString };
  }): Promise<Record<ChainId, Record<Timestamp, BlockResult>>> {
    const grouped = groupByTimestamp(timestamps);
    const promises = Object.entries(grouped).map(async ([timestamp, chains]) => {
      const queryParams = {
        // TODO: Alchemy added a limit of networks. Max is 3. We would need to split the request
        networks: chains.map((chainId) => ALCHEMY_NETWORKS[chainId].key),
        timestamp,
        direction: 'AFTER',
      };
      const queryString = qs.stringify(queryParams, { skipNulls: true, arrayFormat: 'repeat' });
      const response = await this.fetchService.fetch(
        `https://api.g.alchemy.com/data/v1/${this.apiKey}/utility/blocks/by-timestamp?${queryString}`,
        { timeout: config?.timeout }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch blocks for timestamp ${timestamp} in chains ${chains.join(',')}. Error was ${await response.text()}`);
      }
      const result: Response = await response.json();

      const alchemyNetworks = Object.fromEntries(Object.entries(ALCHEMY_NETWORKS).map(([chainId, { key }]) => [key, Number(chainId)]));
      return Promise.all(
        result.data.map(async ({ network, block }) => {
          const chainId = alchemyNetworks[network];
          const blockAfter = { timestamp: Math.floor(new Date(block.timestamp).getTime() / 1000), block: BigInt(block.number) };
          const previousBlock = await this.providerService
            .getViemPublicClient({ chainId })
            .getBlock({ blockNumber: blockAfter.block - 1n })
            .then((block) => ({ block: block.number, timestamp: Number(block.timestamp) }));
          return { chainId, timestamp: Number(timestamp), block: closestBlock(previousBlock, blockAfter, Number(timestamp)) };
        })
      );
    });
    const allResults = await Promise.all(promises);
    const result: Record<ChainId, Record<Timestamp, BlockResult>> = {};
    allResults.flat().forEach(({ chainId, timestamp, block }) => {
      if (!(chainId in result)) {
        result[chainId] = {};
      }
      result[chainId][timestamp] = block;
    });
    return result;
  }
}

function groupByTimestamp(timestamps: BlockInput[]) {
  const result: Record<Timestamp, ChainId[]> = {};
  for (const { timestamp, chainId } of timestamps) {
    if (!(timestamp in result)) {
      result[timestamp] = [chainId];
    } else {
      result[timestamp].push(chainId);
    }
  }
  return result;
}

type Response = {
  data: { network: string; block: { number: number; timestamp: string } }[];
};
