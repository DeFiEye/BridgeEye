import { createArrayCsvWriter as createCsvWriter } from "csv-writer";

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

export async function getSupportedChains() {
  const req = await fetch(
    `https://explorer.meson.fi/api/v1/presets/chainList`
  );
  const res = await req.json()
  return res.data
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
  return [fromChain].concat([toChain]);
}

export async function estimateFee(
  fromChainName: string,
  toChainName: string,
  token: string,
  amount: number
) {
  const availableTokens = await getAvailableTokens(fromChainName, toChainName)

  const fromChain = availableTokens[0]
  const toChain = availableTokens[1]
  const selectedToken = fromChain.tokens.find((item: any) => item.symbol.startsWith(token))
  const destToken = toChain.tokens.find((item: any) => item.symbol.startsWith(token))

  const req = await fetch(
    `https://explorer.meson.fi/api/v1/swap/calculateFee?token=${token}&inChain=${fromChainName}&outChain=${toChainName}&amount=${amount}`
  );
  const res = await req.json()
  const feeData = res.data

  if (amount < feeData.totalFee) {
    throw new Error('Insufficient amount')
  }

  const { totalFee, lpFee, originalFee } = feeData
  return {
    fromChainId: fromChain.chainID,
    toChainId: toChain.chainID,
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
    breakdown: totalFee === 0 ? [] : [
      {
        name: "Service Fee",
        total: 0,
        display: `${originalFee - totalFee} ${destToken.symbol}`,
      },
      {
        name: "LP Fee",
        total: 0,
        display: `${lpFee} ${destToken.symbol}`,
      }
    ],
    totalFee: totalFee === 0 ? 0 : totalFee,
    input: amount,
    output: totalFee === 0 ? 0 : amount - totalFee,
    minFee: totalFee === 0 ? 0 : totalFee,
    maxFee: totalFee === 0 ? 0 : totalFee,
    minNum: 1,
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
  const fromName = fromChainName;
  const toName = toChainName;

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