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
exports.calculateAvailableToChains = exports.referrerDelimiterHex = exports.queriesTable = exports.relayerFeeCapitalCostConfig = exports.dummyFromAddress = exports.enableMigration = exports.migrationPoolV2Warning = exports.hubPoolAddress = exports.routeConfig = exports.getRoutes = exports.getToken = exports.tokenTable = exports.getChainInfo = exports.getConfigStoreAddress = exports.getProvider = exports.providersTable = exports.providers = exports.providerUrlsTable = exports.providerUrls = exports.isSupportedChainId = exports.PolygonProviderUrl = exports.ArbitrumProviderUrl = exports.AddressZero = exports.FLAT_RELAY_CAPITAL_FEE = exports.MAX_RELAY_FEE_PERCENT = exports.FEE_ESTIMATION = exports.MAX_APPROVAL_AMOUNT = exports.debug = exports.matomoUrl = exports.onboardApiKey = exports.confirmations = exports.infuraId = exports.enableReactQueryDevTools = exports.disableDeposits = exports.hubPoolChainId = exports.tokenList = exports.chainInfoTable = exports.chainInfoList = exports.defaultBlockPollingInterval = exports.configStoreAddresses = exports.COLORS = exports.QUERIES = exports.BREAKPOINTS = exports.ChainId = void 0;
const assert_1 = __importDefault(require("assert"));
const ethers_1 = require("ethers");
// import ethereumLogo from "assets/ethereum-logo.svg";
// import optimismLogo from "assets/optimism-alt-logo.svg";
// import wethLogo from "assets/weth-logo.svg";
// import arbitrumLogo from "assets/arbitrum-logo.svg";
// import bobaLogo from "assets/boba-logo.svg";
// import polygonLogo from "assets/polygon-logo.svg";
const address_1 = require("./address");
const superstruct = __importStar(require("superstruct"));
const sdk_v2_1 = require("@across-protocol/sdk-v2");
// all routes should be pre imported to be able to switch based on chain id
const routes_42_0x8d84F51710dfa9D409027B167371bBd79e0539e5_json_1 = __importDefault(require("./data/routes_42_0x8d84F51710dfa9D409027B167371bBd79e0539e5.json"));
const routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda_json_1 = __importDefault(require("./data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json"));
const routes_5_0xA44A832B994f796452e4FaF191a041F791AD8A0A_json_1 = __importDefault(require("./data/routes_5_0xA44A832B994f796452e4FaF191a041F791AD8A0A.json"));
Object.assign(process.env, {
    NODE_ENV: "production",
    PUBLIC_URL: "",
    WDS_SOCKET_HOST: void 0,
    WDS_SOCKET_PATH: void 0,
    WDS_SOCKET_PORT: void 0,
    FAST_REFRESH: !0,
    REACT_APP_CHAIN_42161_PROVIDER_URL: "https://arb-mainnet.g.alchemy.com/v2/rvEe3jmqTCgDjFQW6AzhDwXO6tEaUJzG",
    REACT_APP_MIGRATION_POOL_V2_WARNING: "true",
    REACT_APP_VERCEL_ORG_ID: "team_8iEcNoQqez36TrK1mWGXpIEG",
    REACT_APP_FLAT_RELAY_CAPITAL_FEE: "0.04",
    REACT_APP_MATOMO_URL: "https://across.matomo.cloud/",
    REACT_APP_VERCEL_URL: "frontend-v2-6apvry1sa-uma.vercel.app",
    REACT_APP_VERCEL_GIT_COMMIT_SHA: "f5b892a1e47b820d21687591c1c47bb7389f5bf3",
    REACT_APP_CHAIN_137_PROVIDER_URL: "https://polygon-mainnet.g.alchemy.com/v2/JmSqZejNkyn1RZF-6A2jsKqaDfAqFqt8",
    REACT_APP_WETH_ADDRESS: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    REACT_APP_PUBLIC_ONBOARD_API_KEY: "246a3615-2bca-41a8-a545-9b33aa037340",
    REACT_APP_GAS_PRICE_BUFFER: "50",
    REACT_APP_VERCEL_ENV: "production",
    REACT_APP_VERCEL_GIT_PROVIDER: "github",
    REACT_APP_VERCEL_GIT_COMMIT_AUTHOR_LOGIN: "daywiss",
    REACT_APP_HUBPOOL_CHAINID: "1",
    REACT_APP_VERCEL_PROJECT_ID: "prj_85sGuQqvgRapoeetd3mzDfrISXKy",
    REACT_APP_VERCEL_EDGE_FUNCTIONS_STRICT_MODE: "1",
    REACT_APP_VERCEL_GIT_COMMIT_AUTHOR_NAME: "David A",
    REACT_APP_VERCEL_BUILD_OUTPUTS_EDGE_FUNCTION: "1",
    REACT_APP_TRANSFER_RESTRICTED_RELAYERS: "[]",
    REACT_APP_VERCEL_GIT_REPO_SLUG: "frontend-v2",
    REACT_APP_VERCEL_GIT_REPO_OWNER: "across-protocol",
    REACT_APP_FULL_RELAYERS: '["0x428AB2BA90Eba0a4Be7aF34C9Ac451ab061AC010"]',
    REACT_APP_VERCEL_GIT_COMMIT_MESSAGE: "fix: fix issue with remove liquidity when decimals are input (#159)\n\nSigned-off-by: David <david@umaproject.org>",
    REACT_APP_VERCEL_ARTIFACTS_TOKEN: "artifacts:eyJkZXBsb3ltZW50SWQiOiJkcGxfRnVDcjRuekFNeWIzd3kyV3Q4U3lxZDh6WGk4QyIsIm93bmVySWQiOiJ0ZWFtXzhpRWNOb1FxZXozNlRySzFtV0dYcElFRyIsInRpY2tldCI6ImdxRjB6UWNJb1dPUzJTQmtjR3hmUm5WRGNqUnVla0ZOZVdJemQza3lWM1E0VTNseFpEaDZXR2s0UTYxQlVFbGZRVkpVU1VaQlExUlRFYUlYRlFNbmRHc3oxbEVjR256MGVXRDNMMnc9In0=",
    REACT_APP_PUBLIC_INFURA_ID: "b14cb6f39de44042802cf5c83d69c6f1",
    REACT_APP_VERCEL_ARTIFACTS_OWNER: "team_8iEcNoQqez36TrK1mWGXpIEG",
    REACT_APP_VERCEL_GIT_REPO_ID: "465308257",
    REACT_APP_DUMMY_FROM_ADDRESS: "0x893d0d70ad97717052e3aa8903d9615804167759",
    REACT_APP_VERCEL_GIT_COMMIT_REF: "master",
    REACT_APP_VERCEL_API_DC_ENDPOINT: "https://api-{{dc}}.vercel.com",
});
/* Chains and Tokens section */
var ChainId;
(function (ChainId) {
    ChainId[ChainId["MAINNET"] = 1] = "MAINNET";
    ChainId[ChainId["OPTIMISM"] = 10] = "OPTIMISM";
    ChainId[ChainId["ARBITRUM"] = 42161] = "ARBITRUM";
    ChainId[ChainId["BOBA"] = 288] = "BOBA";
    ChainId[ChainId["POLYGON"] = 137] = "POLYGON";
    // testnets
    ChainId[ChainId["RINKEBY"] = 4] = "RINKEBY";
    ChainId[ChainId["KOVAN"] = 42] = "KOVAN";
    ChainId[ChainId["KOVAN_OPTIMISM"] = 69] = "KOVAN_OPTIMISM";
    ChainId[ChainId["ARBITRUM_RINKEBY"] = 421611] = "ARBITRUM_RINKEBY";
    ChainId[ChainId["GOERLI"] = 5] = "GOERLI";
    // Polygon testnet
    ChainId[ChainId["MUMBAI"] = 80001] = "MUMBAI";
})(ChainId = exports.ChainId || (exports.ChainId = {}));
/* Colors and Media Queries section */
exports.BREAKPOINTS = {
    tabletMin: 550,
    laptopMin: 1100,
    desktopMin: 1500,
};
exports.QUERIES = {
    tabletAndUp: `(min-width: ${exports.BREAKPOINTS.tabletMin / 16}rem)`,
    laptopAndUp: `(min-width: ${exports.BREAKPOINTS.laptopMin / 16}rem)`,
    desktopAndUp: `(min-width: ${exports.BREAKPOINTS.desktopMin / 16}rem)`,
    tabletAndDown: `(max-width: ${(exports.BREAKPOINTS.laptopMin - 1) / 16}rem)`,
    mobileAndDown: `(max-width: ${(exports.BREAKPOINTS.tabletMin - 1) / 16}rem)`,
};
exports.COLORS = {
    gray: {
        100: "0deg 0% 89%",
        // Hex: #F5F5F5
        150: "0deg 0% 96%",
        // #2C2F33
        160: "214.3deg 7.4% 18.6%",
        // #27292c
        175: "216deg 6% 16.3%",
        // hsl(214.3,7.4%,18.6%)
        200: "220deg 2% 72%",
        // #2c2e32
        250: "220deg 6.4% 18.4%",
        300: "240deg 4% 27%",
        // #2d2e33
        500: "230deg 6% 19%",
        // #68686c
        550: "240deg 2% 42%",
        // #4d4c53
        600: "249deg 4% 31%",
    },
    primary: {
        // #6df8d8
        500: "166deg 92% 70%",
        // #565757
        600: "180deg 0.6% 33.9%",
        700: "180deg 15% 25%",
    },
    secondary: {
        500: "266deg 77% 62%",
    },
    error: {
        500: "11deg 92% 70%",
        300: "11deg 93% 94%",
    },
    // Hex: #ffffff
    white: "0deg 100% 100%",
    black: "0deg 0% 0%",
    umaRed: "0deg 100% 65%",
    purple: "267deg 77% 62%",
};
// Update once addresses are known
exports.configStoreAddresses = {
    [ChainId.MAINNET]: (0, address_1.getAddress)("0x3B03509645713718B78951126E0A6de6f10043f5"),
    [ChainId.ARBITRUM]: ethers_1.ethers.constants.AddressZero,
    [ChainId.OPTIMISM]: ethers_1.ethers.constants.AddressZero,
    [ChainId.BOBA]: ethers_1.ethers.constants.AddressZero,
    [ChainId.POLYGON]: ethers_1.ethers.constants.AddressZero,
    [ChainId.RINKEBY]: ethers_1.ethers.constants.AddressZero,
    [ChainId.KOVAN]: (0, address_1.getAddress)("0xDd74f7603e3fDA6435aEc91F8960a6b8b40415f3"),
    [ChainId.KOVAN_OPTIMISM]: ethers_1.ethers.constants.AddressZero,
    [ChainId.ARBITRUM_RINKEBY]: ethers_1.ethers.constants.AddressZero,
    [ChainId.GOERLI]: (0, address_1.getAddress)("0x3215e3C91f87081757d0c41EF0CB77738123Be83"),
    [ChainId.MUMBAI]: ethers_1.ethers.constants.AddressZero,
};
exports.defaultBlockPollingInterval = Number(process.env.REACT_APP_DEFAULT_BLOCK_POLLING_INTERVAL_S || 30) * 1000;
const defaultConstructExplorerLink = (explorerUrl) => (txHash) => `${explorerUrl}/tx/${txHash}`;
exports.chainInfoList = [
    {
        name: "Ethereum",
        fullName: "Ethereum Mainnet",
        chainId: ChainId.MAINNET,
        logoURI: "",
        explorerUrl: "https://etherscan.io",
        constructExplorerLink: defaultConstructExplorerLink("https://etherscan.io"),
        nativeCurrencySymbol: "ETH",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 14704425,
    },
    {
        name: "Arbitrum",
        fullName: "Arbitrum One",
        chainId: ChainId.ARBITRUM,
        logoURI: "",
        rpcUrl: "https://arb1.arbitrum.io/rpc",
        explorerUrl: "https://arbiscan.io",
        constructExplorerLink: (txHash) => `https://arbiscan.io/tx/${txHash}`,
        nativeCurrencySymbol: "AETH",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 11102271,
    },
    {
        name: "Boba",
        chainId: ChainId.BOBA,
        logoURI: "",
        rpcUrl: "https://mainnet.boba.network",
        explorerUrl: "https://blockexplorer.boba.network",
        constructExplorerLink: (txHash) => `https://blockexplorer.boba.network/tx/${txHash}`,
        nativeCurrencySymbol: "ETH",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 551955,
    },
    {
        name: "Optimism",
        chainId: ChainId.OPTIMISM,
        logoURI: "",
        rpcUrl: "https://mainnet.optimism.io",
        explorerUrl: "https://optimistic.etherscan.io",
        constructExplorerLink: (txHash) => `https://optimistic.etherscan.io/tx/${txHash}`,
        nativeCurrencySymbol: "OETH",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 6979967,
    },
    {
        name: "Polygon",
        fullName: "Polygon Network",
        chainId: ChainId.POLYGON,
        logoURI: "",
        rpcUrl: "https://rpc.ankr.com/polygon",
        explorerUrl: "https://polygonscan.com",
        constructExplorerLink: defaultConstructExplorerLink("https://polygonscan.com"),
        nativeCurrencySymbol: "MATIC",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 27875891,
    },
    {
        name: "Goerli",
        fullName: "Goerli Testnet",
        chainId: ChainId.GOERLI,
        logoURI: "",
        explorerUrl: "https://goerli.etherscan.io/",
        constructExplorerLink: defaultConstructExplorerLink("https://goerli.etherscan.io/"),
        nativeCurrencySymbol: "ETH",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 6586188,
    },
    {
        name: "Kovan",
        fullName: "Ethereum Testnet Kovan",
        chainId: ChainId.KOVAN,
        logoURI: "",
        explorerUrl: "https://kovan.etherscan.io",
        constructExplorerLink: defaultConstructExplorerLink("https://kovan.etherscan.io"),
        nativeCurrencySymbol: "KOV",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 31457386,
    },
    {
        name: "Optimism Kovan",
        fullName: "Optimism Testnet Kovan",
        chainId: ChainId.KOVAN_OPTIMISM,
        logoURI: "",
        rpcUrl: "https://kovan.optimism.io",
        explorerUrl: "https://kovan-optimistic.etherscan.io",
        constructExplorerLink: (txHash) => `https://kovan-optimistic.etherscan.io/tx/${txHash}`,
        nativeCurrencySymbol: "KOR",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 2537971,
    },
    {
        name: "Mumbai",
        chainId: ChainId.MUMBAI,
        logoURI: "",
        rpcUrl: "https://matic-mumbai.chainstacklabs.com",
        explorerUrl: "https://mumbai.polygonscan.com",
        constructExplorerLink: defaultConstructExplorerLink("https://mumbai.polygonscan.com"),
        nativeCurrencySymbol: "WMATIC",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 25751326,
    },
    {
        name: "Arbitrum Rinkeby",
        fullName: "Arbitrum Testnet Rinkeby",
        chainId: ChainId.ARBITRUM_RINKEBY,
        logoURI: "",
        explorerUrl: "https://rinkeby-explorer.arbitrum.io",
        constructExplorerLink: (txHash) => `https://rinkeby-explorer.arbitrum.io/tx/${txHash}`,
        rpcUrl: "https://rinkeby.arbitrum.io/rpc",
        nativeCurrencySymbol: "ARETH",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 10523275,
    },
    {
        name: "Rinkeby",
        fullName: "Rinkeby Testnet",
        chainId: ChainId.RINKEBY,
        logoURI: "",
        explorerUrl: "https://rinkeby.etherscan.io",
        constructExplorerLink: defaultConstructExplorerLink("https://rinkeby.etherscan.io"),
        nativeCurrencySymbol: "ETH",
        pollingInterval: exports.defaultBlockPollingInterval,
        earliestBlock: 10485193,
    },
];
exports.chainInfoTable = Object.fromEntries(exports.chainInfoList.map((chain) => {
    return [chain.chainId, chain];
}, []));
exports.tokenList = [
    {
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
        logoURI: "",
        mainnetAddress: (0, address_1.getAddress)("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    },
    {
        name: "Ether",
        symbol: "OETH",
        decimals: 18,
        logoURI: "/logos/ethereum-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    },
    {
        name: "Ether",
        symbol: "AETH",
        decimals: 18,
        logoURI: "/logos/ethereum-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    },
    {
        name: "Matic",
        symbol: "WMATIC",
        decimals: 18,
        logoURI: "/logos/ethereum-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"),
    },
    {
        name: "Kovan Ethereum",
        symbol: "KOV",
        decimals: 18,
        logoURI: "/logos/ethereum-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    },
    {
        name: "Ether",
        symbol: "KOR",
        decimals: 18,
        logoURI: "/logos/ethereum-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    },
    {
        name: "Ether",
        symbol: "ARETH",
        decimals: 18,
        logoURI: "/logos/ethereum-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    },
    {
        name: "Wrapped Ether",
        symbol: "WETH",
        decimals: 18,
        logoURI: "",
        mainnetAddress: (0, address_1.getAddress)("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
    },
    {
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        logoURI: "/logos/usdc-logo.png",
        mainnetAddress: (0, address_1.getAddress)("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
    },
    {
        name: "Dai Stablecoin",
        symbol: "DAI",
        decimals: 18,
        logoURI: "/logos/dai-logo.png",
        mainnetAddress: (0, address_1.getAddress)("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
    },
    {
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        decimals: 8,
        logoURI: "/logos/wbtc-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"),
    },
    {
        name: "Boba",
        symbol: "BOBA",
        decimals: 18,
        logoURI: "/logos/boba-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0x42bbfa2e77757c645eeaad1655e0911a7553efbc"),
    },
    {
        name: "Badger",
        symbol: "BADGER",
        decimals: 18,
        logoURI: "/logos/badger-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0x3472A5A71965499acd81997a54BBA8D852C6E53d"),
    },
    {
        name: "UMA",
        symbol: "UMA",
        decimals: 18,
        logoURI: "/logos/uma-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828"),
    },
    {
        name: "Matic",
        symbol: "MATIC",
        decimals: 18,
        logoURI: "/logos/ethereum-logo.svg",
        mainnetAddress: (0, address_1.getAddress)("0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"),
    },
];
(0, assert_1.default)(process.env.REACT_APP_HUBPOOL_CHAINID, "Missing process.env.REACT_APP_HUBPOOL_CHAINID");
(0, assert_1.default)(process.env.REACT_APP_PUBLIC_INFURA_ID, "Missing process.env.REACT_APP_PUBLIC_INFURA_ID");
(0, assert_1.default)(process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY, "Missing process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY");
exports.hubPoolChainId = Number(process.env.REACT_APP_HUBPOOL_CHAINID);
exports.disableDeposits = process.env.REACT_APP_DISABLE_DEPOSITS;
exports.enableReactQueryDevTools = process.env.REACT_APP_ENABLE_REACT_QUERY_DEV_TOOLS;
exports.infuraId = process.env.REACT_APP_PUBLIC_INFURA_ID;
exports.confirmations = Number(process.env.REACT_APP_PUBLIC_CONFIRMATIONS) || 1;
exports.onboardApiKey = process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY;
exports.matomoUrl = process.env.REACT_APP_MATOMO_URL;
exports.debug = Boolean(process.env.REACT_APP_DEBUG);
exports.MAX_APPROVAL_AMOUNT = ethers_1.ethers.constants.MaxUint256;
exports.FEE_ESTIMATION = ".004";
exports.MAX_RELAY_FEE_PERCENT = Number(process.env.REACT_APP_MAX_RELAY_FEE_PERCENT || 50);
exports.FLAT_RELAY_CAPITAL_FEE = process.env
    .REACT_APP_FLAT_RELAY_CAPITAL_FEE
    ? Number(process.env.REACT_APP_FLAT_RELAY_CAPITAL_FEE)
    : 0;
exports.AddressZero = ethers_1.ethers.constants.AddressZero;
exports.ArbitrumProviderUrl = process.env.REACT_APP_CHAIN_42161_PROVIDER_URL ||
    `https://arbitrum-mainnet.infura.io/v3/${exports.infuraId}`;
exports.PolygonProviderUrl = process.env.REACT_APP_CHAIN_137_PROVIDER_URL ||
    `https://polygon-mainnet.infura.io/v3/${exports.infuraId}`;
(0, assert_1.default)(isSupportedChainId(exports.hubPoolChainId), "Hubpool chain is not supported: " + exports.hubPoolChainId);
function isSupportedChainId(chainId) {
    return chainId in ChainId;
}
exports.isSupportedChainId = isSupportedChainId;
exports.providerUrls = [
    [ChainId.MAINNET, `https://mainnet.infura.io/v3/${exports.infuraId}`],
    [ChainId.ARBITRUM, exports.ArbitrumProviderUrl],
    [ChainId.POLYGON, exports.PolygonProviderUrl],
    [ChainId.OPTIMISM, `https://optimism-mainnet.infura.io/v3/${exports.infuraId}`],
    [ChainId.BOBA, `https://mainnet.boba.network`],
    [ChainId.RINKEBY, `https://rinkeby.infura.io/v3/${exports.infuraId}`],
    [ChainId.KOVAN, `https://kovan.infura.io/v3/${exports.infuraId}`],
    [ChainId.KOVAN_OPTIMISM, `https://optimism-kovan.infura.io/v3/${exports.infuraId}`],
    [
        ChainId.ARBITRUM_RINKEBY,
        `https://arbitrum-rinkeby.infura.io/v3/${exports.infuraId}`,
    ],
    [ChainId.GOERLI, `https://goerli.infura.io/v3/${exports.infuraId}`],
    [ChainId.MUMBAI, `https://polygon-mumbai.infura.io/v3/${exports.infuraId}`],
];
exports.providerUrlsTable = Object.fromEntries(exports.providerUrls);
exports.providers = exports.providerUrls.map(([chainId, url]) => {
    return [chainId, new ethers_1.ethers.providers.StaticJsonRpcProvider(url)];
});
exports.providersTable = Object.fromEntries(exports.providers);
function getProvider(chainId = exports.hubPoolChainId) {
    return exports.providersTable[chainId];
}
exports.getProvider = getProvider;
function getConfigStoreAddress(chainId = exports.hubPoolChainId) {
    const configStoreAddress = exports.configStoreAddresses[chainId];
    (0, assert_1.default)(configStoreAddress !== exports.AddressZero, "Config Store address not set for chain: " + chainId);
    return configStoreAddress;
}
exports.getConfigStoreAddress = getConfigStoreAddress;
function getChainInfo(chainId) {
    (0, assert_1.default)(isSupportedChainId(chainId), "Unsupported chain id " + chainId);
    return exports.chainInfoTable[chainId];
}
exports.getChainInfo = getChainInfo;
exports.tokenTable = Object.fromEntries(exports.tokenList.map((token) => {
    return [token.symbol, token];
}));
const getToken = (symbol) => {
    const token = exports.tokenTable[symbol];
    (0, assert_1.default)(token, "No token found for symbol: " + symbol);
    return token;
};
exports.getToken = getToken;
const RouteSS = superstruct.object({
    fromChain: superstruct.number(),
    toChain: superstruct.number(),
    fromTokenAddress: superstruct.string(),
    fromSpokeAddress: superstruct.string(),
    fromTokenSymbol: superstruct.string(),
    isNative: superstruct.boolean(),
    l1TokenAddress: superstruct.string(),
});
const RoutesSS = superstruct.array(RouteSS);
const RouteConfigSS = superstruct.type({
    routes: RoutesSS,
    hubPoolWethAddress: superstruct.string(),
    hubPoolChain: superstruct.number(),
    hubPoolAddress: superstruct.string(),
});
function getRoutes(chainId) {
    if (chainId === ChainId.KOVAN) {
        superstruct.assert(routes_42_0x8d84F51710dfa9D409027B167371bBd79e0539e5_json_1.default, RouteConfigSS);
        return routes_42_0x8d84F51710dfa9D409027B167371bBd79e0539e5_json_1.default;
    }
    if (chainId === ChainId.MAINNET) {
        superstruct.assert(routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda_json_1.default, RouteConfigSS);
        return routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda_json_1.default;
    }
    if (chainId === ChainId.GOERLI) {
        superstruct.assert(routes_5_0xA44A832B994f796452e4FaF191a041F791AD8A0A_json_1.default, RouteConfigSS);
        return routes_5_0xA44A832B994f796452e4FaF191a041F791AD8A0A_json_1.default;
    }
    throw new Error("No routes defined for chainId: " + chainId);
}
exports.getRoutes = getRoutes;
exports.routeConfig = getRoutes(exports.hubPoolChainId);
exports.hubPoolAddress = exports.routeConfig.hubPoolAddress;
exports.migrationPoolV2Warning = process.env.REACT_APP_MIGRATION_POOL_V2_WARNING;
exports.enableMigration = process.env.REACT_APP_ENABLE_MIGRATION;
// Note: this address is used as the from address for simulated relay transactions on Optimism and Arbitrum since
// gas estimates require a live estimate and not a pre-configured gas amount. This address should be pre-loaded with
// a USDC approval for the _current_ spoke pools on Optimism (0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9) and Arbitrum
// (0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C). It also has a small amount of USDC ($0.10) used for estimations.
// If this address lacks either of these, estimations will fail and relays to optimism and arbitrum will hang when
// estimating gas. Defaults to 0x893d0d70ad97717052e3aa8903d9615804167759 so the app can technically run without this.
exports.dummyFromAddress = process.env.REACT_APP_DUMMY_FROM_ADDRESS ||
    "0x893d0d70ad97717052e3aa8903d9615804167759";
const getRoute = (mainnetChainId, fromChainId, symbol) => {
    const routes = getRoutes(mainnetChainId);
    const route = routes.routes.find((route) => route.fromTokenSymbol === symbol);
    if (!route)
        throw new Error(`Couldn't find route for mainnet chain ${mainnetChainId}, fromChain: ${fromChainId}, and symbol ${symbol}`);
    return route;
};
exports.relayerFeeCapitalCostConfig = {
    ETH: {
        lowerBound: ethers_1.ethers.utils.parseUnits("0.0003").toString(),
        upperBound: ethers_1.ethers.utils.parseUnits("0.0006").toString(),
        cutoff: ethers_1.ethers.utils.parseUnits("750").toString(),
        decimals: 18,
    },
    WETH: {
        lowerBound: ethers_1.ethers.utils.parseUnits("0.0003").toString(),
        upperBound: ethers_1.ethers.utils.parseUnits("0.0006").toString(),
        cutoff: ethers_1.ethers.utils.parseUnits("750").toString(),
        decimals: 18,
    },
    WBTC: {
        lowerBound: ethers_1.ethers.utils.parseUnits("0.0003").toString(),
        upperBound: ethers_1.ethers.utils.parseUnits("0.0025").toString(),
        cutoff: ethers_1.ethers.utils.parseUnits("10").toString(),
        decimals: 8,
    },
    DAI: {
        lowerBound: ethers_1.ethers.utils.parseUnits("0.0003").toString(),
        upperBound: ethers_1.ethers.utils.parseUnits("0.002").toString(),
        cutoff: ethers_1.ethers.utils.parseUnits("250000").toString(),
        decimals: 18,
    },
    USDC: {
        lowerBound: ethers_1.ethers.utils.parseUnits("0.0003").toString(),
        upperBound: ethers_1.ethers.utils.parseUnits("0.00075").toString(),
        cutoff: ethers_1.ethers.utils.parseUnits("1500000").toString(),
        decimals: 6,
    },
    UMA: {
        lowerBound: ethers_1.ethers.utils.parseUnits("0.0003").toString(),
        upperBound: ethers_1.ethers.utils.parseUnits("0.00075").toString(),
        cutoff: ethers_1.ethers.utils.parseUnits("5000").toString(),
        decimals: 18,
    },
    BADGER: {
        lowerBound: ethers_1.ethers.utils.parseUnits("0.0003").toString(),
        upperBound: ethers_1.ethers.utils.parseUnits("0.001").toString(),
        cutoff: ethers_1.ethers.utils.parseUnits("5000").toString(),
        decimals: 18,
    },
    BOBA: {
        lowerBound: ethers_1.ethers.utils.parseUnits("0.0003").toString(),
        upperBound: ethers_1.ethers.utils.parseUnits("0.001").toString(),
        cutoff: ethers_1.ethers.utils.parseUnits("100000").toString(),
        decimals: 18,
    },
};
const getQueriesTable = () => {
    const optimismUsdcRoute = getRoute(ChainId.MAINNET, ChainId.OPTIMISM, "USDC");
    const arbitrumUsdcRoute = getRoute(ChainId.MAINNET, ChainId.ARBITRUM, "USDC");
    return {
        [ChainId.MAINNET]: (provider) => new sdk_v2_1.relayFeeCalculator.EthereumQueries(provider),
        [ChainId.ARBITRUM]: (provider) => new sdk_v2_1.relayFeeCalculator.ArbitrumQueries(provider, undefined, arbitrumUsdcRoute.fromSpokeAddress, arbitrumUsdcRoute.fromTokenAddress, exports.dummyFromAddress),
        [ChainId.OPTIMISM]: (provider) => new sdk_v2_1.relayFeeCalculator.OptimismQueries(provider, undefined, optimismUsdcRoute.fromSpokeAddress, optimismUsdcRoute.fromTokenAddress, exports.dummyFromAddress),
        [ChainId.BOBA]: (provider) => new sdk_v2_1.relayFeeCalculator.BobaQueries(provider),
        [ChainId.POLYGON]: (provider) => new sdk_v2_1.relayFeeCalculator.PolygonQueries(provider),
        [ChainId.KOVAN]: (provider) => new sdk_v2_1.relayFeeCalculator.EthereumQueries(provider),
        [ChainId.RINKEBY]: (provider) => new sdk_v2_1.relayFeeCalculator.EthereumQueries(provider),
        [ChainId.GOERLI]: (provider) => new sdk_v2_1.relayFeeCalculator.EthereumQueries(provider),
        [ChainId.MUMBAI]: (provider) => new sdk_v2_1.relayFeeCalculator.PolygonQueries(provider),
        // Use hardcoded DAI address instead of USDC because DAI is enabled here.
        [ChainId.KOVAN_OPTIMISM]: (provider) => new sdk_v2_1.relayFeeCalculator.OptimismQueries(provider, undefined, "0x1954D4A36ac4fD8BEde42E59368565A92290E705", "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"),
        // Use hardcoded WETH address instead of USDC because WETH is enabled here.
        [ChainId.ARBITRUM_RINKEBY]: (provider) => new sdk_v2_1.relayFeeCalculator.ArbitrumQueries(provider, undefined, "0x3BED21dAe767e4Df894B31b14aD32369cE4bad8b", "0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681"),
    };
};
exports.queriesTable = getQueriesTable();
exports.referrerDelimiterHex = "0xd00dfeeddeadbeef";
function calculateAvailableToChains(fromChain, routes, availableChains = exports.chainInfoList) {
    const routeLookup = {};
    routes.forEach((route) => {
        routeLookup[route.toChain] = fromChain !== route.toChain;
    });
    return availableChains.map((chain) => {
        return {
            ...chain,
            disabled: Boolean(!routeLookup[chain.chainId]),
        };
    });
}
exports.calculateAvailableToChains = calculateAvailableToChains;
//# sourceMappingURL=constants.js.map