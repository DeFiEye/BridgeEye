export declare const DEFAULT_FIXED_DECIMAL_POINT = 5;
export declare function getSupportedChains(): Promise<any>;
export declare function getAvailableToChains(fromChainName: string): Promise<any>;
export declare function getAvailableTokens(fromChainName: string, toChainName: string): Promise<any>;
export declare function estimateFee(fromChainName: string, toChainName: string, token: string, amount: number): Promise<{
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
    fee: any;
    breakdown: {
        name: string;
        total: any;
        display: string;
    }[];
    totalFee: string;
    input: number;
    output: number;
    feeDisplay: string;
}>;
export declare function estimateFeeAsCsv(fromChainName: string, toChainName: string, token: string, amount: number): Promise<any[]>;
export declare function generateCSV(): Promise<void>;
//# sourceMappingURL=index.d.ts.map