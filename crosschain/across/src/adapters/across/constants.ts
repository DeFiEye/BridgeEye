import assert from "assert";
import { ethers } from "ethers";
// import ethereumLogo from "assets/ethereum-logo.svg";
// import optimismLogo from "assets/optimism-alt-logo.svg";
// import wethLogo from "assets/weth-logo.svg";
// import arbitrumLogo from "assets/arbitrum-logo.svg";
// import bobaLogo from "assets/boba-logo.svg";
// import polygonLogo from "assets/polygon-logo.svg";
import { getAddress } from "./address";
import * as superstruct from "superstruct";
import { relayFeeCalculator } from "@across-protocol/sdk-v2";

// all routes should be pre imported to be able to switch based on chain id
import KovanRoutes from "./data/routes_42_0x8d84F51710dfa9D409027B167371bBd79e0539e5.json";
import MainnetRoutes from "./data/routes_1_0xc186fA914353c44b2E33eBE05f21846F1048bEda.json";
import GoerliRoutes from "./data/routes_5_0xA44A832B994f796452e4FaF191a041F791AD8A0A.json";

Object.assign(process.env, {
  NODE_ENV: "production",
  PUBLIC_URL: "",
  WDS_SOCKET_HOST: void 0,
  WDS_SOCKET_PATH: void 0,
  WDS_SOCKET_PORT: void 0,
  FAST_REFRESH: !0,
  REACT_APP_CHAIN_42161_PROVIDER_URL:
    "https://arb-mainnet.g.alchemy.com/v2/rvEe3jmqTCgDjFQW6AzhDwXO6tEaUJzG",
  REACT_APP_MIGRATION_POOL_V2_WARNING: "true",
  REACT_APP_VERCEL_ORG_ID: "team_8iEcNoQqez36TrK1mWGXpIEG",
  REACT_APP_FLAT_RELAY_CAPITAL_FEE: "0.04",
  REACT_APP_MATOMO_URL: "https://across.matomo.cloud/",
  REACT_APP_VERCEL_URL: "frontend-v2-6apvry1sa-uma.vercel.app",
  REACT_APP_VERCEL_GIT_COMMIT_SHA: "f5b892a1e47b820d21687591c1c47bb7389f5bf3",
  REACT_APP_CHAIN_137_PROVIDER_URL:
    "https://polygon-mainnet.g.alchemy.com/v2/JmSqZejNkyn1RZF-6A2jsKqaDfAqFqt8",
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
  REACT_APP_VERCEL_GIT_COMMIT_MESSAGE:
    "fix: fix issue with remove liquidity when decimals are input (#159)\n\nSigned-off-by: David <david@umaproject.org>",
  REACT_APP_VERCEL_ARTIFACTS_TOKEN:
    "artifacts:eyJkZXBsb3ltZW50SWQiOiJkcGxfRnVDcjRuekFNeWIzd3kyV3Q4U3lxZDh6WGk4QyIsIm93bmVySWQiOiJ0ZWFtXzhpRWNOb1FxZXozNlRySzFtV0dYcElFRyIsInRpY2tldCI6ImdxRjB6UWNJb1dPUzJTQmtjR3hmUm5WRGNqUnVla0ZOZVdJemQza3lWM1E0VTNseFpEaDZXR2s0UTYxQlVFbGZRVkpVU1VaQlExUlRFYUlYRlFNbmRHc3oxbEVjR256MGVXRDNMMnc9In0=",
  REACT_APP_PUBLIC_INFURA_ID: "b14cb6f39de44042802cf5c83d69c6f1",
  REACT_APP_VERCEL_ARTIFACTS_OWNER: "team_8iEcNoQqez36TrK1mWGXpIEG",
  REACT_APP_VERCEL_GIT_REPO_ID: "465308257",
  REACT_APP_DUMMY_FROM_ADDRESS: "0x893d0d70ad97717052e3aa8903d9615804167759",
  REACT_APP_VERCEL_GIT_COMMIT_REF: "master",
  REACT_APP_VERCEL_API_DC_ENDPOINT: "https://api-{{dc}}.vercel.com",
});

/* Chains and Tokens section */
export enum ChainId {
  MAINNET = 1,
  OPTIMISM = 10,
  ARBITRUM = 42161,
  BOBA = 288,
  POLYGON = 137,
  // testnets
  RINKEBY = 4,
  KOVAN = 42,
  KOVAN_OPTIMISM = 69,
  ARBITRUM_RINKEBY = 421611,
  GOERLI = 5,
  // Polygon testnet
  MUMBAI = 80001,
}
/* Colors and Media Queries section */
export const BREAKPOINTS = {
  tabletMin: 550,
  laptopMin: 1100,
  desktopMin: 1500,
};
export const QUERIES = {
  tabletAndUp: `(min-width: ${BREAKPOINTS.tabletMin / 16}rem)`,
  laptopAndUp: `(min-width: ${BREAKPOINTS.laptopMin / 16}rem)`,
  desktopAndUp: `(min-width: ${BREAKPOINTS.desktopMin / 16}rem)`,
  tabletAndDown: `(max-width: ${(BREAKPOINTS.laptopMin - 1) / 16}rem)`,
  mobileAndDown: `(max-width: ${(BREAKPOINTS.tabletMin - 1) / 16}rem)`,
};

export const COLORS = {
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
export const configStoreAddresses: Record<ChainId, string> = {
  [ChainId.MAINNET]: getAddress("0x3B03509645713718B78951126E0A6de6f10043f5"),
  [ChainId.ARBITRUM]: ethers.constants.AddressZero,
  [ChainId.OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.BOBA]: ethers.constants.AddressZero,
  [ChainId.POLYGON]: ethers.constants.AddressZero,
  [ChainId.RINKEBY]: ethers.constants.AddressZero,
  [ChainId.KOVAN]: getAddress("0xDd74f7603e3fDA6435aEc91F8960a6b8b40415f3"),
  [ChainId.KOVAN_OPTIMISM]: ethers.constants.AddressZero,
  [ChainId.ARBITRUM_RINKEBY]: ethers.constants.AddressZero,
  [ChainId.GOERLI]: getAddress("0x3215e3C91f87081757d0c41EF0CB77738123Be83"),
  [ChainId.MUMBAI]: ethers.constants.AddressZero,
};

export type ChainInfo = {
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

export type ChainInfoList = ChainInfo[];
export type ChainInfoTable = Record<number, ChainInfo>;
export const defaultBlockPollingInterval =
  Number(process.env.REACT_APP_DEFAULT_BLOCK_POLLING_INTERVAL_S || 30) * 1000;

const defaultConstructExplorerLink =
  (explorerUrl: string) => (txHash: string) =>
    `${explorerUrl}/tx/${txHash}`;

export const chainInfoList: ChainInfoList = [
  {
    name: "Ethereum",
    fullName: "Ethereum Mainnet",
    chainId: ChainId.MAINNET,
    logoURI: "",
    explorerUrl: "https://etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink("https://etherscan.io"),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 14704425,
  },
  {
    name: "Arbitrum",
    fullName: "Arbitrum One",
    chainId: ChainId.ARBITRUM,
    logoURI: "",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    explorerUrl: "https://arbiscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://arbiscan.io/tx/${txHash}`,
    nativeCurrencySymbol: "AETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 11102271,
  },
  {
    name: "Boba",
    chainId: ChainId.BOBA,
    logoURI: "",
    rpcUrl: "https://mainnet.boba.network",
    explorerUrl: "https://blockexplorer.boba.network",
    constructExplorerLink: (txHash: string) =>
      `https://blockexplorer.boba.network/tx/${txHash}`,
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 551955,
  },
  {
    name: "Optimism",
    chainId: ChainId.OPTIMISM,
    logoURI: "",
    rpcUrl: "https://mainnet.optimism.io",
    explorerUrl: "https://optimistic.etherscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://optimistic.etherscan.io/tx/${txHash}`,
    nativeCurrencySymbol: "OETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 6979967,
  },
  {
    name: "Polygon",
    fullName: "Polygon Network",
    chainId: ChainId.POLYGON,
    logoURI: "",
    rpcUrl: "https://rpc.ankr.com/polygon",
    explorerUrl: "https://polygonscan.com",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://polygonscan.com"
    ),
    nativeCurrencySymbol: "MATIC",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 27875891,
  },
  {
    name: "Goerli",
    fullName: "Goerli Testnet",
    chainId: ChainId.GOERLI,
    logoURI: "",
    explorerUrl: "https://goerli.etherscan.io/",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://goerli.etherscan.io/"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 6586188,
  },
  {
    name: "Kovan",
    fullName: "Ethereum Testnet Kovan",
    chainId: ChainId.KOVAN,
    logoURI: "",
    explorerUrl: "https://kovan.etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://kovan.etherscan.io"
    ),
    nativeCurrencySymbol: "KOV",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 31457386,
  },
  {
    name: "Optimism Kovan",
    fullName: "Optimism Testnet Kovan",
    chainId: ChainId.KOVAN_OPTIMISM,
    logoURI: "",
    rpcUrl: "https://kovan.optimism.io",
    explorerUrl: "https://kovan-optimistic.etherscan.io",
    constructExplorerLink: (txHash: string) =>
      `https://kovan-optimistic.etherscan.io/tx/${txHash}`,
    nativeCurrencySymbol: "KOR",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 2537971,
  },
  {
    name: "Mumbai",
    chainId: ChainId.MUMBAI,
    logoURI: "",
    rpcUrl: "https://matic-mumbai.chainstacklabs.com",
    explorerUrl: "https://mumbai.polygonscan.com",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://mumbai.polygonscan.com"
    ),
    nativeCurrencySymbol: "WMATIC",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 25751326,
  },
  {
    name: "Arbitrum Rinkeby",
    fullName: "Arbitrum Testnet Rinkeby",
    chainId: ChainId.ARBITRUM_RINKEBY,
    logoURI: "",
    explorerUrl: "https://rinkeby-explorer.arbitrum.io",
    constructExplorerLink: (txHash: string) =>
      `https://rinkeby-explorer.arbitrum.io/tx/${txHash}`,
    rpcUrl: "https://rinkeby.arbitrum.io/rpc",
    nativeCurrencySymbol: "ARETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 10523275,
  },
  {
    name: "Rinkeby",
    fullName: "Rinkeby Testnet",
    chainId: ChainId.RINKEBY,
    logoURI: "",
    explorerUrl: "https://rinkeby.etherscan.io",
    constructExplorerLink: defaultConstructExplorerLink(
      "https://rinkeby.etherscan.io"
    ),
    nativeCurrencySymbol: "ETH",
    pollingInterval: defaultBlockPollingInterval,
    earliestBlock: 10485193,
  },
];

export const chainInfoTable: ChainInfoTable = Object.fromEntries(
  chainInfoList.map((chain) => {
    return [chain.chainId, chain];
  }, [])
);

export type TokenInfo = {
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  // tokens require a mainnet address to do price lookups on coingecko, not used for anything else.
  mainnetAddress?: string;
};
// enforce weth to be first so we can use it as a guarantee in other parts of the app
export type TokenInfoList = TokenInfo[];

export const tokenList: TokenInfoList = [
  {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
    logoURI: "",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "OETH",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "AETH",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Matic",
    symbol: "WMATIC",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"),
  },
  {
    name: "Kovan Ethereum",
    symbol: "KOV",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "KOR",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Ether",
    symbol: "ARETH",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "Wrapped Ether",
    symbol: "WETH",
    decimals: 18,
    logoURI: "",
    mainnetAddress: getAddress("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"),
  },
  {
    name: "USD Coin",
    symbol: "USDC",
    decimals: 6,
    logoURI: "/logos/usdc-logo.png",
    mainnetAddress: getAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"),
  },
  {
    name: "Dai Stablecoin",
    symbol: "DAI",
    decimals: 18,
    logoURI: "/logos/dai-logo.png",
    mainnetAddress: getAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
  },
  {
    name: "Wrapped Bitcoin",
    symbol: "WBTC",
    decimals: 8,
    logoURI: "/logos/wbtc-logo.svg",
    mainnetAddress: getAddress("0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"),
  },
  {
    name: "Boba",
    symbol: "BOBA",
    decimals: 18,
    logoURI: "/logos/boba-logo.svg",
    mainnetAddress: getAddress("0x42bbfa2e77757c645eeaad1655e0911a7553efbc"),
  },
  {
    name: "Badger",
    symbol: "BADGER",
    decimals: 18,
    logoURI: "/logos/badger-logo.svg",
    mainnetAddress: getAddress("0x3472A5A71965499acd81997a54BBA8D852C6E53d"),
  },
  {
    name: "UMA",
    symbol: "UMA",
    decimals: 18,
    logoURI: "/logos/uma-logo.svg",
    mainnetAddress: getAddress("0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828"),
  },
  {
    name: "Matic",
    symbol: "MATIC",
    decimals: 18,
    logoURI: "/logos/ethereum-logo.svg",
    mainnetAddress: getAddress("0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0"),
  },
];

assert(
  process.env.REACT_APP_HUBPOOL_CHAINID,
  "Missing process.env.REACT_APP_HUBPOOL_CHAINID"
);
assert(
  process.env.REACT_APP_PUBLIC_INFURA_ID,
  "Missing process.env.REACT_APP_PUBLIC_INFURA_ID"
);
assert(
  process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY,
  "Missing process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY"
);

export const hubPoolChainId = Number(process.env.REACT_APP_HUBPOOL_CHAINID);
export const disableDeposits = process.env.REACT_APP_DISABLE_DEPOSITS;
export const enableReactQueryDevTools =
  process.env.REACT_APP_ENABLE_REACT_QUERY_DEV_TOOLS;
export const infuraId = process.env.REACT_APP_PUBLIC_INFURA_ID;
export const confirmations =
  Number(process.env.REACT_APP_PUBLIC_CONFIRMATIONS) || 1;
export const onboardApiKey = process.env.REACT_APP_PUBLIC_ONBOARD_API_KEY;
export const matomoUrl = process.env.REACT_APP_MATOMO_URL;
export const debug = Boolean(process.env.REACT_APP_DEBUG);

export const MAX_APPROVAL_AMOUNT = ethers.constants.MaxUint256;
export const FEE_ESTIMATION = ".004";
export const MAX_RELAY_FEE_PERCENT = Number(
  process.env.REACT_APP_MAX_RELAY_FEE_PERCENT || 50
);
export const FLAT_RELAY_CAPITAL_FEE = process.env
  .REACT_APP_FLAT_RELAY_CAPITAL_FEE
  ? Number(process.env.REACT_APP_FLAT_RELAY_CAPITAL_FEE)
  : 0;
export const AddressZero = ethers.constants.AddressZero;
export const ArbitrumProviderUrl =
  process.env.REACT_APP_CHAIN_42161_PROVIDER_URL ||
  `https://arbitrum-mainnet.infura.io/v3/${infuraId}`;

export const PolygonProviderUrl =
  process.env.REACT_APP_CHAIN_137_PROVIDER_URL ||
  `https://polygon-mainnet.infura.io/v3/${infuraId}`;

assert(
  isSupportedChainId(hubPoolChainId),
  "Hubpool chain is not supported: " + hubPoolChainId
);
export function isSupportedChainId(chainId: number): chainId is ChainId {
  return chainId in ChainId;
}
export const providerUrls: [ChainId, string][] = [
  [ChainId.MAINNET, `https://mainnet.infura.io/v3/${infuraId}`],
  [ChainId.ARBITRUM, ArbitrumProviderUrl],
  [ChainId.POLYGON, PolygonProviderUrl],
  [ChainId.OPTIMISM, `https://optimism-mainnet.infura.io/v3/${infuraId}`],
  [ChainId.BOBA, `https://mainnet.boba.network`],
  [ChainId.RINKEBY, `https://rinkeby.infura.io/v3/${infuraId}`],
  [ChainId.KOVAN, `https://kovan.infura.io/v3/${infuraId}`],
  [ChainId.KOVAN_OPTIMISM, `https://optimism-kovan.infura.io/v3/${infuraId}`],
  [
    ChainId.ARBITRUM_RINKEBY,
    `https://arbitrum-rinkeby.infura.io/v3/${infuraId}`,
  ],
  [ChainId.GOERLI, `https://goerli.infura.io/v3/${infuraId}`],
  [ChainId.MUMBAI, `https://polygon-mumbai.infura.io/v3/${infuraId}`],
];
export const providerUrlsTable: Record<number, string> =
  Object.fromEntries(providerUrls);

export const providers: [number, ethers.providers.StaticJsonRpcProvider][] =
  providerUrls.map(([chainId, url]) => {
    return [chainId, new ethers.providers.StaticJsonRpcProvider(url)];
  });
export const providersTable: Record<
  number,
  ethers.providers.StaticJsonRpcProvider
> = Object.fromEntries(providers);

export function getProvider(
  chainId: ChainId = hubPoolChainId
): ethers.providers.StaticJsonRpcProvider {
  return providersTable[chainId];
}

export function getConfigStoreAddress(
  chainId: ChainId = hubPoolChainId
): string {
  const configStoreAddress = configStoreAddresses[chainId];
  assert(
    configStoreAddress !== AddressZero,
    "Config Store address not set for chain: " + chainId
  );
  return configStoreAddress;
}

export function getChainInfo(chainId: number): ChainInfo {
  assert(isSupportedChainId(chainId), "Unsupported chain id " + chainId);
  return chainInfoTable[chainId];
}

export const tokenTable = Object.fromEntries(
  tokenList.map((token) => {
    return [token.symbol, token];
  })
);

export const getToken = (symbol: string): TokenInfo => {
  const token = tokenTable[symbol];
  assert(token, "No token found for symbol: " + symbol);
  return token;
};

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
export type RouteConfig = superstruct.Infer<typeof RouteConfigSS>;
export type Route = superstruct.Infer<typeof RouteSS>;
export type Routes = superstruct.Infer<typeof RoutesSS>;
export function getRoutes(chainId: ChainId): RouteConfig {
  if (chainId === ChainId.KOVAN) {
    superstruct.assert(KovanRoutes, RouteConfigSS);
    return KovanRoutes;
  }
  if (chainId === ChainId.MAINNET) {
    superstruct.assert(MainnetRoutes, RouteConfigSS);
    return MainnetRoutes;
  }
  if (chainId === ChainId.GOERLI) {
    superstruct.assert(GoerliRoutes, RouteConfigSS);
    return GoerliRoutes;
  }
  throw new Error("No routes defined for chainId: " + chainId);
}

export const routeConfig = getRoutes(hubPoolChainId);
export const hubPoolAddress = routeConfig.hubPoolAddress;
export const migrationPoolV2Warning =
  process.env.REACT_APP_MIGRATION_POOL_V2_WARNING;
export const enableMigration = process.env.REACT_APP_ENABLE_MIGRATION;

// Note: this address is used as the from address for simulated relay transactions on Optimism and Arbitrum since
// gas estimates require a live estimate and not a pre-configured gas amount. This address should be pre-loaded with
// a USDC approval for the _current_ spoke pools on Optimism (0xa420b2d1c0841415A695b81E5B867BCD07Dff8C9) and Arbitrum
// (0xB88690461dDbaB6f04Dfad7df66B7725942FEb9C). It also has a small amount of USDC ($0.10) used for estimations.
// If this address lacks either of these, estimations will fail and relays to optimism and arbitrum will hang when
// estimating gas. Defaults to 0x893d0d70ad97717052e3aa8903d9615804167759 so the app can technically run without this.
export const dummyFromAddress =
  process.env.REACT_APP_DUMMY_FROM_ADDRESS ||
  "0x893d0d70ad97717052e3aa8903d9615804167759";

const getRoute = (
  mainnetChainId: ChainId,
  fromChainId: number,
  symbol: string
) => {
  const routes = getRoutes(mainnetChainId);
  const route = routes.routes.find((route) => route.fromTokenSymbol === symbol);
  if (!route)
    throw new Error(
      `Couldn't find route for mainnet chain ${mainnetChainId}, fromChain: ${fromChainId}, and symbol ${symbol}`
    );
  return route;
};

export const relayerFeeCapitalCostConfig: {
  [token: string]: relayFeeCalculator.CapitalCostConfig;
} = {
  ETH: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.0006").toString(),
    cutoff: ethers.utils.parseUnits("750").toString(),
    decimals: 18,
  },
  WETH: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.0006").toString(),
    cutoff: ethers.utils.parseUnits("750").toString(),
    decimals: 18,
  },
  WBTC: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.0025").toString(),
    cutoff: ethers.utils.parseUnits("10").toString(),
    decimals: 8,
  },
  DAI: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.002").toString(),
    cutoff: ethers.utils.parseUnits("250000").toString(),
    decimals: 18,
  },
  USDC: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.00075").toString(),
    cutoff: ethers.utils.parseUnits("1500000").toString(),
    decimals: 6,
  },
  UMA: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.00075").toString(),
    cutoff: ethers.utils.parseUnits("5000").toString(),
    decimals: 18,
  },
  BADGER: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("5000").toString(),
    decimals: 18,
  },
  BOBA: {
    lowerBound: ethers.utils.parseUnits("0.0003").toString(),
    upperBound: ethers.utils.parseUnits("0.001").toString(),
    cutoff: ethers.utils.parseUnits("100000").toString(),
    decimals: 18,
  },
};

const getQueriesTable = () => {
  const optimismUsdcRoute = getRoute(ChainId.MAINNET, ChainId.OPTIMISM, "USDC");
  const arbitrumUsdcRoute = getRoute(ChainId.MAINNET, ChainId.ARBITRUM, "USDC");

  return {
    [ChainId.MAINNET]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.ARBITRUM]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.ArbitrumQueries(
        provider,
        undefined,
        arbitrumUsdcRoute.fromSpokeAddress,
        arbitrumUsdcRoute.fromTokenAddress,
        dummyFromAddress
      ),
    [ChainId.OPTIMISM]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.OptimismQueries(
        provider,
        undefined,
        optimismUsdcRoute.fromSpokeAddress,
        optimismUsdcRoute.fromTokenAddress,
        dummyFromAddress
      ),
    [ChainId.BOBA]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.BobaQueries(provider),
    [ChainId.POLYGON]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.PolygonQueries(provider),
    [ChainId.KOVAN]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.RINKEBY]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.GOERLI]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.EthereumQueries(provider),
    [ChainId.MUMBAI]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.PolygonQueries(provider),
    // Use hardcoded DAI address instead of USDC because DAI is enabled here.
    [ChainId.KOVAN_OPTIMISM]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.OptimismQueries(
        provider,
        undefined,
        "0x1954D4A36ac4fD8BEde42E59368565A92290E705",
        "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
      ),
    // Use hardcoded WETH address instead of USDC because WETH is enabled here.
    [ChainId.ARBITRUM_RINKEBY]: (provider: ethers.providers.Provider) =>
      new relayFeeCalculator.ArbitrumQueries(
        provider,
        undefined,
        "0x3BED21dAe767e4Df894B31b14aD32369cE4bad8b",
        "0xB47e6A5f8b33b3F17603C83a0535A9dcD7E32681"
      ),
  };
};

export const queriesTable = getQueriesTable();

export const referrerDelimiterHex = "0xd00dfeeddeadbeef";


export function calculateAvailableToChains(
  fromChain: ChainId,
  routes: Routes,
  availableChains: ChainInfoList = chainInfoList
) {
  const routeLookup: Record<number, boolean> = {};
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