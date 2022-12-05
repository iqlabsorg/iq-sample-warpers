import { hexDataSlice, id } from 'ethers/lib/utils';

/**
 * Calculates ID by taking 4 byte of the provided string hashed value.
 * @param string Arbitrary string.
 */
 export const solidityIdBytes4 = (string: string): string => {
  return hexDataSlice(solidityIdBytes32(string), 0, 4);
};

/**
 * Calculates ID for bytes32 string.
 * @param string Arbitrary string.
 */
export const solidityIdBytes32 = (string: string): string => {
  return id(string);
};
