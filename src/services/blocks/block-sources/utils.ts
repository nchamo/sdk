import { Timestamp } from '@types';
import { BlockResult } from '../types';

export function closestBlock(blockA: BlockResult, blockB: BlockResult, timestamp: Timestamp) {
  const diffA = Math.abs(blockA.timestamp - timestamp);
  const diffB = Math.abs(blockB.timestamp - timestamp);
  return diffA <= diffB ? blockA : blockB;
}
