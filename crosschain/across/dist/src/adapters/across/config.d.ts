import { Signer } from "./ethers";
import * as constants from "./constants";
import { HubPool, SpokePool } from "@across-protocol/contracts-v2";
export declare type Token = constants.TokenInfo & {
    l1TokenAddress: string;
    address: string;
    isNative: boolean;
};
export declare type TokenList = Token[];
export declare class ConfigClient {
    private config;
    readonly spokeAddresses: Record<number, string>;
    readonly spokeChains: Set<number>;
    readonly fromChains: Set<number>;
    readonly toChains: Set<number>;
    tokenOrder: Record<string, number>;
    chainOrder: Record<string, number>;
    routes: constants.Routes;
    constructor(config: constants.RouteConfig);
    getWethAddress(): string;
    getRoutes(): constants.Routes;
    getSpokePoolAddress(chainId: constants.ChainId): string;
    getSpokePool(chainId: constants.ChainId, signer?: Signer): SpokePool;
    getHubPoolChainId(): constants.ChainId;
    getHubPoolAddress(): string;
    getL1TokenAddressBySymbol(symbol: string): string;
    getHubPool(signer?: Signer): HubPool;
    filterRoutes(query: Partial<constants.Route>): constants.Routes;
    listToChains(): constants.ChainInfoList;
    listFromChains(): constants.ChainInfoList;
    getSpokeChains(): constants.ChainInfoList;
    getSpokeChainIds(): constants.ChainId[];
    isSupportedChainId: (chainId: number) => boolean;
    getTokenList(chainId?: number): TokenList;
    getTokenInfoByAddress(chainId: number, address: string): Token;
    getTokenInfoBySymbol(chainId: number, symbol: string): Token;
    getNativeTokenInfo(chainId: number): constants.TokenInfo;
    canBridge(fromChain: number, toChain: number): boolean;
    filterReachableTokens(fromChain: number, toChain?: number): TokenList;
}
export declare function getConfig(): ConfigClient;
//# sourceMappingURL=config.d.ts.map