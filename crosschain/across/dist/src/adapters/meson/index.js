"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCSV = exports.estimateFeeAsCsv = exports.estimateFee = exports.getAvailableTokens = exports.getAvailableToChains = exports.getSupportedChains = exports.DEFAULT_FIXED_DECIMAL_POINT = void 0;
const csv_writer_1 = require("csv-writer");
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const utils_1 = require("../../utils");
exports.DEFAULT_FIXED_DECIMAL_POINT = 5;
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
    const req = await (0, isomorphic_fetch_1.default)(url);
    const networks = await req.json();
    return networks;
}
const fetchListWithCache = new utils_1.DataCache(fetchList, 10);
async function getSupportedChains() {
    const chains = await fetchListWithCache.getData();
    return chains.map((_) => {
        _.chainId = parseInt(_.chainId);
        return _;
    });
}
exports.getSupportedChains = getSupportedChains;
function translateNameToChain(fromChainName, toChainName, allChains) {
    const formChainIdTranslated = (0, utils_1.nameToChainId)(fromChainName);
    const toChainIdTranslated = (0, utils_1.nameToChainId)(toChainName);
    const fromChain = allChains.find((_) => _.name === fromChainName ||
        (formChainIdTranslated && _.chainId == formChainIdTranslated));
    const toChain = allChains.find((_) => _.name === toChainName ||
        (toChainIdTranslated && _.chainId == toChainIdTranslated));
    return {
        fromChain,
        toChain,
    };
}
async function getAvailableToChains(fromChainName) {
    const allChains = await getSupportedChains();
    return allChains.filter((network) => network.name !== fromChainName);
}
exports.getAvailableToChains = getAvailableToChains;
async function getAvailableTokens(fromChainName, toChainName) {
    const allChains = await getSupportedChains();
    const fromChain = allChains.find((network) => network.name === fromChainName);
    const toChain = allChains.find((network) => network.name === toChainName);
    return fromChain.tokens.filter((_) => {
        return toChain.tokens.find((c) => _.name == _.name);
    });
}
exports.getAvailableTokens = getAvailableTokens;
async function estimateFee(fromChainName, toChainName, token, amount) {
    const allChains = await getSupportedChains();
    const { toChain, fromChain } = translateNameToChain(fromChainName, toChainName, allChains);
    const selectedToken = fromChain.tokens.find((item) => item.symbol.startsWith(token));
    const destToken = toChain.tokens.find((item) => item.symbol.startsWith(token));
    const req = await (0, isomorphic_fetch_1.default)(`https://explorer.meson.fi/api/v1/swap/calculateFee?token=${token}&inChain=${fromChain.name}&outChain=${toChain.name}&amount=${amount}`);
    const res = await req.json();
    const feeData = res.data;
    if (!feeData) {
        throw new Error(res.message);
    }
    if (amount < feeData.totalFee) {
        throw new Error('Insufficient amount');
    }
    const feePct = (feeData.totalFee / amount).toFixed(exports.DEFAULT_FIXED_DECIMAL_POINT);
    ;
    const { totalFee, lpFee, originalFee } = feeData;
    let serviceFee = (parseFloat(originalFee) - parseFloat(totalFee))
        .toFixed(exports.DEFAULT_FIXED_DECIMAL_POINT);
    if (totalFee === 0) {
        serviceFee = '0';
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
exports.estimateFee = estimateFee;
async function estimateFeeAsCsv(fromChainName, toChainName, token, amount) {
    const fees = await estimateFee(fromChainName, toChainName, token, amount);
    const fromName = (0, utils_1.chainIdToName)(fees.fromChainId, fromChainName);
    const toName = (0, utils_1.chainIdToName)(fees.toChainId, fromChainName);
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
            for (let index = 0; index < availableTokens.length; index++) {
                const availableToken = availableTokens[index];
                try {
                    const startTime = Date.now();
                    const feesInCsv = await estimateFeeAsCsv(fromChain.name, toChain.name, availableToken.symbol, 100);
                    console.log("estimateFeeAsCsv", BRIDGE_ID, fromChain.name, toChain.name, availableToken.symbol, "spend", Date.now() - startTime);
                    allPathFeeRows.push(feesInCsv);
                }
                catch (e) {
                    console.log("failed", e);
                }
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
//# sourceMappingURL=index.js.map