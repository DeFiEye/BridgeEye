export declare function getSupportedChains(): Promise<any[]>;
export declare function getAvailableToChains(fromChainName: string): Promise<any[]>;
export declare function getAvailableTokens(fromChainName: string, toChainName: string): Promise<any[]>;
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
    fee: number;
    breakdown: {
        name: string;
        total: number;
        percent: any;
        display: string;
    }[];
    totalFee: any;
    input: any;
    output: number;
    minFee: number;
    maxFee: number;
    minNum: number;
    feeDisplay: string;
}>;
export declare function estimateFeeAsCsv(fromChainName: string, toChainName: string, token: string, amount: number): Promise<any[]>;
export declare function generateCSV(): Promise<void>;
//# sourceMappingURL=index.d.ts.map