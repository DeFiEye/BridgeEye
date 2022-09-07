"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCSV = exports.estimateFeeAsCsv = exports.estimateFee = exports.getAvailableTokens = exports.getTokenPriceByResourceId = exports.getAvailableToChains = exports.getSupportedChains = exports.RPC_HEADERS = void 0;
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const ethers_1 = require("ethers");
const utils_1 = require("../../utils");
const csv_writer_1 = require("csv-writer");
const Bridge_json_1 = require("./abis/Bridge.json");
const ERC20PresetMinterPauser_json_1 = require("./abis/ERC20PresetMinterPauser.json");
exports.RPC_HEADERS = {
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
async function fetchConfig(chainId) {
    const url = `https://relay-api-33e56.ondigitalocean.app/api/crosschain-config`;
    const req = await (0, isomorphic_fetch_1.default)(url);
    const networks = await req.json();
    return networks;
}
const fetchConfigWithCache = new utils_1.DataCache(fetchConfig, 10);
async function getSupportedChains() {
    const networks = await fetchConfigWithCache.getData();
    return networks;
}
exports.getSupportedChains = getSupportedChains;
async function getAvailableToChains(fromChainName) {
    const allChains = await getSupportedChains();
    return allChains.filter((network) => network.name !== fromChainName);
}
exports.getAvailableToChains = getAvailableToChains;
async function getTokenPriceByResourceId(resourceId) {
    const url = `https://relay-api-33e56.ondigitalocean.app/api/tokenInfo?resourceId=${resourceId}`;
    const req = await (0, isomorphic_fetch_1.default)(url);
    const res = await req.json();
    if (res.error)
        throw new Error(`Error getTokenPriceByResourceId: ${res.error}`);
    return res.result.current_price;
}
exports.getTokenPriceByResourceId = getTokenPriceByResourceId;
const dataFetchers = {};
function translateNameToChain(fromChainName, toChainName, allChains, field = "chainID") {
    const formChainIdTranslated = (0, utils_1.nameToChainId)(fromChainName);
    const toChainIdTranslated = (0, utils_1.nameToChainId)(toChainName);
    const fromChain = allChains.find((_) => _.name === fromChainName ||
        (formChainIdTranslated && _[field] == formChainIdTranslated));
    const toChain = allChains.find((_) => _.name === toChainName ||
        (toChainIdTranslated && _[field] == toChainIdTranslated));
    return {
        fromChain,
        toChain,
    };
}
async function getAvailableTokens(fromChainName, toChainName) {
    const allChains = await getSupportedChains();
    const fromChain = allChains.find((_) => _.name === fromChainName);
    const toChain = allChains.find((_) => _.name === toChainName);
    return fromChain.tokens.filter((token) => {
        const isAllowed = token.allowedChainsToTransfer.includes(toChain.chainId);
        if ((fromChain.chainId === 2 &&
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
                token.address === "0x338A6997011c4eee53822837c4F95bBbA3a0a7f5")) {
            return false;
        }
        else {
            return isAllowed;
        }
    });
}
exports.getAvailableTokens = getAvailableTokens;
async function estimateFee(fromChainName, toChainName, token, value) {
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
    const { fromChain, toChain } = translateNameToChain(fromChainName, toChainName, allChains, "networkId");
    const tokens = await getAvailableTokens(fromChainName, toChainName);
    const selectedToken = tokens.find((_) => _.symbol === token);
    // console.log("selectedToken", selectedToken);
    let crossChainFee = 0;
    let totalFee = 0;
    try {
        const bridgeContract = new ethers_1.ethers.Contract(fromChain.bridgeAddress, Bridge_json_1.abi, new ethers_1.ethers.providers.JsonRpcProvider({
            url: fromChain.rpcUrl,
            headers: exports.RPC_HEADERS,
        }));
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
    }
    catch (e) { }
    let liquidity = null;
    let targetToken = toChain.tokens.find((_) => _.resourceId === selectedToken.resourceId);
    try {
        if (targetToken) {
            const provider = new ethers_1.ethers.providers.JsonRpcProvider({
                url: toChain.rpcUrl,
                headers: exports.RPC_HEADERS,
            });
            const tokenContract = new ethers_1.ethers.Contract(targetToken.address, ERC20PresetMinterPauser_json_1.abi, provider);
            const addrContainingTokens = toChain.erc20HandlerAddress == `N/A, it's a eth-transfers chain`
                ? toChain.bridgeAddress
                : toChain.erc20HandlerAddress;
            const amountHandler = targetToken.address == ethers_1.ethers.constants.AddressZero
                ? await provider.getBalance(addrContainingTokens).then(String)
                : await tokenContract.balanceOf(addrContainingTokens).then(String);
            liquidity = ethers_1.ethers.utils.formatUnits(amountHandler, targetToken.decimals);
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
    }
    catch (e) {
        console.log("fetch liquidity error", e);
    }
    try {
        const DOLLAR_FEE_TOKEN = 20; // that's hardcoded both here and in relayer
        const tokenPrice = await getTokenPriceByResourceId(selectedToken.resourceId);
        const feeInToken = DOLLAR_FEE_TOKEN / tokenPrice || 0;
        console.log("feeInToken", feeInToken);
    }
    catch (e) {
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
exports.estimateFee = estimateFee;
async function estimateFeeAsCsv(fromChainName, toChainName, token, amount) {
    const fees = await estimateFee(fromChainName, toChainName, token, amount);
    const tokenDetail = fees.token;
    const fromName = (0, utils_1.chainIdToName)(fees.fromChainId, fromChainName);
    const toName = (0, utils_1.chainIdToName)(fees.toChainId, fromChainName);
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
                // for (let retry = 0; index < 2; retry++) {
                try {
                    const startTime = Date.now();
                    const feesInCsv = await estimateFeeAsCsv(fromChain.name, toChain.name, availableToken.symbol, ["ETH", "WBTC", "BTC"].includes(availableToken.symbol) ? 1 : 100);
                    console.log("estimateFeeAsCsv", BRIDGE_ID, fromChain.name, toChain.name, availableToken.symbol, "spend", Date.now() - startTime);
                    allPathFeeRows.push(feesInCsv);
                    // break;
                }
                catch (e) {
                    // console.log("failed", e);
                }
                // }
            }
        }
        console.log("chain", supportedChains.length, index);
    }
    console.log("allPathFeeRows", BRIDGE_ID, allPathFeeRows.length, "spend", Date.now() - startTime);
    const csvWriter = (0, csv_writer_1.createArrayCsvWriter)({
        path: `../${BRIDGE_ID}.txt`,
        header: CSV_HEADER,
    });
    await csvWriter.writeRecords(allPathFeeRows);
}
exports.generateCSV = generateCSV;
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
//# sourceMappingURL=index.js.map