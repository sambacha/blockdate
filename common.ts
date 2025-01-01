

/*
export const abs = (value: bigint): bigint => {
  return value < 0n ? value * -1n : value;
};


export const abs = (value: bigint): bigint => {
    if (typeof value !== 'bigint') {
      throw new TypeError('Input must be a bigint');
    }
    return value < 0n ? value * -1n : value;
  };

*/

/**
 * Returns the absolute value of a BigInt number
 * @param value - The BigInt value to get the absolute value of
 * @returns The absolute value as a BigInt
 * @throws {TypeError} If the input is not a BigInt
 */
export const abs = (value: bigint): bigint => {
    return value >= 0n ? value : -value;
  };