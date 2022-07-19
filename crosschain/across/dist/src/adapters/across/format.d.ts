import { ethers } from "ethers";
export declare function isValidString(s: string | null | undefined | ""): s is string;
/**
 *
 * @param address valid web3 address
 * @param delimiter string to put between your split string, eg: "...", "---"
 * @param numChars number of characters to keep on each part of the string
 * @returns string. Formatted version of address param.
 */
export declare function shortenAddress(address: string, delimiter: string, numChars: number): string;
/**
 *
 * @param str string to shorten
 * @param delimiter string to put between your split string, eg: "...", "---"
 * @param numChars number of characters to keep on each part of the string
 * @returns string. Formatted version of str param.
 */
export declare function shortenString(str: string, delimiter: string, numChars: number): string;
export declare function shortenTransactionHash(hash: string): string;
export declare const numberFormatter: (num: number) => string;
export declare function formatUnits(wei: ethers.BigNumberish, decimals: number): string;
export declare function formatEther(wei: ethers.BigNumberish): string;
export declare function formatEtherRaw(wei: ethers.BigNumberish): string;
export declare function parseUnits(value: string, decimals: number): ethers.BigNumber;
export declare function parseEther(value: string): ethers.BigNumber;
export declare function stringToHex(value: string): string;
export declare function tagHex(dataHex: string, tagHex: string, delimitterHex?: string): string;
export declare function tagString(dataHex: string, tagString: string): string;
export declare function tagAddress(dataHex: string, address: string, delimiterHex?: string): string;
export declare function capitalizeFirstLetter(str: string): string;
export declare const formatNumberTwoSigDigits: {
    (value: number): string;
    (value: number | bigint): string;
};
export declare const formatNumberMaxFracDigits: {
    (value: number): string;
    (value: number | bigint): string;
};
export declare function formatPoolAPY(wei: ethers.BigNumberish, decimals: number): string;
//# sourceMappingURL=format.d.ts.map