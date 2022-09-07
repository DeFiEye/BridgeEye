import { ChainId } from "./constants";
declare type Mapping = {
    name: string;
    chainId: ChainId;
};
export declare const availableChains: Array<Mapping>;
export declare function getSupportedChains(): Promise<Mapping[]>;
export declare function getAvailableToChains(fromChainName: string): {
    disabled: boolean;
    name: string;
    fullName?: string | undefined;
    chainId: ChainId;
    logoURI: string;
    rpcUrl?: string | undefined;
    explorerUrl: string;
    constructExplorerLink: (txHash: string) => string;
    pollingInterval: number;
    nativeCurrencySymbol: string;
    earliestBlock: number;
}[];
export declare function getAvailableTokens(fromChainName: string, toChainName: string): import("./config").TokenList;
export declare function estimateFee(fromChainName: string, toChainName: string, token: string, amount: number): Promise<{
    token: import("./constants").TokenInfo;
    timeEstimate: string;
    input: string;
    outputToken: {
        name: string;
        symbol: string;
        decimals: number;
        mainnetAddress: string;
    };
    output: string;
    breakdown: {
        name: string;
        total: string;
        percent: string;
        display: string;
    }[];
    totalFeeRaw: string;
    fee: string;
    feeDisplay: string;
    totalFee: string;
}>;
export declare function estimateFeeAsCsv(fromChainName: string, toChainName: string, token: string, amount: number): Promise<(string | number | boolean | undefined)[]>;
export declare function generateCSV(): Promise<void>;
export {};
//# sourceMappingURL=index.d.ts.map