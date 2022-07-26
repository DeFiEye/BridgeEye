export declare function getAvailableToChains(fromChainName: string): Promise<any>;
export declare function getAvailableTokens(fromChainName: string, toChainName: string): Promise<any[]>;
export declare function estimateFee(fromChainName: string, toChainName: string, token: string, amount: number): Promise<{
    token: {
        symbol: any;
        decimals: any;
        mainnetAddress: any;
    };
    fee: string;
    breakdown: ({
        name: string;
        total: string;
        percent: number;
        display: string;
    } | {
        name: string;
        total: string;
        percent?: undefined;
        display?: undefined;
    } | {
        name: string;
        total: any;
        display: string;
        percent?: undefined;
    })[];
    totalFee: string;
    input: number;
    output: string;
    feeDisplay: string;
}>;
export declare function estimateFeeAsCsv(fromChainName: string, toChainName: string, token: string, amount: number): Promise<any[]>;
export declare function generateCSV(): Promise<void>;
//# sourceMappingURL=index.d.ts.map