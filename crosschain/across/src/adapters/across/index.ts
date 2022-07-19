import { calculateBridgeFee } from "./sdk";
import { ChainId, calculateAvailableToChains } from "./constants";
import { getConfig } from "./config";
import { createArrayCsvWriter as createCsvWriter } from "csv-writer";

const CSV_HEADER = [
  "bridge",
  "srcchain",
  "srctoken",
  "dstchain",
  "dsttoken",
  "srctoken_contract",
  "dsttoken_contract",
  "srcholder",
  "dstholder",
  "isopen",
  "fee_fixed",
  "fee_percent",
  "fee_minfee",
  "fee_maxfee",
  "minamount",
  "liquidity",
  "extra",
];

type Mapping = {
  name: string;
  chainId: ChainId;
};

export const availableChains: Array<Mapping> = [
  {
    name: "Ethereum",
    chainId: ChainId.MAINNET,
  },
  {
    name: "Arbitrum",
    chainId: ChainId.ARBITRUM,
  },
  {
    name: "Optimism",
    chainId: ChainId.OPTIMISM,
  },
  {
    name: "Boba",
    chainId: ChainId.BOBA,
  },
  {
    name: "Polygon",
    chainId: ChainId.POLYGON,
  },
];

async function getSupportedChains() {
  return availableChains;
}

export function getAvailableToChains(fromChainName: string) {
  const config = getConfig();
  const fromChain = availableChains.find((_) => _.name === fromChainName)
    ?.chainId as number;
  const availableRoutes = config.filterRoutes({ fromChain });
  const availableToChains = calculateAvailableToChains(
    fromChain,
    availableRoutes,
    config.listToChains()
  );
  return availableToChains;
}

export function getAvailableTokens(fromChainName: string, toChainName: string) {
  const config = getConfig();
  const fromChain = availableChains.find((_) => _.name === fromChainName)
    ?.chainId as number;
  const toChain = availableChains.find((_) => _.name === toChainName)
    ?.chainId as number;
  const availableTokens = config.filterReachableTokens(fromChain, toChain);
  return availableTokens;
}

export async function estimateFee(
  fromChain: string,
  toChainName: string,
  token: string,
  amount: number
) {
  const toChain = availableChains.find((_) => _.name === toChainName)
    ?.chainId as number;
  const fees = await calculateBridgeFee(amount, token, toChain);
  return fees;
}

export async function estimateFeeAsCsv(
  fromChainName: string,
  toChainName: string,
  token: string,
  amount: number
) {
  const fees = await estimateFee(fromChainName, toChainName, token, amount);
  const tokenDetail = fees.token;
  return [
    "acrossto",
    fromChainName,
    token,
    toChainName,
    token,
    tokenDetail.mainnetAddress,
    tokenDetail.mainnetAddress,
    "",
    "",
    true,
    0,
    parseFloat(fees.totalFee) * 100,
    0,
    0,
    0,
    0,
    "",
  ];
}

export async function generateCSV() {
  const supportedChains = await getSupportedChains();
  const allPathFeeRows: any[] = [];
  for (let index = 0; index < supportedChains.length; index++) {
    const fromChain = supportedChains[index];
    const availableToChains = await getAvailableToChains(fromChain.name);
    for (let index = 0; index < availableToChains.length; index++) {
      const toChain = availableToChains[index];
      const availableTokens = await getAvailableTokens(
        fromChain.name,
        toChain.name
      );
      for (let index = 0; index < availableTokens.length; index++) {
        const availableToken = availableTokens[index];
        try {
          console.log(
            "estimateFeeAsCsv",
            fromChain.name,
            toChain.name,
            availableToken.symbol
          );
          const feesInCsv = await estimateFeeAsCsv(
            fromChain.name,
            toChain.name,
            availableToken.symbol,
            1000
          );
          allPathFeeRows.push(feesInCsv);
        } catch (e) {
          console.log("estimateFeeAsCsv.error", e);
        }
      }
    }
  }

  console.log("allPathFeeRows", allPathFeeRows.length);
  const csvWriter = createCsvWriter({
    path: "../acrossto.txt",
    header: CSV_HEADER,
  });
  await csvWriter.writeRecords(allPathFeeRows);
}

async function test() {
  // const inputAmount = 1000;
  // const inputSymbol = "USDC";
  // const toChainId = ChainId.ARBITRUM;
  // const result = await calculateBridgeFee(inputAmount, inputSymbol, toChainId);
  // console.log("result", result);
  const supportedChains = await getSupportedChains();
  console.log("supportedChains", supportedChains);
  const tokens = await getAvailableTokens("Ethereum", "Arbitrum");
  console.log("tokens", tokens);
  const availableToChains = await getAvailableToChains("Ethereum");
  console.log("availableToChains", availableToChains);
  const fees = await estimateFee("Ethereum", "Arbitrum", "USDC", 1000);
  console.log("fees", fees);

  const feesInCsv = await estimateFee("Ethereum", "Arbitrum", "USDC", 1000);
  console.log("feesInCsv", feesInCsv);
  await generateCSV();
}

// test();
