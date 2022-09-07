import fetch from "isomorphic-fetch";
import { BigNumber, ethers } from "ethers";
import { DataCache, chainIdToName, nameToChainId } from "../../utils";
import { createArrayCsvWriter as createCsvWriter } from "csv-writer";
import { abi as BridgeABI } from "./abis/Bridge.json";
import { abi as ERC20ABI } from "./abis/ERC20PresetMinterPauser.json";

export const RPC_HEADERS = {
  origin: "https://app.relaychain.com",
};
const BRIDGE_ID = "relay";
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

async function fetchConfig(chainId: number) {
  const url = `https://relay-api-33e56.ondigitalocean.app/api/crosschain-config`;
  const req = await fetch(url);
  const networks = await req.json();
  return networks;
}

const fetchConfigWithCache = new DataCache(fetchConfig, 10);

export async function getSupportedChains() {
  const networks = await fetchConfigWithCache.getData();
  return networks;
}

export async function getAvailableToChains(fromChainName: string) {
  const allChains = await getSupportedChains();
  return allChains.filter((network: any) => network.name !== fromChainName);
}

export async function getTokenPriceByResourceId(resourceId: string) {
  const url = `https://relay-api-33e56.ondigitalocean.app/api/tokenInfo?resourceId=${resourceId}`;
  const req = await fetch(url);
  const res = await req.json();
  if (res.error)
    throw new Error(`Error getTokenPriceByResourceId: ${res.error}`);
  return res.result.current_price;
}

const dataFetchers: any = {};

function translateNameToChain(
  fromChainName: string,
  toChainName: string,
  allChains: any[],
  field: string = "chainID"
) {
  const formChainIdTranslated = nameToChainId(fromChainName);
  const toChainIdTranslated = nameToChainId(toChainName);

  const fromChain = allChains.find(
    (_: any) =>
      _.name === fromChainName ||
      (formChainIdTranslated && _[field] == formChainIdTranslated)
  );

  const toChain = allChains.find(
    (_: any) =>
      _.name === toChainName ||
      (toChainIdTranslated && _[field] == toChainIdTranslated)
  );

  return {
    fromChain,
    toChain,
  };
}

export async function getAvailableTokens(
  fromChainName: string,
  toChainName: string
) {
  const allChains = await getSupportedChains();
  const fromChain = allChains.find((_: any) => _.name === fromChainName);
  const toChain = allChains.find((_: any) => _.name === toChainName);
  return fromChain.tokens.filter((token: any) => {
    const isAllowed = token.allowedChainsToTransfer.includes(toChain.chainId);
    if (
      (fromChain.chainId === 2 &&
        toChain.chainId === 6 &&
        token.address === "0xc7198437980c041c805A1EDcbA50c1Ce5db95118") ||
      (fromChain.chainId === 2 &&
        toChain.chainId === 6 &&
        token.address === "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70") ||
      (fromChain.chainId === 2 &&
        toChain.chainId === 10 &&
        token.address === "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7") ||
      (fromChain.chainId === 13 &&
        toChain.chainId === 3 &&
        token.address === "0x338A6997011c4eee53822837c4F95bBbA3a0a7f5")
    ) {
      return false;
    } else {
      return isAllowed;
    }
  });
}

export async function estimateFee(
  fromChainName: string,
  toChainName: string,
  token: string,
  value: number
) {
  const allChains = await getSupportedChains();

  // normalized chain name to chainId
  // const formChainIdTranslated = nameToChainId(fromChainName);
  // const toChainIdTranslated = nameToChainId(toChainName);
  // const fromChain = allChains.find(
  //   (_: any) =>
  //     _.name === fromChainName ||
  //     (formChainIdTranslated && _.networkId == formChainIdTranslated)
  // );

  // const toChain = allChains.find(
  //   (_: any) =>
  //     _.name === toChainName ||
  //     (toChainIdTranslated && _.networkId == toChainIdTranslated)
  // );

  const { fromChain, toChain } = translateNameToChain(
    fromChainName,
    toChainName,
    allChains,
    "networkId"
  );

  const tokens = await getAvailableTokens(fromChainName, toChainName);
  const selectedToken = tokens.find((_: any) => _.symbol === token);
  // console.log("selectedToken", selectedToken);

  let crossChainFee = 0;
  let totalFee = 0;
  try {
    const bridgeContract = new ethers.Contract(
      fromChain.bridgeAddress,
      BridgeABI,
      new ethers.providers.JsonRpcProvider({
        url: fromChain.rpcUrl,
        headers: RPC_HEADERS,
      })
    );
    const feeResult = await bridgeContract._fees(toChain.chainId);
    // const fee = ethers.utils.formatUnits(feeResult.toString(), 18);
    // crossChainFee = parseFloat(parseFloat(fee).toFixed(4));
    crossChainFee = feeResult.toString();
    // console.log("feeResult", {
    //   fromChainName,
    //   toChainName,
    //   token,
    //   fees: fee,
    // });
  } catch (e) {}

  let liquidity = null;
  let targetToken = toChain.tokens.find(
    (_: any) => _.resourceId === selectedToken.resourceId
  );
  try {
    if (targetToken) {
      const provider = new ethers.providers.JsonRpcProvider({
        url: toChain.rpcUrl,
        headers: RPC_HEADERS,
      });
      const tokenContract = new ethers.Contract(
        targetToken.address,
        ERC20ABI,
        provider
      );
      const addrContainingTokens =
        toChain.erc20HandlerAddress == `N/A, it's a eth-transfers chain`
          ? toChain.bridgeAddress
          : toChain.erc20HandlerAddress;

      const amountHandler =
        targetToken.address == ethers.constants.AddressZero
          ? await provider.getBalance(addrContainingTokens).then(String)
          : await tokenContract.balanceOf(addrContainingTokens).then(String);

      liquidity = ethers.utils.formatUnits(amountHandler, targetToken.decimals);
      console.log("liqidity", {
        liquidity,
        addrContainingTokens,
        targetToken: targetToken.address,
      });
    }
    // const bridgeContract = new ethers.Contract(
    //   fromChain.bridgeAddress,
    //   BridgeABI,
    //   new ethers.providers.JsonRpcProvider({
    //     url: toChain.rpcUrl,
    //     headers: RPC_HEADERS,
    //   })
    // );
    // const feeResult = await bridgeContract._fees(toChain.chainId);
    // const fee = ethers.utils.formatUnits(feeResult.toString(), 18);
    // crossChainFee = parseFloat(parseFloat(fee).toFixed(4));
    // crossChainFee = feeResult.toString();
    // console.log("feeResult", {
    //   fromChainName,
    //   toChainName,
    //   token,
    //   fees: fee,
    // });
  } catch (e) {
    console.log("fetch liquidity error", e);
  }

  try {
    const DOLLAR_FEE_TOKEN = 20; // that's hardcoded both here and in relayer
    const tokenPrice = await getTokenPriceByResourceId(
      selectedToken.resourceId
    );
    const feeInToken = DOLLAR_FEE_TOKEN / tokenPrice || 0;
    console.log("feeInToken", feeInToken);
  } catch (e) {
    // console.log("error", e);
  }

  const SwapFeeRatePerMillion = "0.05";

  const val = Number(value);
  const fee = (Number(SwapFeeRatePerMillion) * value) / 100;

  totalFee += fee;
  // + crossChainFee;

  let currentFee = fee;
  let output = val - totalFee;

  return {
    fromChainId: fromChain.networkId.toString(),
    toChainId: toChain.networkId.toString(),
    token: {
      symbol: selectedToken.symbol,
      decimals: selectedToken.decimals,
      mainnetAddress: selectedToken.address,
    },
    outputToken: {
      symbol: targetToken.symbol,
      decimals: targetToken.decimals,
      mainnetAddress: targetToken.address,
    },
    fee: totalFee,
    fixedFee: 0,
    liquidity,
    // percent
    breakdown: [
      {
        name: "Fee",
        total: currentFee,
        percent: SwapFeeRatePerMillion,
        display: `${currentFee} ${selectedToken.symbol}`,
      },
      // {
      //   name: "Transfer Fee",
      //   total: crossChainFee,
      //   // percent: SwapFeeRatePerMillion,
      //   display: `${crossChainFee} ${fromChain.nativeTokenSymbol}`,
      // },
    ],
    extra: {
      nativeGasToken: {
        [fromChain.nativeTokenSymbol]: crossChainFee,
      },
    },
    totalFee: SwapFeeRatePerMillion,
    input: value,
    output: output,
    feeDisplay: `${totalFee} ${selectedToken.symbol}`,
  };
}

export async function estimateFeeAsCsv(
  fromChainName: string,
  toChainName: string,
  token: string,
  amount: number
) {
  const fees = await estimateFee(fromChainName, toChainName, token, amount);
  const tokenDetail = fees.token;
  const fromName = chainIdToName(fees.fromChainId, fromChainName);
  const toName = chainIdToName(fees.toChainId, fromChainName);

  return [
    BRIDGE_ID,
    fromName,
    token,
    toName,
    token,
    tokenDetail.mainnetAddress,
    fees.outputToken ? fees.outputToken.mainnetAddress : "",
    "",
    "",
    true,
    fees.fixedFee,
    parseFloat(fees.totalFee),
    0,
    0,
    0,
    fees.liquidity ? fees.liquidity : 0,
    fees.extra ? JSON.stringify(fees.extra) : "",
  ];
}

export async function generateCSV() {
  const supportedChains = await getSupportedChains();
  const allPathFeeRows: any[] = [];
  const startTime = Date.now();
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
        // for (let retry = 0; index < 2; retry++) {
        try {
          const startTime = Date.now();
          const feesInCsv = await estimateFeeAsCsv(
            fromChain.name,
            toChain.name,
            availableToken.symbol,
            ["ETH", "WBTC", "BTC"].includes(availableToken.symbol) ? 1 : 100
          );
          console.log(
            "estimateFeeAsCsv",
            BRIDGE_ID,
            fromChain.name,
            toChain.name,
            availableToken.symbol,
            "spend",
            Date.now() - startTime
          );
          allPathFeeRows.push(feesInCsv);
          // break;
        } catch (e) {
          // console.log("failed", e);
        }
        // }
      }
    }
    console.log("chain", supportedChains.length, index);
  }

  console.log(
    "allPathFeeRows",
    BRIDGE_ID,
    allPathFeeRows.length,
    "spend",
    Date.now() - startTime
  );
  const csvWriter = createCsvWriter({
    path: `../${BRIDGE_ID}.txt`,
    header: CSV_HEADER,
  });
  await csvWriter.writeRecords(allPathFeeRows);
}

async function test() {
  // const supportedChains = await getSupportedChains();
  // console.log("supportedChains", supportedChains);
  // const tokens = await getAvailableTokens("Ethereum", "Avalanche");
  // console.log("tokens", tokens.length, tokens[0]);
  const fees = await estimateFee("Smart Chain", "Ethereum", "USDC", 100);
  console.log("fees", fees);
  // generateCSV();
  //   const feesInCsv = await estimateFeeAsCsv(
  //     "Ethereum",
  //     "BNB CHAIN",
  //     "USDC",
  //     100
  //   );
  //   console.log("feesInCsv", feesInCsv);
  // const fees1 = await estimateFee("Ethereum", "BNB CHAIN", "WBTC", 1);
  // console.log("fees1", fees1);
}

// test();
