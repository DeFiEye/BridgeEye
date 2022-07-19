"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = exports.ConfigClient = void 0;
const assert_1 = __importDefault(require("assert"));
const constants = __importStar(require("./constants"));
const contracts_v2_1 = require("@across-protocol/contracts-v2");
const filter_1 = __importDefault(require("lodash/filter"));
const sortBy_1 = __importDefault(require("lodash/sortBy"));
class ConfigClient {
    constructor(config) {
        this.config = config;
        this.spokeAddresses = {};
        this.spokeChains = new Set();
        this.fromChains = new Set();
        this.toChains = new Set();
        this.tokenOrder = {};
        this.chainOrder = {};
        this.routes = [];
        this.isSupportedChainId = (chainId) => {
            return (constants.isSupportedChainId(chainId) && this.spokeChains.has(chainId));
        };
        this.config.routes.forEach((route) => {
            this.spokeAddresses[route.fromChain] = route.fromSpokeAddress;
            this.spokeChains.add(route.fromChain);
            this.spokeChains.add(route.toChain);
            this.toChains.add(route.toChain);
            this.fromChains.add(route.fromChain);
        });
        // this lets us sort arbitrary array of tokens
        this.tokenOrder = Object.fromEntries(Object.entries(constants.tokenList).map(([index, token]) => [
            token.symbol,
            Number(index),
        ]));
        // this lets us sort arbitrary list of chains
        constants.chainInfoList.forEach((chain, index) => {
            const { chainId } = chain;
            (0, assert_1.default)(constants.isSupportedChainId(chainId), "Unsupported chainId: " + chainId);
            this.chainOrder[chainId] = Number(index);
        });
        // prioritize routes based on token symbol and tochain. This just gives us better route prioritization when filtering a fromChain
        this.routes = (0, sortBy_1.default)(this.config.routes, (route) => {
            return (this.tokenOrder[route.fromTokenSymbol] + this.chainOrder[route.toChain]);
        });
    }
    getWethAddress() {
        return this.config.hubPoolWethAddress;
    }
    getRoutes() {
        return this.routes;
    }
    getSpokePoolAddress(chainId) {
        const address = this.spokeAddresses[chainId];
        (0, assert_1.default)(address, "Spoke pool not supported on chain: " + chainId);
        return address;
    }
    getSpokePool(chainId, signer) {
        const address = this.getSpokePoolAddress(chainId);
        const provider = signer !== null && signer !== void 0 ? signer : constants.getProvider(chainId);
        return contracts_v2_1.SpokePool__factory.connect(address, provider);
    }
    getHubPoolChainId() {
        return this.config.hubPoolChain;
    }
    getHubPoolAddress() {
        return this.config.hubPoolAddress;
    }
    getL1TokenAddressBySymbol(symbol) {
        // all routes have an l1Token address, so just find the first symbol that matches
        const route = this.getRoutes().find((x) => x.fromTokenSymbol === symbol);
        (0, assert_1.default)(route, `Unsupported l1 address lookup by symbol: ${symbol}`);
        return route.l1TokenAddress;
    }
    getHubPool(signer) {
        const address = this.getHubPoolAddress();
        const provider = signer !== null && signer !== void 0 ? signer : constants.getProvider(this.getHubPoolChainId());
        return contracts_v2_1.HubPool__factory.connect(address, provider);
    }
    filterRoutes(query) {
        const cleanQuery = Object.fromEntries(Object.entries(query).filter((entry) => {
            return entry[1] !== undefined;
        }));
        return (0, filter_1.default)(this.getRoutes(), cleanQuery);
    }
    listToChains() {
        const result = [];
        constants.chainInfoList.forEach((chain) => {
            if (this.toChains.has(chain.chainId)) {
                result.push(chain);
            }
        });
        return result;
    }
    listFromChains() {
        const result = [];
        constants.chainInfoList.forEach((chain) => {
            if (this.fromChains.has(chain.chainId)) {
                result.push(chain);
            }
        });
        return result;
    }
    // this maintains order specified in the constants file in the chainInfoList
    getSpokeChains() {
        const result = [];
        constants.chainInfoList.forEach((chain) => {
            if (this.spokeChains.has(chain.chainId)) {
                result.push(chain);
            }
        });
        return result;
    }
    getSpokeChainIds() {
        return this.getSpokeChains()
            .map((chain) => chain.chainId)
            .filter(constants.isSupportedChainId);
    }
    // returns token list in order specified by constants, but adds in token address for the chain specified
    getTokenList(chainId) {
        const routeTable = Object.fromEntries(this.filterRoutes({ fromChain: chainId }).map((route) => {
            return [route.fromTokenSymbol, route];
        }));
        return constants.tokenList
            .filter((token) => routeTable[token.symbol])
            .map((token) => {
            const { fromTokenAddress, isNative, l1TokenAddress } = routeTable[token.symbol];
            return {
                ...token,
                address: fromTokenAddress,
                isNative,
                l1TokenAddress,
            };
        });
    }
    // this has a chance to mix up eth/weth which can be a problem. prefer token by symbol.
    getTokenInfoByAddress(chainId, address) {
        const tokens = this.getTokenList(chainId);
        const token = tokens.find((token) => token.address === address);
        (0, assert_1.default)(token, `Token not found on chain: ${chainId} and address ${address}`);
        return token;
    }
    getTokenInfoBySymbol(chainId, symbol) {
        const tokens = this.getTokenList(chainId);
        const token = tokens.find((token) => token.symbol === symbol);
        (0, assert_1.default)(token, `Token not found on chain ${chainId} and symbol ${symbol}`);
        const tokenInfo = constants.getToken(symbol);
        return {
            ...tokenInfo,
            address: token.address,
            isNative: token.isNative,
            l1TokenAddress: token.l1TokenAddress,
        };
    }
    getNativeTokenInfo(chainId) {
        const chainInfo = constants.getChainInfo(chainId);
        return constants.getToken(chainInfo.nativeCurrencySymbol);
    }
    canBridge(fromChain, toChain) {
        const routes = this.filterRoutes({ fromChain, toChain });
        return routes.length > 0;
    }
    filterReachableTokens(fromChain, toChain) {
        const routes = this.filterRoutes({ fromChain, toChain });
        const reachableTokens = routes.map((route) => this.getTokenInfoBySymbol(fromChain, route.fromTokenSymbol));
        // use token sorting when returning reachable tokens
        return (0, sortBy_1.default)(reachableTokens, (token) => this.tokenOrder[token.symbol]);
    }
}
exports.ConfigClient = ConfigClient;
// singleton
let config;
function getConfig() {
    if (config)
        return config;
    config = new ConfigClient(constants.routeConfig);
    return config;
}
exports.getConfig = getConfig;
//# sourceMappingURL=config.js.map