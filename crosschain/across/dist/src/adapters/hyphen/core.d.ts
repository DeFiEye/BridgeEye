export declare const BASE_DIVISOR = 100000000;
export declare const DEFAULT_FIXED_DECIMAL_POINT = 5;
export declare const RPC_HEADERS: {
    origin: string;
};
export declare function loadConf(): Promise<{
    networks: any;
    tokens: any;
}>;
export declare function calculateBridgeFee(transferAmount: number, inputSymbol: string, fromChainName: string, toChainName: string): Promise<{
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
        total: any;
        display: string;
        percent?: undefined;
    })[];
    totalFee: string;
    input: number;
    output: string;
    feeDisplay: string;
}>;
//# sourceMappingURL=core.d.ts.map