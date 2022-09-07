export declare const RPC_HEADERS: {
    origin: string;
};
export declare function getSupportedChains(): Promise<any>;
export declare function getAvailableToChains(fromChainName: string): Promise<any>;
export declare function getTokenPriceByResourceId(resourceId: string): Promise<any>;
export declare function getAvailableTokens(fromChainName: string, toChainName: string): Promise<any>;
export declare function estimateFee(fromChainName: string, toChainName: string, token: string, value: number): Promise<{
    fromChainId: any;
    toChainId: any;
    token: {
        symbol: any;
        decimals: any;
        mainnetAddress: any;
    };
    outputToken: {
        symbol: any;
        decimals: any;
        mainnetAddress: any;
    };
    fee: number;
    fixedFee: number;
    liquidity: string | null;
    breakdown: {
        name: string;
        total: number;
        percent: string;
        display: string;
    }[];
    extra: {
        nativeGasToken: {
            [x: number]: number;
        };
    };
    totalFee: string;
    input: number;
    output: number;
    feeDisplay: string;
}>;
export declare function estimateFeeAsCsv(fromChainName: string, toChainName: string, token: string, amount: number): Promise<any[]>;
export declare function generateCSV(): Promise<void>;
//# sourceMappingURL=index.d.ts.map