"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCSV = exports.estimateFeeAsCsv = exports.estimateFee = exports.getAvailableTokens = exports.getAvailableToChains = void 0;
const core_1 = require("./core");
const csv_writer_1 = require("csv-writer");
const BRIDGE_ID = "hyphen";
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
async function getSupportedChains() {
    const { networks, tokens } = await (0, core_1.loadConf)();
    return networks.map((_) => ({ name: _.name, chainId: _.chainId }));
}
async function getAvailableToChains(fromChainName) {
    const allChains = await getSupportedChains();
    return allChains.filter((network) => network.name !== fromChainName);
}
exports.getAvailableToChains = getAvailableToChains;
async function getAvailableTokens(fromChainName, toChainName) {
    const { networks, tokens } = await (0, core_1.loadConf)();
    const allChains = await getSupportedChains();
    const fromChain = allChains.find((_) => _.name === fromChainName);
    const toChain = allChains.find((_) => _.name === toChainName);
    const allTokens = tokens.reduce((acc, token) => {
        const { symbol } = token;
        return {
            ...acc,
            [symbol]: token,
        };
    }, {});
    return allTokens
        ? Object.keys(allTokens)
            .filter((tokenSymbol) => {
            const token = allTokens[tokenSymbol];
            return !!(token[fromChain.chainId] && token[toChain.chainId]);
        })
            .map((tokenSymbol) => allTokens[tokenSymbol])
        : [];
}
exports.getAvailableTokens = getAvailableTokens;
async function estimateFee(fromChainName, toChainName, token, amount) {
    const fees = await (0, core_1.calculateBridgeFee)(amount, token, fromChainName, toChainName);
    return fees;
}
exports.estimateFee = estimateFee;
async function estimateFeeAsCsv(fromChainName, toChainName, token, amount) {
    const fees = await estimateFee(fromChainName, toChainName, token, amount);
    const tokenDetail = fees.token;
    return [
        BRIDGE_ID,
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
exports.estimateFeeAsCsv = estimateFeeAsCsv;
async function generateCSV() {
    const supportedChains = await getSupportedChains();
    const allPathFeeRows = [];
    const startTime = Date.now();
    for (let index = 0; index < supportedChains.length; index++) {
        const fromChain = supportedChains[index];
        const availableToChains = await getAvailableToChains(fromChain.name);
        for (let index = 0; index < availableToChains.length; index++) {
            const toChain = availableToChains[index];
            const availableTokens = await getAvailableTokens(fromChain.name, toChain.name);
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
                        console.log("estimateFeeAsCsv", BRIDGE_ID, fromChain.name, toChain.name, availableToken.symbol);
                        const feesInCsv = await estimateFeeAsCsv(fromChain.name, toChain.name, availableToken.symbol, ["ETH"].includes(availableToken.symbol) ? 1 : 100);
                        console.log("estimateFeeAsCsv", fromChain.name, toChain.name, availableToken.symbol, "spend", Date.now() - startTime);
                        allPathFeeRows.push(feesInCsv);
                        break;
                    }
                    catch (e) {
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
    console.log("allPathFeeRows", allPathFeeRows.length, "spend", Date.now() - startTime);
    const csvWriter = (0, csv_writer_1.createArrayCsvWriter)({
        path: `../${BRIDGE_ID}.txt`,
        header: CSV_HEADER,
    });
    await csvWriter.writeRecords(allPathFeeRows);
}
exports.generateCSV = generateCSV;
async function test() {
    // const inputAmount = 1000;
    // const inputSymbol = "USDC";
    // const toChainId = ChainId.ARBITRUM;
    // const result = await calculateBridgeFee(inputAmount, inputSymbol, toChainId);
    // console.log("result", result);
    // const supportedChains = await getSupportedChains();
    // console.log("supportedChains", supportedChains);
    // const tokens = await getAvailableTokens("Ethereum", "Arbitrum");
    // console.log("tokens", tokens);
    // const availableToChains = await getAvailableToChains("Ethereum");
    // console.log("availableToChains", availableToChains);
    const fees = await estimateFee("Ethereum", "Polygon", "ETH", 1);
    console.log("fees", fees);
    // const feesInCsv = await estimateFeeAsCsv(
    //   "Ethereum",
    //   "Arbitrum",
    //   "USDC",
    //   1000
    // );
    // console.log("feesInCsv", feesInCsv);
    await generateCSV();
}
// test();
//# sourceMappingURL=index.js.map