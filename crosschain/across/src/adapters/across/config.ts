import assert from "assert";
import { Signer } from "./ethers";
import * as constants from "./constants";
import {
  HubPool,
  HubPool__factory,
  SpokePool,
  SpokePool__factory,
} from "@across-protocol/contracts-v2";
import filter from "lodash/filter";
import sortBy from "lodash/sortBy";

export type Token = constants.TokenInfo & {
  l1TokenAddress: string;
  address: string;
  isNative: boolean;
};
export type TokenList = Token[];

export class ConfigClient {
  public readonly spokeAddresses: Record<number, string> = {};
  public readonly spokeChains: Set<number> = new Set();
  public readonly fromChains: Set<number> = new Set();
  public readonly toChains: Set<number> = new Set();
  public tokenOrder: Record<string, number> = {};
  public chainOrder: Record<string, number> = {};
  public routes: constants.Routes = [];
  constructor(private config: constants.RouteConfig) {
    this.config.routes.forEach((route) => {
      this.spokeAddresses[route.fromChain] = route.fromSpokeAddress;
      this.spokeChains.add(route.fromChain);
      this.spokeChains.add(route.toChain);
      this.toChains.add(route.toChain);
      this.fromChains.add(route.fromChain);
    });
    // this lets us sort arbitrary array of tokens
    this.tokenOrder = Object.fromEntries(
      Object.entries(constants.tokenList).map(([index, token]) => [
        token.symbol,
        Number(index),
      ])
    );
    // this lets us sort arbitrary list of chains
    constants.chainInfoList.forEach((chain, index) => {
      const { chainId } = chain;
      assert(
        constants.isSupportedChainId(chainId),
        "Unsupported chainId: " + chainId
      );
      this.chainOrder[chainId] = Number(index);
    });
    // prioritize routes based on token symbol and tochain. This just gives us better route prioritization when filtering a fromChain
    this.routes = sortBy(this.config.routes, (route) => {
      return (
        this.tokenOrder[route.fromTokenSymbol] + this.chainOrder[route.toChain]
      );
    });
  }
  getWethAddress(): string {
    return this.config.hubPoolWethAddress;
  }
  getRoutes(): constants.Routes {
    return this.routes;
  }
  getSpokePoolAddress(chainId: constants.ChainId): string {
    const address = this.spokeAddresses[chainId];
    assert(address, "Spoke pool not supported on chain: " + chainId);
    return address;
  }
  getSpokePool(chainId: constants.ChainId, signer?: Signer): SpokePool {
    const address = this.getSpokePoolAddress(chainId);
    const provider = signer ?? constants.getProvider(chainId);
    return SpokePool__factory.connect(address, provider);
  }
  getHubPoolChainId(): constants.ChainId {
    return this.config.hubPoolChain;
  }
  getHubPoolAddress(): string {
    return this.config.hubPoolAddress;
  }
  getL1TokenAddressBySymbol(symbol: string) {
    // all routes have an l1Token address, so just find the first symbol that matches
    const route = this.getRoutes().find((x) => x.fromTokenSymbol === symbol);
    assert(route, `Unsupported l1 address lookup by symbol: ${symbol}`);
    return route.l1TokenAddress;
  }
  getHubPool(signer?: Signer): HubPool {
    const address = this.getHubPoolAddress();
    const provider = signer ?? constants.getProvider(this.getHubPoolChainId());
    return HubPool__factory.connect(address, provider);
  }
  filterRoutes(query: Partial<constants.Route>): constants.Routes {
    const cleanQuery: Partial<constants.Route> = Object.fromEntries(
      Object.entries(query).filter((entry) => {
        return entry[1] !== undefined;
      })
    );
    return filter(this.getRoutes(), cleanQuery);
  }
  listToChains(): constants.ChainInfoList {
    const result: constants.ChainInfoList = [];
    constants.chainInfoList.forEach((chain) => {
      if (this.toChains.has(chain.chainId)) {
        result.push(chain);
      }
    });
    return result;
  }
  listFromChains(): constants.ChainInfoList {
    const result: constants.ChainInfoList = [];
    constants.chainInfoList.forEach((chain) => {
      if (this.fromChains.has(chain.chainId)) {
        result.push(chain);
      }
    });
    return result;
  }
  // this maintains order specified in the constants file in the chainInfoList
  getSpokeChains(): constants.ChainInfoList {
    const result: constants.ChainInfoList = [];
    constants.chainInfoList.forEach((chain) => {
      if (this.spokeChains.has(chain.chainId)) {
        result.push(chain);
      }
    });
    return result;
  }
  getSpokeChainIds(): constants.ChainId[] {
    return this.getSpokeChains()
      .map((chain) => chain.chainId)
      .filter(constants.isSupportedChainId);
  }
  isSupportedChainId = (chainId: number): boolean => {
    return (
      constants.isSupportedChainId(chainId) && this.spokeChains.has(chainId)
    );
  };
  // returns token list in order specified by constants, but adds in token address for the chain specified
  getTokenList(chainId?: number): TokenList {
    const routeTable = Object.fromEntries(
      this.filterRoutes({ fromChain: chainId }).map((route) => {
        return [route.fromTokenSymbol, route];
      })
    );
    return constants.tokenList
      .filter((token: constants.TokenInfo) => routeTable[token.symbol])
      .map((token: constants.TokenInfo) => {
        const { fromTokenAddress, isNative, l1TokenAddress } =
          routeTable[token.symbol];
        return {
          ...token,
          address: fromTokenAddress,
          isNative,
          l1TokenAddress,
        };
      });
  }
  // this has a chance to mix up eth/weth which can be a problem. prefer token by symbol.
  getTokenInfoByAddress(chainId: number, address: string): Token {
    const tokens = this.getTokenList(chainId);
    const token = tokens.find((token) => token.address === address);
    assert(
      token,
      `Token not found on chain: ${chainId} and address ${address}`
    );
    return token;
  }
  getTokenInfoBySymbol(chainId: number, symbol: string): Token {
    const tokens = this.getTokenList(chainId);
    const token = tokens.find((token) => token.symbol === symbol);
    assert(token, `Token not found on chain ${chainId} and symbol ${symbol}`);
    const tokenInfo = constants.getToken(symbol);
    return {
      ...tokenInfo,
      address: token.address,
      isNative: token.isNative,
      l1TokenAddress: token.l1TokenAddress,
    };
  }
  getNativeTokenInfo(chainId: number): constants.TokenInfo {
    const chainInfo = constants.getChainInfo(chainId);
    return constants.getToken(chainInfo.nativeCurrencySymbol);
  }
  canBridge(fromChain: number, toChain: number): boolean {
    const routes = this.filterRoutes({ fromChain, toChain });
    return routes.length > 0;
  }
  filterReachableTokens(fromChain: number, toChain?: number): TokenList {
    const routes = this.filterRoutes({ fromChain, toChain });
    const reachableTokens = routes.map((route) =>
      this.getTokenInfoBySymbol(fromChain, route.fromTokenSymbol)
    );
    // use token sorting when returning reachable tokens
    return sortBy(reachableTokens, (token) => this.tokenOrder[token.symbol]);
  }
}

// singleton
let config: ConfigClient | undefined;
export function getConfig(): ConfigClient {
  if (config) return config;
  config = new ConfigClient(constants.routeConfig);
  return config;
}


