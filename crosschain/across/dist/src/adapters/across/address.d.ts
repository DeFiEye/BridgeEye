import { ChainId } from "./constants";
export declare function isValidAddress(address: string): boolean;
export declare function getAddress(address: string): string;
export declare const noContractCode = "0x";
export declare function getCode(address: string, chainId: ChainId): Promise<string>;
//# sourceMappingURL=address.d.ts.map