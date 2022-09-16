import { ethers } from "ethers";
import * as superstruct from "superstruct";
import { relayFeeCalculator } from "@across-protocol/sdk-v2";
export declare enum ChainId {
    MAINNET = 1,
    OPTIMISM = 10,
    ARBITRUM = 42161,
    BOBA = 288,
    POLYGON = 137,
    RINKEBY = 4,
    KOVAN = 42,
    KOVAN_OPTIMISM = 69,
    ARBITRUM_RINKEBY = 421611,
    GOERLI = 5,
    MUMBAI = 80001
}
export declare const BREAKPOINTS: {
    tabletMin: number;
    laptopMin: number;
    desktopMin: number;
};
export declare const QUERIES: {
    tabletAndUp: string;
    laptopAndUp: string;
    desktopAndUp: string;
    tabletAndDown: string;
    mobileAndDown: string;
};
export declare const COLORS: {
    gray: {
        100: string;
        150: string;
        160: string;
        175: string;
        200: string;
        250: string;
        300: string;
        500: string;
        550: string;
        600: string;
    };
    primary: {
        500: string;
        600: string;
        700: string;
    };
    secondary: {
        500: string;
    };
    error: {
        500: string;
        300: string;
    };
    white: string;
    black: string;
    umaRed: string;
    purple: string;
};
export declare const configStoreAddresses: Record<ChainId, string>;
export declare type ChainInfo = {
    name: string;
    fullName?: string;
    chainId: ChainId;
    logoURI: string;
    rpcUrl?: string;
    explorerUrl: string;
    constructExplorerLink: (txHash: string) => string;
    pollingInterval: number;
    nativeCurrencySymbol: string;
    earliestBlock: number;
};
export declare type ChainInfoList = ChainInfo[];
export declare type ChainInfoTable = Record<number, ChainInfo>;
export declare const defaultBlockPollingInterval: number;
export declare const chainInfoList: ChainInfoList;
export declare const chainInfoTable: ChainInfoTable;
export declare type TokenInfo = {
    name: string;
    symbol: string;
    decimals: number;
    logoURI: string;
    mainnetAddress?: string;
};
export declare type TokenInfoList = TokenInfo[];
export declare const tokenList: TokenInfoList;
export declare const hubPoolChainId: number;
export declare const disableDeposits: string | undefined;
export declare const enableReactQueryDevTools: string | undefined;
export declare const infuraId: string;
export declare const confirmations: number;
export declare const onboardApiKey: string;
export declare const matomoUrl: string | undefined;
export declare const debug: boolean;
export declare const MAX_APPROVAL_AMOUNT: ethers.BigNumber;
export declare const FEE_ESTIMATION = ".004";
export declare const MAX_RELAY_FEE_PERCENT: number;
export declare const FLAT_RELAY_CAPITAL_FEE: number;
export declare const AddressZero = "0x0000000000000000000000000000000000000000";
export declare const ArbitrumProviderUrl: string;
export declare const PolygonProviderUrl: string;
export declare function isSupportedChainId(chainId: number): chainId is ChainId;
export declare const providerUrls: [ChainId, string][];
export declare const providerUrlsTable: Record<number, string>;
export declare const providers: [number, ethers.providers.StaticJsonRpcProvider][];
export declare const providersTable: Record<number, ethers.providers.StaticJsonRpcProvider>;
export declare function getProvider(chainId?: ChainId): ethers.providers.StaticJsonRpcProvider;
export declare function getConfigStoreAddress(chainId?: ChainId): string;
export declare function getChainInfo(chainId: number): ChainInfo;
export declare const tokenTable: {
    [k: string]: TokenInfo;
};
export declare const getToken: (symbol: string) => TokenInfo;
declare const RouteSS: superstruct.Struct<{
    toChain: number;
    fromChain: number;
    fromTokenAddress: string;
    fromSpokeAddress: string;
    fromTokenSymbol: string;
    isNative: boolean;
    l1TokenAddress: string;
}, {
    fromChain: superstruct.Struct<number, null>;
    toChain: superstruct.Struct<number, null>;
    fromTokenAddress: superstruct.Struct<string, null>;
    fromSpokeAddress: superstruct.Struct<string, null>;
    fromTokenSymbol: superstruct.Struct<string, null>;
    isNative: superstruct.Struct<boolean, null>;
    l1TokenAddress: superstruct.Struct<string, null>;
}>;
declare const RoutesSS: superstruct.Struct<{
    toChain: number;
    fromChain: number;
    fromTokenAddress: string;
    fromSpokeAddress: string;
    fromTokenSymbol: string;
    isNative: boolean;
    l1TokenAddress: string;
}[], superstruct.Struct<{
    toChain: number;
    fromChain: number;
    fromTokenAddress: string;
    fromSpokeAddress: string;
    fromTokenSymbol: string;
    isNative: boolean;
    l1TokenAddress: string;
}, {
    fromChain: superstruct.Struct<number, null>;
    toChain: superstruct.Struct<number, null>;
    fromTokenAddress: superstruct.Struct<string, null>;
    fromSpokeAddress: superstruct.Struct<string, null>;
    fromTokenSymbol: superstruct.Struct<string, null>;
    isNative: superstruct.Struct<boolean, null>;
    l1TokenAddress: superstruct.Struct<string, null>;
}>>;
declare const RouteConfigSS: superstruct.Struct<{
    routes: {
        toChain: number;
        fromChain: number;
        fromTokenAddress: string;
        fromSpokeAddress: string;
        fromTokenSymbol: string;
        isNative: boolean;
        l1TokenAddress: string;
    }[];
    hubPoolWethAddress: string;
    hubPoolChain: number;
    hubPoolAddress: string;
}, {
    routes: superstruct.Struct<{
        toChain: number;
        fromChain: number;
        fromTokenAddress: string;
        fromSpokeAddress: string;
        fromTokenSymbol: string;
        isNative: boolean;
        l1TokenAddress: string;
    }[], superstruct.Struct<{
        toChain: number;
        fromChain: number;
        fromTokenAddress: string;
        fromSpokeAddress: string;
        fromTokenSymbol: string;
        isNative: boolean;
        l1TokenAddress: string;
    }, {
        fromChain: superstruct.Struct<number, null>;
        toChain: superstruct.Struct<number, null>;
        fromTokenAddress: superstruct.Struct<string, null>;
        fromSpokeAddress: superstruct.Struct<string, null>;
        fromTokenSymbol: superstruct.Struct<string, null>;
        isNative: superstruct.Struct<boolean, null>;
        l1TokenAddress: superstruct.Struct<string, null>;
    }>>;
    hubPoolWethAddress: superstruct.Struct<string, null>;
    hubPoolChain: superstruct.Struct<number, null>;
    hubPoolAddress: superstruct.Struct<string, null>;
}>;
export declare type RouteConfig = superstruct.Infer<typeof RouteConfigSS>;
export declare type Route = superstruct.Infer<typeof RouteSS>;
export declare type Routes = superstruct.Infer<typeof RoutesSS>;
export declare function getRoutes(chainId: ChainId): RouteConfig;
export declare const routeConfig: {
    routes: {
        toChain: number;
        fromChain: number;
        fromTokenAddress: string;
        fromSpokeAddress: string;
        fromTokenSymbol: string;
        isNative: boolean;
        l1TokenAddress: string;
    }[];
    hubPoolWethAddress: string;
    hubPoolChain: number;
    hubPoolAddress: string;
};
export declare const hubPoolAddress: string;
export declare const migrationPoolV2Warning: string | undefined;
export declare const enableMigration: string | undefined;
export declare const dummyFromAddress: string;
export declare const relayerFeeCapitalCostConfig: {
    [token: string]: relayFeeCalculator.CapitalCostConfig;
};
export declare const queriesTable: {
    1: (provider: ethers.providers.Provider) => relayFeeCalculator.EthereumQueries;
    42161: (provider: ethers.providers.Provider) => relayFeeCalculator.ArbitrumQueries;
    10: (provider: ethers.providers.Provider) => relayFeeCalculator.OptimismQueries;
    288: (provider: ethers.providers.Provider) => relayFeeCalculator.BobaQueries;
    137: (provider: ethers.providers.Provider) => relayFeeCalculator.PolygonQueries;
    42: (provider: ethers.providers.Provider) => relayFeeCalculator.EthereumQueries;
    4: (provider: ethers.providers.Provider) => relayFeeCalculator.EthereumQueries;
    5: (provider: ethers.providers.Provider) => relayFeeCalculator.EthereumQueries;
    80001: (provider: ethers.providers.Provider) => relayFeeCalculator.PolygonQueries;
    69: (provider: ethers.providers.Provider) => relayFeeCalculator.OptimismQueries;
    421611: (provider: ethers.providers.Provider) => relayFeeCalculator.ArbitrumQueries;
};
export declare const referrerDelimiterHex = "0xd00dfeeddeadbeef";
export declare function calculateAvailableToChains(fromChain: ChainId, routes: Routes, availableChains?: ChainInfoList): {
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
export {};
//# sourceMappingURL=constants.d.ts.map