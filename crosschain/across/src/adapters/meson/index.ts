import { createArrayCsvWriter as createCsvWriter } from "csv-writer";
import fetch from "isomorphic-fetch";
import { DataCache, chainIdToName, nameToChainId } from "../../utils";

export const DEFAULT_FIXED_DECIMAL_POINT = 5;
const BRIDGE_ID = "meson";
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

async function fetchList() {
  const url = `https://explorer.meson.fi/api/v1/presets/chainList`;
  const req = await fetch(url);
  const networks = await req.json();
  return networks;
}

const fetchListWithCache = new DataCache(fetchList, 10);

export async function getSupportedChains() {
  const chains = await fetchListWithCache.getData();
  return chains.map((_: any) => {
    _.chainId = parseInt(_.chainId);
    return _;
  })
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
      (formChainIdTranslated && _.chainId == formChainIdTranslated)
  );

  const toChain = allChains.find(
    (_: any) =>
      _.name === toChainName ||
      (toChainIdTranslated && _.chainId == toChainIdTranslated)
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

export async function getAvailableTokens(
  fromChainName: string,
  toChainName: string
) {
  const allChains: any = await getSupportedChains();
  const fromChain = allChains.find((network: any) => network.name === fromChainName)
  const toChain = allChains.find((network: any) => network.name === toChainName)
 
  return fromChain.tokens.filter((_: any) => {
    return toChain.tokens.find((c:any) =>  _.name == _.name)
  })
}

export async function estimateFee(
  fromChainName: string,
  toChainName: string,
  token: string,
  amount: number
) {

  const allChains = await getSupportedChains();
  const { toChain, fromChain } = translateNameToChain(
    fromChainName,
    toChainName,
    allChains
  );

  const selectedToken = fromChain.tokens.find((item: any) => item.symbol.startsWith(token))
  const destToken = toChain.tokens.find((item: any) => item.symbol.startsWith(token))

  const req = await fetch(
    `https://explorer.meson.fi/api/v1/swap/calculateFee?token=${token}&inChain=${fromChain.name}&outChain=${toChain.name}&amount=${amount}`
  );
  
  const res = await req.json()
  const feeData = res.data
    
  if (!feeData) {
    throw new Error(res.message)
  }

  if (amount < feeData.totalFee) {
    throw new Error('Insufficient amount')
  }

  const feePct = (feeData.totalFee / amount).toFixed(DEFAULT_FIXED_DECIMAL_POINT);;
  const { totalFee, lpFee, originalFee } = feeData

  let serviceFee = (parseFloat(originalFee) - parseFloat(totalFee))
    .toFixed(DEFAULT_FIXED_DECIMAL_POINT);

  if (totalFee === 0) {
    serviceFee = '0'
  }

  return {
    fromChainId: fromChain.chainId,
    toChainId: toChain.chainId,
    token: {
      symbol: selectedToken.symbol,
      decimals: selectedToken.decimals,
      mainnetAddress: selectedToken.addr,
    },
    outputToken: {
      symbol: destToken.symbol,
      decimals: destToken.decimals,
      mainnetAddress: destToken.addr,
    },
    fee: totalFee,
    // percent
    breakdown: [
      {
        name: "Service Fee",
        total: serviceFee,
        display: `${serviceFee} ${destToken.symbol}`,
      },
      {
        name: "LP Fee",
        total: lpFee,
        display: `${lpFee} ${destToken.symbol}`,
      }
    ],
    totalFee: feePct,
    input: amount,
    output: totalFee === 0 ? amount : amount - totalFee,
    feeDisplay: `${totalFee === 0 ? 0 : totalFee} ${selectedToken.symbol}`,
  };
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
    fees.outputToken.symbol,
    tokenDetail.mainnetAddress,
    fees.outputToken.mainnetAddress,
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
        try {
          const startTime = Date.now();
          const feesInCsv = await estimateFeeAsCsv(
            fromChain.name,
            toChain.name,
            availableToken.symbol,
            100
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
        } catch (e) {
          console.log("failed", e);
        }
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
  const supportedChains = await getSupportedChains();
  console.log("supportedChains", supportedChains);
  const tokens = await getAvailableTokens("Ethereum", "Avalanche");
  console.log("tokens", tokens.length, tokens[0]);
  const fees = await estimateFee("Ethereum", "BSC", "USDC", 1000);
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
