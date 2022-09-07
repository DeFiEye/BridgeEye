import fetch from "isomorphic-fetch";
import { BigNumber, ethers } from "ethers";
import allChain from "./config/chain.json";
import chainInfos from "./config/chainInfo.json";
import { DataCache, chainIdToName, nameToChainId } from "../../utils";
import { createArrayCsvWriter as createCsvWriter } from "csv-writer";

const BRIDGE_ID = "anyswapv3";
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

// STABLEV3;
async function fetchChainPool(chainId: number) {
  // https://bridgeapi.anyswap.exchange/v4/tokenlistv4/1
  const tokenListReq = await fetch(
    `https://bridgeapi.anyswap.exchange/v4/tokenlistv4/${chainId}`
  );
  // const url = `https://bridgeapi.anyswap.exchange/v4/poollist/${chainId}`;
  // const req = await fetch(url);
  // const data2 = await req.json();
  const data = await tokenListReq.json();
  // console.log("keys", data);
  const allTypes: any[] = [];
  const allTokens = Object.keys(data).map((_: any) => {
    Object.keys(data[_].destChains).forEach((c) => {
      const router = Object.keys(data[_].destChains[c])[0];
      allTypes.push(data[_].destChains[c][router].type);
    });
    return data[_];
  });
  // console.log(new  Set(allTypes));
  return allTokens;
}

export async function getSupportedChains() {
  const networks: any[] = allChain.ALL.map((chainId: string) => {
    return (chainInfos as any)[chainId];
  });
  // console.log("networks", networks);
  return networks.filter((_: any) => _.type === "main");
}

function translateNameToChain(
  fromChainName: string,
  toChainName: string,
  allChains: any[]
) {
  const formChainIdTranslated = nameToChainId(fromChainName);
  const toChainIdTranslated = nameToChainId(toChainName);

  const fromChain = allChains.find(
    (_: any) =>
      _.name === fromChainName ||
      (formChainIdTranslated && _.chainID == formChainIdTranslated)
  );

  const toChain = allChains.find(
    (_: any) =>
      _.name === toChainName ||
      (toChainIdTranslated && _.chainID == toChainIdTranslated)
  );

  return {
    fromChain,
    toChain,
  };
}

export async function getAvailableToChains(fromChainName: string) {
  const allChains = await getSupportedChains();
  return allChains.filter((network: any) => network.name !== fromChainName);
}

const dataFetchers: any = {};

export async function getAvailableTokens(
  fromChainName: string,
  toChainName: string
) {
  const allChains = await getSupportedChains();

  const { toChain, fromChain } = translateNameToChain(
    fromChainName,
    toChainName,
    allChains
  );

  if (!dataFetchers[fromChain.chainID]) {
    dataFetchers[fromChain.chainID] = new DataCache(() => {
      return fetchChainPool(fromChain.chainID);
    }, 5);
  }
  try {
    const allTokens = await dataFetchers[fromChain.chainID].getData();
    // const allTokens = await fetchChainPool(fromChain.chainID);
    // console.log("allTokens", {
    //   fromChain,
    //   toChain,
    // });

    const canCrossTokens = allTokens.filter((token: any) => {
      return token.destChains[toChain.chainID] ? true : false;
    });

    const groupByNames = canCrossTokens.reduce((all: any, item: any) => {
        all[item.symbol] =  all[item.symbol] || [];
        all[item.symbol].push(item);
        return all;
    }, {})

    const duplicateRemovedTokens = Object.keys(groupByNames).map(_ => groupByNames[_]).map(tokens => {
      // remove duplicate by destChains count
      if (tokens.length > 1) {
        const sortedTokens = tokens.sort((a: any, b: any) => {
            return Object.keys(b.destChains).length - Object.keys(a.destChains).length;
        });
        return sortedTokens[0]
      }
      return tokens[0]
    })

    return duplicateRemovedTokens
  } catch (e) {}
  return [];
}

export async function estimateFee(
  fromChainName: string,
  toChainName: string,
  token: string,
  amount: number
) {
  const allChains = await getSupportedChains();

  // normalized chain name to chainId
  // const formChainIdTranslated = nameToChainId(fromChainName);
  // const toChainIdTranslated = nameToChainId(toChainName);

  // const fromChain = allChains.find(
  //   (_: any) =>
  //     _.name === fromChainName ||
  //     (formChainIdTranslated && _.chainID == formChainIdTranslated)
  // );

  // const toChain = allChains.find(
  //   (_: any) =>
  //     _.name === toChainName ||
  //     (toChainIdTranslated && _.chainID == toChainIdTranslated)
  // );
  const { toChain, fromChain } = translateNameToChain(
    fromChainName,
    toChainName,
    allChains
  );

  const tokens = await getAvailableTokens(fromChainName, toChainName);
  const selectedToken = tokens.find((_: any) => _.symbol === token);

  const destChain = selectedToken.destChains[toChain.chainID];

  const id = Object.keys(destChain)[0];
  const tokenItem = destChain[id];
  const destToken = tokenItem;

  // if (!destToken.underlying) {
  //   throw new Error("underlying not found");
  // }
  // console.log("destToken", tokenItem);
  const value = amount === -1 ? tokenItem.MinimumSwap : amount;
  const val = Number(value);
  const fee = (Number(tokenItem.SwapFeeRatePerMillion) * value) / 100;
  const maxFee = Number(tokenItem.MaximumSwapFee);
  const minFee = Number(tokenItem.MinimumSwapFee);

  const maxNum = Number(tokenItem.MaximumSwap);
  const minNum = Number(tokenItem.MinimumSwap);

  // console.log("maxNum", maxNum);
  let currentFee = null;
  let output = null;
  if (maxNum < val || minNum > val) {
    throw new Error(
      `reach limit amount=${val} MaximumSwap=${tokenItem.MaximumSwap} MinimumSwap=${tokenItem.MinimumSwap}`
    );
  } else {
    if (fee > maxFee) {
      currentFee = maxFee;
      output = val - maxFee;
    } else if (fee < minFee) {
      currentFee = minFee;
      output = val - minFee;
    } else {
      currentFee = fee;
      output = val - fee;
    }
  }

  return {
    fromChainId: fromChain.chainID,
    toChainId: toChain.chainID,
    token: {
      symbol: selectedToken.symbol,
      decimals: selectedToken.decimals,
      mainnetAddress: selectedToken.address,
    },
    outputToken: {
      symbol: destToken.symbol,
      decimals: destToken.decimals,
      mainnetAddress: destToken.address,
    },
    fee: currentFee,
    // percent
    breakdown: [
      {
        name: "Fee",
        total: currentFee,
        percent: tokenItem.SwapFeeRatePerMillion,
        display: `${currentFee} ${selectedToken.symbol}`,
      },
    ],
    totalFee: tokenItem.SwapFeeRatePerMillion,
    input: value,
    output: output,
    minFee,
    maxFee,
    minNum,
    feeDisplay: `${currentFee} ${selectedToken.symbol}`,
  };
  // const fees = await calculateBridgeFee(
  //   amount,
  //   token,
  //   fromChainName,
  //   toChainName
  // );
  // return fees;
}

export async function estimateFeeAsCsv(
  fromChainName: string,
  toChainName: string,
  token: string,
  amount: number
) {
  const fees = await estimateFee(fromChainName, toChainName, token, amount);
  const fromName = chainIdToName(fees.fromChainId, fromChainName);
  const toName = chainIdToName(fees.toChainId, fromChainName);
  const tokenDetail = fees.token;
  return [
    BRIDGE_ID,
    fromName,
    token,
    toName,
    fees.outputToken ? fees.outputToken.symbol : token,
    tokenDetail.mainnetAddress,
    fees.outputToken
      ? fees.outputToken.mainnetAddress
      : tokenDetail.mainnetAddress,
    "",
    "",
    true,
    0,
    parseFloat(fees.totalFee),
    fees.minFee,
    fees.maxFee,
    fees.minNum,
    0,
    "",
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
      // const allFeeRows = await availableTokens.map((availableToken) => {
      //   return estimateFeeAsCsv(
      //     fromChain.name,
      //     toChain.name,
      //     availableToken.symbol,
      //     1000
      //   );
      // });
      // console.log(
      //   "estimateFeeAsCsv Done",
      //   fromChain.name,
      //   toChain.name,
      //   availableTokens.length,
      //   availableTokens.map((_) => _.symbol)
      // );

      // allFeeRows.forEach((_) => {
      //   allPathFeeRows.push(_);
      // });
      for (let index = 0; index < availableTokens.length; index++) {
        const availableToken = availableTokens[index];
        // for (let retry = 0; index < 2; retry++) {
        try {
          const startTime = Date.now();
          // console.log(
          //   "estimateFeeAsCsv",
          //   BRIDGE_ID,
          //   fromChain.name,
          //   toChain.name,
          //   availableToken.symbol
          // );
          const feesInCsv = await estimateFeeAsCsv(
            fromChain.name,
            toChain.name,
            availableToken.symbol,
            -1
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
  }

  console.log(
    "allPathFeeRows",
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
  // const tokens = await getAvailableTokens("Ethereum", "Arbitrum");
  // console.log("tokens", tokens.length, tokens[0]);
  const fees = await estimateFee("CELO", "BSC", "WBTC", 100);
  console.log("fees", fees);
  // const feesInCsv = await estimateFeeAsCsv(
  //   "Ethereum",
  //   "BNB CHAIN",
  //   "USDC",
  //   100
  // );
  // console.log("feesInCsv", feesInCsv);
  // const fees1 = await estimateFee("KardiaChain", "Kava", "WETH", 1);
  // console.log("fees1", fees1);
  // await generateCSV();
  // await fetchChainPool(1)
}

// test();
