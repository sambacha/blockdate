import { PublicClient } from 'viem';
import { abs } from './common';

const MAX_RETRIES = 35;
const ACCURACY_SECONDS = 60 * 60 * 3; // 3 hours in seconds

type BlockResponse = Awaited<ReturnType<PublicClient['getBlock']>>;

interface BlockInfo {
  number: bigint;
  timestamp: bigint;
  date: Date;
}

interface DateToBlockResult {
  block: BlockInfo;
  retries: number;
  secondsFromTarget: bigint;
}

/**
 * Finds the nearest block number for a given date using binary search
 * @param publicClient - Viem public client instance
 * @param targetDate - Target date to find block for
 * @returns Block information and search metadata
 * @throws {Error} When date is in future or max retries exceeded
 */
export const dateToBlock = async (
  publicClient: PublicClient,
  targetDate: Date
): Promise<DateToBlockResult> => {
  const firstBlock = await publicClient.getBlock({ blockNumber: 1n });
  const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });
  const targetTimestamp = BigInt(Math.floor(targetDate.getTime() / 1000));

  if (targetTimestamp > latestBlock.timestamp) {
    throw new Error(`Target timestamp ${targetTimestamp} is in the future`);
  }

  if (targetTimestamp < firstBlock.timestamp) {
    return {
      block: {
        number: firstBlock.number,
        timestamp: firstBlock.timestamp,
        date: new Date(Number(firstBlock.timestamp) * 1000),
      },
      retries: 0,
      secondsFromTarget: abs(targetTimestamp - firstBlock.timestamp),
    };
  }

  let tries = 0;

  const binarySearchBlock = async (
    low: bigint,
    high: bigint
  ): Promise<DateToBlockResult> => {
    tries++;
    const mid = low + BigInt((high - low) / 2n);
    const blockInfo = await publicClient.getBlock({ blockNumber: mid });
    const secondsFromTarget = abs(targetTimestamp - blockInfo.timestamp);

    if (secondsFromTarget <= ACCURACY_SECONDS) {
      return {
        block: {
          number: mid,
          timestamp: blockInfo.timestamp,
          date: new Date(Number(blockInfo.timestamp) * 1000),
        },
        retries: tries,
        secondsFromTarget,
      };
    }

    if (tries >= MAX_RETRIES) {
        throw new Error(
          `Exceeded max retries ${MAX_RETRIES}. Last attempt at block ${mid}`
        );
      }
      
    
    return blockInfo.timestamp < targetTimestamp
      ? binarySearchBlock(mid, high)
      : binarySearchBlock(low, mid);
  };

  return binarySearchBlock(firstBlock.number, latestBlock.number);
};