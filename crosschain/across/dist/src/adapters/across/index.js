"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCSV = exports.estimateFeeAsCsv = exports.estimateFeeAPI = exports.estimateFee = exports.getAvailableTokens = exports.getAvailableToChains = exports.availableChains = void 0;
const sdk_1 = require("./sdk");
const constants_1 = require("./constants");
const config_1 = require("./config");
const csv_writer_1 = require("csv-writer");
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
exports.availableChains = [
    {
        name: "Ethereum",
        chainId: constants_1.ChainId.MAINNET,
    },
    {
        name: "Arbitrum",
        chainId: constants_1.ChainId.ARBITRUM,
    },
    {
        name: "Optimism",
        chainId: constants_1.ChainId.OPTIMISM,
    },
    {
        name: "Boba",
        chainId: constants_1.ChainId.BOBA,
    },
    {
        name: "Polygon",
        chainId: constants_1.ChainId.POLYGON,
    },
];
async function getSupportedChains() {
    return exports.availableChains;
}
function getAvailableToChains(fromChainName) {
    var _a;
    const config = (0, config_1.getConfig)();
    const fromChain = (_a = exports.availableChains.find((_) => _.name === fromChainName)) === null || _a === void 0 ? void 0 : _a.chainId;
    const availableRoutes = config.filterRoutes({ fromChain });
    const availableToChains = (0, constants_1.calculateAvailableToChains)(fromChain, availableRoutes, config.listToChains());
    return availableToChains;
}
exports.getAvailableToChains = getAvailableToChains;
function getAvailableTokens(fromChainName, toChainName) {
    var _a, _b;
    const config = (0, config_1.getConfig)();
    const fromChain = (_a = exports.availableChains.find((_) => _.name === fromChainName)) === null || _a === void 0 ? void 0 : _a.chainId;
    const toChain = (_b = exports.availableChains.find((_) => _.name === toChainName)) === null || _b === void 0 ? void 0 : _b.chainId;
    const availableTokens = config.filterReachableTokens(fromChain, toChain);
    return availableTokens;
}
exports.getAvailableTokens = getAvailableTokens;
async function estimateFee(fromChain, toChainName, token, amount) {
    var _a;
    const toChain = (_a = exports.availableChains.find((_) => _.name === toChainName)) === null || _a === void 0 ? void 0 : _a.chainId;
    const fees = await (0, sdk_1.calculateBridgeFee)(amount, token, toChain);
    return fees;
}
exports.estimateFee = estimateFee;
async function estimateFeeAPI(fromChain, toChainName, token, amount) {
    var _a;
    const toChain = (_a = exports.availableChains.find((_) => _.name === toChainName)) === null || _a === void 0 ? void 0 : _a.chainId;
    const fees = await (0, sdk_1.calculateBridgeFee)(amount, token, toChain);
    return fees;
}
exports.estimateFeeAPI = estimateFeeAPI;
async function estimateFeeAsCsv(fromChainName, toChainName, token, amount) {
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
                try {
                    const startTime = Date.now();
                    console.log("estimateFeeAsCsv", fromChain.name, toChain.name, availableToken.symbol);
                    const feesInCsv = await estimateFeeAsCsv(fromChain.name, toChain.name, availableToken.symbol, 1000);
                    console.log("estimateFeeAsCsv", fromChain.name, toChain.name, availableToken.symbol, "spend", Date.now() - startTime);
                    allPathFeeRows.push(feesInCsv);
                }
                catch (e) {
                    console.log("estimateFeeAsCsv.error", e);
                }
            }
        }
    }
    console.log("allPathFeeRows", allPathFeeRows.length, "spend", Date.now() - startTime);
    const csvWriter = (0, csv_writer_1.createArrayCsvWriter)({
        path: "../acrossto.txt",
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
    const supportedChains = await getSupportedChains();
    console.log("supportedChains", supportedChains);
    const tokens = await getAvailableTokens("Ethereum", "Arbitrum");
    console.log("tokens", tokens);
    const availableToChains = await getAvailableToChains("Ethereum");
    console.log("availableToChains", availableToChains);
    const fees = await estimateFee("Ethereum", "Arbitrum", "USDC", 1000);
    console.log("fees", fees);
    // const feesInCsv = await estimateFee("Ethereum", "Arbitrum", "USDC", 1000);
    // console.log("feesInCsv", feesInCsv);
    // await generateCSV();
}
// test();
//# sourceMappingURL=index.js.map