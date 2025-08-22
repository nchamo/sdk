import { BlockNumber } from 'viem';
import { ChainId, Timestamp } from '@types';
import { IProviderService } from '@services/providers';
import { groupByChain } from '@shared/utils';
import { BlockInput, BlockResult, IBlocksSource } from '../types';
import { closestBlock } from './utils';

export class RPCBlockSource implements IBlocksSource {
  constructor(private readonly providerService: IProviderService) {}

  supportedChains(): ChainId[] {
    return this.providerService.supportedChains();
  }

  async getBlocksClosestToTimestamps({ timestamps }: { timestamps: BlockInput[] }): Promise<Record<ChainId, Record<Timestamp, BlockResult>>> {
    const timestampsByChain = groupByChain(timestamps, ({ timestamp }) => timestamp);
    const promises = Object.entries(timestampsByChain).map(async ([chainId, timestamps]) => {
      const filteredAndSorted = [...new Set(timestamps)].sort();
      return [chainId as `${ChainId}`, await this.getBlocksClosestToTimestampsInChain(Number(chainId), filteredAndSorted)];
    });
    return Object.fromEntries(await Promise.all(promises));
  }

  // First of all, we know that timestamps are sorted. We will attempt to do a sort of binary search, but we'll attempt to optimize it. Instead of doing
  // a binary search for each timestamp, we will first try to find blocks between the given timestamps. Once we have that, we can attempt a more "regular"
  // binary search for each timestamp. By doing this, we can optimize the number of RPC calls we make
  private async getBlocksClosestToTimestampsInChain(chainId: ChainId, timestamps: Timestamp[]): Promise<Record<Timestamp, BlockResult>> {
    const client = this.providerService.getViemPublicClient({ chainId });

    // We build a small cache for block => timestamp, to avoid unnecessary RPC calls
    const cache: Map<BlockNumber, BlockResult> = new Map();
    const fetchBlock = async (block?: BlockNumber) => {
      let result: BlockResult | undefined = cache.get(block ?? -1n);
      if (!result) {
        result = await client.getBlock({ blockNumber: block }).then((block) => ({ block: block.number, timestamp: Number(block.timestamp) }));
        cache.set(result!.block, result!);
      }
      return result!;
    };

    // Note: we ask for the block "1" instead of "0" because many RPCs return timestamp "0" for the genesis block
    const firstBlock = await fetchBlock(1n);
    const timestampsBeforeFirstBlock = timestamps.filter((timestamp) => timestamp <= firstBlock.timestamp);
    if (timestamps.length === timestampsBeforeFirstBlock.length) {
      // Note: this is a small check to avoid an extra RPC call
      return buildResultForOneBlockOnly(timestamps, firstBlock);
    }

    const currentBlock = await fetchBlock();
    const timestampsAfterCurrentBlock = timestamps.filter((timestamp) => timestamp >= currentBlock.timestamp);

    const timestampsToCalculate = timestamps.filter((timestamp) => firstBlock.timestamp < timestamp && timestamp < currentBlock.timestamp);
    const calculated = await findBlocks({
      fromBlock: firstBlock,
      toBlock: currentBlock,
      timestamps: timestampsToCalculate,
      fetchBlock,
    });

    return {
      ...calculated,
      ...buildResultForOneBlockOnly(timestampsBeforeFirstBlock, firstBlock),
      ...buildResultForOneBlockOnly(timestampsAfterCurrentBlock, currentBlock),
    };
  }
}

async function findBlocks({
  fromBlock,
  toBlock,
  timestamps,
  fetchBlock,
}: {
  fromBlock: BlockResult;
  toBlock: BlockResult;
  timestamps: Timestamp[];
  fetchBlock: (_: BlockNumber) => Promise<BlockResult>;
}): Promise<Record<Timestamp, BlockResult>> {
  if (timestamps.length === 0) {
    return {};
  } else if (timestamps.length === 1) {
    // If we only have one timestamp, then we'll find it directly
    const block = await findClosestBlockToTimestamp({ fromBlock, toBlock, timestamp: timestamps[0], fetchBlock });
    return { [timestamps[0]]: block };
  } else if (fromBlock.block + 1n === toBlock.block) {
    // If we got to this place, then we have found two consecutive blocks that surround more than one timestamp. We will simply return the closest
    // block for each timestamp then
    return Object.fromEntries(timestamps.map((timestamp) => [timestamp, closestBlock(fromBlock, toBlock, timestamp)]));
  }

  // We know that we have more than one timestamp, then we'll try to find a block in between them
  const [firstTimestamp, lastTimestamp] = [timestamps[0], timestamps[timestamps.length - 1]]; // Remember we assume the array is sorted
  const midTimestamp = Math.floor((firstTimestamp + lastTimestamp) / 2);
  const midBlockNumber = nextMidBlock(fromBlock, toBlock, midTimestamp);
  const midBlock = await fetchBlock(midBlockNumber);

  const timestampsBefore = timestamps.filter((timestamp) => timestamp < midBlock.timestamp);
  const timestampsAt = timestamps.filter((timestamp) => timestamp === midBlock.timestamp);
  const timestampsAfter = timestamps.filter((timestamp) => timestamp > midBlock.timestamp);

  const [resultsBefore, resultsAfter] = await Promise.all([
    findBlocks({
      fromBlock,
      toBlock: midBlock,
      timestamps: timestampsBefore,
      fetchBlock,
    }),
    findBlocks({
      fromBlock: midBlock,
      toBlock,
      timestamps: timestampsAfter,
      fetchBlock,
    }),
  ]);

  return {
    ...resultsBefore,
    ...buildResultForOneBlockOnly(timestampsAt, midBlock),
    ...resultsAfter,
  };
}

async function findClosestBlockToTimestamp({
  fromBlock,
  toBlock,
  timestamp,
  fetchBlock,
}: {
  fromBlock: BlockResult;
  toBlock: BlockResult;
  timestamp: Timestamp;
  fetchBlock: (_: BlockNumber) => Promise<BlockResult>;
}) {
  while (toBlock.block > fromBlock.block + 1n) {
    const next = nextMidBlock(fromBlock, toBlock, timestamp);
    const block = await fetchBlock(next);

    if (block.timestamp === timestamp) {
      return block;
    } else if (block.timestamp > timestamp) {
      toBlock = block;
    } else {
      fromBlock = block;
    }
  }

  return closestBlock(fromBlock, toBlock, timestamp);
}

// Instead of doing an ordinary binary search, we will try to do something smarter. Blockchains tend to produce blocks at a certain frequency so, if we have two
// blocks and their timestamps, we will assume a constant frequency and attempt to find the closest block based on it. Now, the thing is that this is not always true,
// the block frequency might fluctuate. So we will calculate the following block by calculating the avg between the estimated block (based on the frequency), and
// the "mid" block (per the regular binary search algorithm).
function nextMidBlock(fromBlock: BlockResult, toBlock: BlockResult, timestamp: number) {
  // The "mid" block (per the regular binary search algorithm)
  const mid = (fromBlock.block + toBlock.block) / 2n;

  // The estimated block, based on assumed constant frequency
  const estimatedFrequency = Number(toBlock.block - fromBlock.block) / (toBlock.timestamp - fromBlock.timestamp);
  const estimatedBlock = fromBlock.block + BigInt(Math.floor((timestamp - fromBlock.timestamp) * estimatedFrequency));

  // The average between the two ("mid" block and estimated block). After a few tests we realized that this method often produced the least amount of RPC calls
  const next = (mid + estimatedBlock) / 2n;

  // Since we always round down, it could happen that we end up setting the "from block" as next. We'll check if that is the case to avoid doing so
  return maxBigInt(fromBlock.block + 1n, next);
}

function buildResultForOneBlockOnly(timestamps: Timestamp[], block: BlockResult) {
  return Object.fromEntries(timestamps.map((timestamp) => [timestamp, block]));
}

function maxBigInt(a: bigint, b: bigint) {
  return a > b ? a : b;
}
