import { ChainId, Timestamp, TimeString } from '@types';
import { BlockInput, BlockResult, IBlocksSource } from '../types';
import { chainsUnion } from '@chains';
import { timeoutPromise } from '@shared/timeouts';

export class FallbackBlockSource implements IBlocksSource {
  constructor(private readonly sources: IBlocksSource[]) {}

  supportedChains(): ChainId[] {
    return chainsUnion(this.sources.map((source) => source.supportedChains()));
  }

  async getBlocksClosestToTimestamps({
    timestamps,
    config,
  }: {
    timestamps: BlockInput[];
    config?: { timeout?: TimeString };
  }): Promise<Record<ChainId, Record<Timestamp, BlockResult>>> {
    const errors: Error[] = [];
    for (const source of this.sources) {
      try {
        return await timeoutPromise(source.getBlocksClosestToTimestamps({ timestamps, config }), config?.timeout, { reduceBy: '100' });
      } catch (e: any) {
        errors.push(e);
      }
    }
    throw new AggregateError(errors);
  }
}
