#!/usr/bin/env node

import { PublicClient, createPublicClient, http } from 'viem';
import { dateToBlock } from './dateToBlock';

async function main() {
  const args = process.argv.slice(2);

  if (args.length !== 1) {
    console.error('Usage: date-to-block-cli <unix_epoch_timestamp>');
    process.exit(1);
  }

  const timestampArg = args[0];

  let unixTimestamp: number;
  try {
    unixTimestamp = parseInt(timestampArg, 10);
    if (isNaN(unixTimestamp) || unixTimestamp < 0) {
      throw new Error('Invalid Unix epoch timestamp.');
    }
  } catch (error: any) {
    console.error('Error: Invalid timestamp argument.');
    console.error(error.message || 'Please provide a valid Unix epoch timestamp.');
    process.exit(1);
  }

  const targetDate = new Date(unixTimestamp * 1000); // Convert seconds to milliseconds

  // Configure viem PublicClient -
  // you can replace with your desired RPC URL
  const publicClient: PublicClient = createPublicClient({
    transport: http('https://api.securerpc.com/v1'),
  });

  try {
    const result = await dateToBlock(publicClient, targetDate);

    console.log('-------------------------------------');
    console.log('Date to Block Result:');
    console.log('-------------------------------------');
    console.log(`Target Date (UTC): ${targetDate.toUTCString()}`);
    console.log(`Block Number:      ${result.block.number}`);
    console.log(`Block Timestamp:   ${result.block.timestamp}`);
    console.log(`Block Date (UTC):  ${result.block.date.toUTCString()}`);
    console.log(`Seconds from Target: ${result.secondsFromTarget}`);
    console.log(`Retries:           ${result.retries}`);
    console.log('-------------------------------------');

  } catch (error: any) {
    console.error('Error finding block for timestamp:');
    console.error(error.message);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
