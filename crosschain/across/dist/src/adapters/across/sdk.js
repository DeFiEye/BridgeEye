"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateBridgeFee = exports.relayFeeCalculatorConfig = exports.sendAcrossApproval = exports.sendAcrossDeposit = exports.getConfirmationDepositTime = exports.getBridgeFees = exports.getLpFee = exports.getRelayerFee = void 0;
const assert_1 = __importDefault(require("assert"));
const sdk_1 = require("@uma/sdk");
const sdk_v2_1 = require("@across-protocol/sdk-v2");
const ethers_1 = require("ethers");
// import { BridgeLimits } from "hooks";
const constants_1 = require("./constants");
const format_1 = require("./format");
const config_1 = require("./config");
async function getRelayerFee(tokenSymbol, amount, toChainId) {
    const config = relayFeeCalculatorConfig(toChainId);
    // Construction of a new RelayFeeCalculator will throw if any props in the config are incorrectly set. For example,
    // if the capital cost config is incorrectly set for a token, construction will throw.
    const calculator = new sdk_v2_1.relayFeeCalculator.RelayFeeCalculator(config);
    const result = await calculator.relayerFeeDetails(amount, tokenSymbol);
    return {
        relayerFee: {
            pct: ethers_1.ethers.BigNumber.from(result.relayFeePercent),
            total: ethers_1.ethers.BigNumber.from(result.relayFeeTotal),
        },
        relayerGasFee: {
            pct: ethers_1.ethers.BigNumber.from(result.gasFeePercent),
            total: ethers_1.ethers.BigNumber.from(result.gasFeeTotal),
        },
        relayerCapitalFee: {
            pct: ethers_1.ethers.BigNumber.from(result.capitalFeePercent),
            total: ethers_1.ethers.BigNumber.from(result.capitalFeeTotal),
        },
        isAmountTooLow: result.isAmountTooLow,
    };
}
exports.getRelayerFee = getRelayerFee;
async function getLpFee(l1TokenAddress, amount, blockTime) {
    if (amount.lte(0)) {
        throw new Error(`Amount must be greater than 0.`);
    }
    const provider = (0, constants_1.getProvider)(constants_1.hubPoolChainId);
    const configStoreAddress = (0, constants_1.getConfigStoreAddress)(constants_1.hubPoolChainId);
    const result = {
        pct: ethers_1.BigNumber.from(0),
        total: ethers_1.BigNumber.from(0),
        isLiquidityInsufficient: false,
    };
    const lpFeeCalculator = new LpFeeCalculator(provider, constants_1.hubPoolAddress, configStoreAddress);
    result.pct = await lpFeeCalculator.getLpFeePct(l1TokenAddress, amount, blockTime);
    result.isLiquidityInsufficient =
        await lpFeeCalculator.isLiquidityInsufficient(l1TokenAddress, amount);
    result.total = amount.mul(result.pct).div((0, format_1.parseEther)("1"));
    return result;
}
exports.getLpFee = getLpFee;
async function getBlock(chainId, blockHashOrBlockTag = "latest") {
    const provider = (0, constants_1.getProvider)(chainId);
    return provider.getBlock(blockHashOrBlockTag);
}
/**
 *
 * @param amount - amount to bridge
 * @param tokenSymbol - symbol of the token to bridge
 * @param blockTimestamp - timestamp of the block to use for calculating fees on
 * @returns Returns the `relayerFee` and `lpFee` fees for bridging the given amount of tokens, along with an `isAmountTooLow` flag indicating whether the amount is too low to bridge and an `isLiquidityInsufficient` flag indicating whether the liquidity is insufficient.
 */
async function getBridgeFees({ amount, tokenSymbol, blockTimestamp, toChainId, }) {
    const config = (0, config_1.getConfig)();
    const l1TokenAddress = config.getL1TokenAddressBySymbol(tokenSymbol);
    const { relayerFee, relayerGasFee, relayerCapitalFee, isAmountTooLow } = await getRelayerFee(tokenSymbol, amount, toChainId);
    const { isLiquidityInsufficient, ...lpFee } = await getLpFee(l1TokenAddress, amount, blockTimestamp).catch((err) => {
        console.error("Error getting lp fee", err);
        throw err;
    });
    return {
        relayerFee,
        relayerGasFee,
        relayerCapitalFee,
        lpFee,
        isAmountTooLow,
        isLiquidityInsufficient,
    };
}
exports.getBridgeFees = getBridgeFees;
const getConfirmationDepositTime = (amount, limits, toChain) => {
    if (amount.lte(limits.maxDepositInstant)) {
        // 1 bot run, assuming it runs every 2 minutes.
        return "~1-4 minutes";
    }
    else if (amount.lte(limits.maxDepositShortDelay)) {
        // This is just a rough estimate of how long 2 bot runs (1-4 minutes allocated for each) + an arbitrum transfer of 3-10 minutes would take.
        if (toChain === constants_1.ChainId.ARBITRUM)
            return "~5-15 minutes";
        // Optimism transfers take about 10-20 minutes anecdotally. Boba is presumed to be similar.
        if (toChain === constants_1.ChainId.OPTIMISM || toChain === constants_1.ChainId.BOBA)
            return "~12-25 minutes";
        // Polygon transfers take 20-30 minutes anecdotally.
        if (toChain === constants_1.ChainId.POLYGON)
            return "~20-35 minutes";
        // Typical numbers for an arbitrary L2.
        return "~10-30 minutes";
    }
    // If the deposit size is above those, but is allowed by the app, we assume the pool will slow relay it.
    return "~2-4 hours";
};
exports.getConfirmationDepositTime = getConfirmationDepositTime;
/**
 * Makes a deposit on Across.
 * @param signer A valid signer, must be connected to a provider.
 * @param depositArgs - An object containing the {@link AcrossDepositArgs arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
async function sendAcrossDeposit(signer, { fromChain, tokenAddress, amount, toAddress: recipient, toChain: destinationChainId, relayerFeePct, timestamp: quoteTimestamp, isNative, referrer, }) {
    const config = (0, config_1.getConfig)();
    const spokePool = config.getSpokePool(fromChain);
    const provider = (0, constants_1.getProvider)(fromChain);
    const code = await provider.getCode(spokePool.address);
    if (!code) {
        throw new Error(`SpokePool not deployed at ${spokePool.address}`);
    }
    const value = isNative ? amount : ethers_1.ethers.constants.Zero;
    const tx = await spokePool.populateTransaction.deposit(recipient, tokenAddress, amount, destinationChainId, relayerFeePct, quoteTimestamp, { value });
    // do not tag a referrer if data is not provided as a hex string.
    tx.data =
        referrer && ethers_1.ethers.utils.isAddress(referrer)
            ? (0, format_1.tagAddress)(tx.data, referrer, constants_1.referrerDelimiterHex)
            : tx.data;
    return signer.sendTransaction(tx);
}
exports.sendAcrossDeposit = sendAcrossDeposit;
async function sendAcrossApproval(signer, { tokenAddress, amount, chainId }) {
    const config = (0, config_1.getConfig)();
    const spokePool = config.getSpokePool(chainId, signer);
    const provider = (0, constants_1.getProvider)(chainId);
    const code = await provider.getCode(spokePool.address);
    if (!code) {
        throw new Error(`SpokePool not deployed at ${spokePool.address}`);
    }
    const tokenContract = sdk_1.clients.erc20.connect(tokenAddress, signer);
    return tokenContract.approve(spokePool.address, amount);
}
exports.sendAcrossApproval = sendAcrossApproval;
const { exists } = sdk_1.utils;
const { calculateRealizedLpFeePct } = sdk_v2_1.lpFeeCalculator;
class LpFeeCalculator {
    constructor(provider, hubPoolAddress, configStoreAddress) {
        this.provider = provider;
        this.blockFinder = new sdk_1.BlockFinder(provider.getBlock.bind(provider));
        this.hubPoolInstance = sdk_v2_1.contracts.hubPool.connect(hubPoolAddress, provider);
        this.configStoreClient = new sdk_v2_1.contracts.acrossConfigStore.Client(configStoreAddress, provider);
    }
    async isLiquidityInsufficient(tokenAddress, amount) {
        const [, pooledTokens] = await Promise.all([
            this.hubPoolInstance.callStatic.sync(tokenAddress),
            this.hubPoolInstance.callStatic.pooledTokens(tokenAddress),
        ]);
        return pooledTokens.liquidReserves.lt(amount);
    }
    async getLpFeePct(tokenAddress, amount, timestamp) {
        amount = ethers_1.BigNumber.from(amount);
        (0, assert_1.default)(amount.gt(0), "Amount must be greater than 0");
        const { blockFinder, hubPoolInstance, configStoreClient, provider } = this;
        const targetBlock = exists(timestamp)
            ? await blockFinder.getBlockForTimestamp(timestamp)
            : await provider.getBlock("latest");
        (0, assert_1.default)(exists(targetBlock), "Unable to find target block for timestamp: " + timestamp || "latest");
        const blockTag = targetBlock.number;
        const [currentUt, nextUt, rateModel] = await Promise.all([
            hubPoolInstance.callStatic.liquidityUtilizationCurrent(tokenAddress, {
                blockTag,
            }),
            hubPoolInstance.callStatic.liquidityUtilizationPostRelay(tokenAddress, amount, { blockTag }),
            configStoreClient.getRateModel(tokenAddress, {
                blockTag,
            }),
        ]);
        return calculateRealizedLpFeePct(rateModel, currentUt, nextUt);
    }
}
exports.default = LpFeeCalculator;
function relayFeeCalculatorConfig(chainId) {
    const config = (0, config_1.getConfig)();
    const provider = (0, constants_1.getProvider)(chainId);
    const token = config.getNativeTokenInfo(chainId);
    if (!constants_1.queriesTable[chainId])
        throw new Error(`No queries in queriesTable for chainId ${chainId}!`);
    const queries = constants_1.queriesTable[chainId](provider);
    return {
        nativeTokenDecimals: token.decimals,
        feeLimitPercent: constants_1.MAX_RELAY_FEE_PERCENT,
        capitalCostsPercent: constants_1.FLAT_RELAY_CAPITAL_FEE,
        capitalCostsConfig: constants_1.relayerFeeCapitalCostConfig,
        queries,
    };
}
exports.relayFeeCalculatorConfig = relayFeeCalculatorConfig;
async function calculateBridgeFee(inputAmount, inputSymbol, toChainId) {
    // const inputAmount = 1000;
    // const inputSymbol = "USDC";
    const tokenDetail = (0, constants_1.getToken)(inputSymbol);
    // const toChainId = ChainId.ARBITRUM;
    const amount = ethers_1.BigNumber.from(inputAmount).mul(ethers_1.BigNumber.from("10").pow(tokenDetail.decimals));
    const block = await getBlock(toChainId);
    const fees = await getBridgeFees({
        amount,
        tokenSymbol: inputSymbol,
        blockTimestamp: block.timestamp,
        toChainId,
    });
    const totalFeePct = fees.relayerFee.pct.add(fees.lpFee.pct);
    const destinationGasFee = fees.relayerGasFee.total;
    const acrossBridgeFee = fees.lpFee.total.add(fees.relayerCapitalFee.total);
    const result = {
        token: tokenDetail,
        input: ethers_1.ethers.utils.formatUnits(amount, tokenDetail.decimals),
        output: ethers_1.ethers.utils.formatUnits(amount.sub(fees.relayerFee.total).sub(fees.lpFee.total), tokenDetail.decimals),
        breakdown: [
            {
                name: "Across BridgeFee",
                total: acrossBridgeFee.toString(),
                percent: fees.lpFee.pct.add(fees.relayerCapitalFee.pct).toString(),
            },
            {
                name: "Destination GasFee",
                total: destinationGasFee.toString(),
                percent: fees.relayerGasFee.pct.toString(),
            },
        ],
        totalFeeRaw: totalFeePct.toString(),
        totalFee: (0, format_1.formatEtherRaw)(totalFeePct),
    };
    // console.log(result);
    return result;
}
exports.calculateBridgeFee = calculateBridgeFee;
//# sourceMappingURL=sdk.js.map