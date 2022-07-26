"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBridgeFee = exports.loadConf = exports.RPC_HEADERS = exports.DEFAULT_FIXED_DECIMAL_POINT = exports.BASE_DIVISOR = void 0;
const isomorphic_fetch_1 = __importDefault(require("isomorphic-fetch"));
const ethers_1 = require("ethers");
const LiquidityPools_abi_json_1 = __importDefault(require("./abis/LiquidityPools.abi.json"));
exports.BASE_DIVISOR = 100000000;
exports.DEFAULT_FIXED_DECIMAL_POINT = 5;
exports.RPC_HEADERS = {
    origin: "https://hyphen.biconomy.io",
};
class DataCache {
    constructor(fetchFunction, minutesToLive = 10) {
        this.millisecondsToLive = minutesToLive * 60 * 1000;
        this.fetchFunction = fetchFunction;
        this.cache = null;
        this.getData = this.getData.bind(this);
        this.resetCache = this.resetCache.bind(this);
        this.isCacheExpired = this.isCacheExpired.bind(this);
        this.fetchDate = new Date(0);
    }
    isCacheExpired() {
        return (this.fetchDate.getTime() + this.millisecondsToLive < new Date().getTime());
    }
    getData() {
        if (!this.cache || this.isCacheExpired()) {
            // console.log("expired - fetching new data");
            return this.fetchFunction().then((data) => {
                this.cache = data;
                this.fetchDate = new Date();
                return data;
            });
        }
        else {
            // console.log("cache hit");
            return Promise.resolve(this.cache);
        }
    }
    resetCache() {
        this.fetchDate = new Date(0);
    }
}
async function fetchTokens() {
    const req = await (0, isomorphic_fetch_1.default)("https://hyphen-v2-api.biconomy.io/api/v1/configuration/tokens");
    return await req.json();
}
async function fetchNetworks() {
    const req = await (0, isomorphic_fetch_1.default)("https://hyphen-v2-api.biconomy.io/api/v1/configuration/networks");
    return await req.json();
}
async function getTokenPrice(tokenAddress, network) {
    const req = await (0, isomorphic_fetch_1.default)(`https://hyphen-v2-api.biconomy.io/api/v1/insta-exit/get-token-price?tokenAddress=${tokenAddress}&networkId=${network}`);
    return await req.json();
}
const fetchNetworksWithCache = new DataCache(fetchNetworks, 10);
const fetchTokensWithCache = new DataCache(fetchTokens, 10);
async function loadConf() {
    const [networks, tokens] = await Promise.all([
        fetchNetworksWithCache.getData(),
        fetchTokensWithCache.getData(),
    ]);
    // console.log("networks", networks.message, tokens.message);
    return {
        networks: networks.message,
        tokens: tokens.message,
    };
}
exports.loadConf = loadConf;
async function calculateBridgeFee(transferAmount, inputSymbol, fromChainName, toChainName) {
    const { networks, tokens } = await loadConf();
    const fromChain = networks.find((a) => a.name === fromChainName);
    const toChain = networks.find((a) => a.name === toChainName);
    const contractAddress = toChain.contracts.hyphen.liquidityPool;
    const fromChainLiquidityPool = fromChain.contracts.hyphen.liquidityPool;
    // console.log("toChain", {
    //   fromChain: fromChain.rpc,
    //   toChain: toChain.rpc,
    // });
    const selectedToken = tokens.find((_) => {
        if (_.symbol === inputSymbol) {
            return true;
        }
        return false;
    });
    const fromChainToken = selectedToken[fromChain.chainId];
    const toChainToken = selectedToken[toChain.chainId];
    const toChainTokenDecimal = toChainToken.decimal;
    let tokenAddress = toChainToken.address;
    // console.log("tokenDetail", selectedToken);
    const liquidityPoolsContract = new ethers_1.ethers.Contract(contractAddress, LiquidityPools_abi_json_1.default, new ethers_1.ethers.providers.JsonRpcProvider({
        url: toChain.rpc,
        headers: exports.RPC_HEADERS,
    }));
    const fromChainLiquidityPoolsContract = new ethers_1.ethers.Contract(fromChainLiquidityPool, LiquidityPools_abi_json_1.default, new ethers_1.ethers.providers.JsonRpcProvider({
        url: fromChain.rpc,
        headers: exports.RPC_HEADERS,
    }));
    let toChainRawTransferAmount = ethers_1.ethers.utils.parseUnits(transferAmount.toString(), toChainTokenDecimal);
    // console.log('query transfer fee')
    const transferFee = await liquidityPoolsContract.getTransferFee(tokenAddress, toChainRawTransferAmount);
    // console.log("getRewardAmount", [
    //   fromChainToken.address,
    //   ethers.utils.parseUnits(transferAmount.toString(), fromChainToken.decimal),
    // ]);
    let rewardAmount = await fromChainLiquidityPoolsContract.getRewardAmount(ethers_1.ethers.utils
        .parseUnits(transferAmount.toString(), fromChainToken.decimal)
        .toString(), fromChainToken.address);
    rewardAmount = ethers_1.ethers.utils.formatUnits(rewardAmount, fromChainToken.decimal);
    // console.log("rewardAmount", rewardAmount);
    let transferFeePerc = transferFee.toString() / exports.BASE_DIVISOR;
    let lpFeeAmountRaw = (transferFeePerc * transferAmount) / 100;
    let lpFeeProcessedString;
    lpFeeProcessedString = lpFeeAmountRaw.toFixed(exports.DEFAULT_FIXED_DECIMAL_POINT);
    const response = await getTokenPrice(toChainToken.address, toChain.chainId);
    let tokenGasPrice = response.tokenGasPrice;
    let overhead = fromChainToken.transferOverhead;
    let transactionFeeRaw = ethers_1.BigNumber.from(overhead).mul(tokenGasPrice);
    let transactionFee = ethers_1.ethers.utils.formatUnits(transactionFeeRaw, toChainToken.decimal);
    const breakdown = [
        {
            name: "LP Fee",
            total: lpFeeProcessedString,
            percent: transferFeePerc,
            display: `${lpFeeProcessedString} ${selectedToken.symbol}`,
        },
        {
            name: "Transaction Fee",
            total: transactionFee,
            display: `${transactionFee} ${selectedToken.symbol}`,
        },
        {
            name: "Reward Amount",
            total: rewardAmount,
            display: `${rewardAmount} ${selectedToken.symbol}`,
        },
    ];
    let amountToGet = transferAmount -
        parseFloat(transactionFee) -
        parseFloat(lpFeeProcessedString);
    if (rewardAmount) {
        amountToGet += parseFloat(rewardAmount);
    }
    const totalFee = (Number.parseFloat(lpFeeProcessedString) +
        Number.parseFloat(transactionFee) -
        Number.parseFloat(rewardAmount || "0")).toFixed(exports.DEFAULT_FIXED_DECIMAL_POINT);
    return {
        token: {
            symbol: selectedToken.symbol,
            decimals: fromChainToken.decimal,
            mainnetAddress: fromChainToken.address,
        },
        fee: totalFee,
        // percent
        breakdown,
        totalFee: transferFeePerc.toFixed(exports.DEFAULT_FIXED_DECIMAL_POINT),
        input: transferAmount,
        output: amountToGet.toFixed(exports.DEFAULT_FIXED_DECIMAL_POINT),
        feeDisplay: `${totalFee} ${selectedToken.symbol}`,
    };
}
exports.calculateBridgeFee = calculateBridgeFee;
async function test() {
    // for (let index = 0; index < 10; index++) {
    //   await loadConf();
    // }
    console.log(await calculateBridgeFee(1000, "USDC", "Ethereum", "Arbitrum"));
}
test();
//# sourceMappingURL=core.js.map