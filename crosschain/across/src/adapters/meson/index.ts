import {createArrayCsvWriter as createCsvWriter} from "csv-writer";
import fetch from "isomorphic-fetch";
import {DataCache, nameToChainId, normalizeChainName} from "../../utils";
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
const sampleAddress = "0x243f22fbd4c375581aaacfcfff5a43793eb8a74d"
async function fetchList() {
  const url = `https://relayer.meson.fi/api/v1/list`;
  const req = await fetch(url);
  const networks = await req.json();
  return networks.result;
}

const fetchListWithCache = new DataCache(fetchList, 10);

export async function getSupportedChains() {
  return await fetchListWithCache.getData();
}

function translateNameToChain(
  fromChainName: string,
  toChainName: string,
  allChains: any[]
) {

  const fromChain = allChains.find(
    (_: any) =>
      _.name === fromChainName
  );

  const toChain = allChains.find(
    (_: any) =>
      _.name === toChainName
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
  fromChain: any,
  toChain: any
) {
  return fromChain.tokens.filter((_: any) => {
    return toChain.tokens.find((c: any) => _.id == c.id)
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
  token = token.toUpperCase();
  const selectedToken = fromChain.tokens.find((item: any) => item.id.toUpperCase() == token)
  const destToken = toChain.tokens.find((item: any) => item.id.toUpperCase() == token)
  const payload = JSON.stringify({
    "from": `${fromChain.id}:${token}`,
    "to": `${toChain.id}:${token}`,
    "amount": amount.toString(),
    "fromAddress": sampleAddress
  })

  const req = await fetch(`https://relayer.meson.fi/api/v1/price`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: payload
  });

  const res = await req.json();
  const feeData = res.result
  if (!feeData) {
    throw new Error(res.message)
  }

  if (amount < feeData.totalFee) {
    throw new Error('Insufficient amount')
  }

  const feePct = (feeData.totalFee / amount).toFixed(DEFAULT_FIXED_DECIMAL_POINT);;
  const { totalFee, lpFee, serviceFee } = feeData

  return {
    fromChainId: fromChain.chainId,
    toChainId: toChain.chainId,
    token: {
      symbol: selectedToken.id.toUpperCase(),
      mainnetAddress: selectedToken.addr,
    },
    outputToken: {
      symbol: destToken.id.toUpperCase(),
      mainnetAddress: destToken.addr,
    },
    fee: totalFee,
    // percent
    breakdown: [
      {
        name: "Service Fee",
        total: serviceFee,
        display: `${serviceFee} ${destToken.id.toUpperCase()}`,
      },
      {
        name: "LP Fee",
        total: lpFee,
        display: `${lpFee} ${destToken.id.toUpperCase()}`,
      }
    ],
    totalFeePct: feePct,
    input: amount,
    output: totalFee === 0 ? amount : amount - totalFee,
    feeDisplay: `${totalFee === 0 ? 0 : totalFee} ${selectedToken.id.toUpperCase()}`,
  };
}

export async function estimateFeeAsCsv(
  fromChainName: string,
  toChainName: string,
  token: string,
  amount: number
) {
  const fees = await estimateFee(fromChainName, toChainName, token, amount);
  const fromName = normalizeChainName(fromChainName);
  const toName = normalizeChainName(toChainName);
  const tokenDetail = fees.token;
  return [
    BRIDGE_ID,
    fromName,
    fees.token.symbol,
    toName,
    fees.outputToken.symbol,
    tokenDetail.mainnetAddress,
    fees.outputToken.mainnetAddress,
    "",
    "",
    true,
    0,
    parseFloat(fees.totalFeePct) * 100,
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
      const availableTokens = await getAvailableTokens(fromChain, toChain);
      for (let index = 0; index < availableTokens.length; index++) {
        const availableToken = availableTokens[index];
        try {
          const startTime = Date.now();
          const feesInCsv = await estimateFeeAsCsv(
            fromChain.name,
            toChain.name,
            availableToken.id,
            100
          );
          console.log(
            "estimateFeeAsCsv",
            BRIDGE_ID,
            fromChain.name,
            toChain.name,
            availableToken.id,
            "spend",
            Date.now() - startTime
          );
          allPathFeeRows.push(feesInCsv);
        } catch (e: any) {
          console.log(`failed: swap ${availableToken.symbol} from ${fromChain.name} -> ${toChain.name}`, e.message);
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