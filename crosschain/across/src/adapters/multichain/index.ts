
import fetch from "isomorphic-fetch";
import { BigNumber, ethers } from "ethers";
import allChain from './config/chain.json';
import chainInfos from "./config/chainInfo.json";
import { DataCache } from "../../utils";
import { createArrayCsvWriter as createCsvWriter } from "csv-writer";

const BRIDGE_ID = "multichain";
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


async function fetchChainPool(chainId: number) {
  const url = `https://bridgeapi.anyswap.exchange/v4/poollist/${chainId}`;
  const req = await fetch(url);
  const data = await req.json();
  const allTokens = Object.keys(data).map((_: any) => {
    return data[_];
  });
  return allTokens;
}


async function getSupportedChains() {
  const networks: any[] = allChain.ALL.map((chainId: string) => {
    return (chainInfos as any)[chainId];
  });
  // console.log("networks", networks);
  return networks;
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
  const fromChain = allChains.find((_: any) => _.name === fromChainName);
  const toChain = allChains.find((_: any) => _.name === toChainName);
  if (!dataFetchers[fromChain.chainID]) {
    dataFetchers[fromChain.chainID] = new DataCache(() => {
      return fetchChainPool(fromChain.chainID);
    }, 5);
  }
  const allTokens = await dataFetchers[fromChain.chainID].getData();
  // const allTokens = await fetchChainPool(fromChain.chainID);
  // console.log("allTokens", {
  //   fromChain,
  //   toChain,
  // });
  return allTokens.filter((token: any) => {
    return token.destChains[toChain.chainID] ? true : false;
  })
}

export async function estimateFee(
  fromChainName: string,
  toChainName: string,
  token: string,
  value: number
) {
  const allChains = await getSupportedChains();
  const toChain = allChains.find((_: any) => _.name === toChainName);
  const tokens = await getAvailableTokens(fromChainName, toChainName);
  const selectedToken = tokens.find((_: any) => _.symbol === token);

  const id = Object.keys(selectedToken.destChains[toChain.chainID])[0];
  const tokenItem = selectedToken.destChains[toChain.chainID][id];
  const destToken = tokenItem;
  // console.log("destToken", destToken);
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
    token: {
      symbol: selectedToken.symbol,
      decimals: selectedToken.decimals,
      mainnetAddress: selectedToken.address,
    },
    outputToken: {
      symbol: destToken.underlying.symbol,
      decimals: destToken.underlying.decimals,
      mainnetAddress: destToken.underlying.address,
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
  const tokenDetail = fees.token;
  return [
    BRIDGE_ID,
    fromChainName,
    token,
    toChainName,
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
        for (let retry = 0; index < 5; retry++) {
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
              ["ETH", 'WBTC', 'BTC'].includes(availableToken.symbol) ? 1 : 1000
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
            break;
          } catch (e) {
            console.log("failed", e);
          }
          await new Promise((resolve) => {
            setTimeout(resolve, 10 * 1000);
          });
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 1 * 1000);
        });
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
  // const fees = await estimateFee("Ethereum", "BNB CHAIN", "WBTC", 1);
  // console.log("fees", fees);
  const feesInCsv = await estimateFeeAsCsv("Ethereum", "BNB CHAIN", "USDC", 100);
  console.log("feesInCsv", feesInCsv);
  // const fees1 = await estimateFee("Ethereum", "BNB CHAIN", "WBTC", 1);
  // console.log("fees1", fees1);
}

// test();