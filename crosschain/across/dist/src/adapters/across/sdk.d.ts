import { utils } from "@uma/sdk";
import { relayFeeCalculator } from "@across-protocol/sdk-v2";
import { Provider } from "@ethersproject/providers";
import { ethers, BigNumber } from "ethers";
export declare const DEFAULT_FIXED_DECIMAL_POINT = 5;
import { ChainId } from "./constants";
export declare type Fee = {
    total: ethers.BigNumber;
    pct: ethers.BigNumber;
};
export interface BridgeLimits {
    minDeposit: BigNumber;
    maxDeposit: BigNumber;
    maxDepositInstant: BigNumber;
    maxDepositShortDelay: BigNumber;
}
export declare type BridgeFees = {
    relayerFee: Fee;
    lpFee: Fee;
    relayerGasFee: Fee;
    relayerCapitalFee: Fee;
};
export declare function getRelayerFee(tokenSymbol: string, amount: ethers.BigNumber, toChainId: ChainId): Promise<{
    relayerFee: Fee;
    relayerGasFee: Fee;
    relayerCapitalFee: Fee;
    isAmountTooLow: boolean;
}>;
export declare function getLpFee(l1TokenAddress: string, amount: ethers.BigNumber, blockTime?: number): Promise<Fee & {
    isLiquidityInsufficient: boolean;
}>;
declare type GetBridgeFeesArgs = {
    amount: ethers.BigNumber;
    tokenSymbol: string;
    blockTimestamp: number;
    toChainId: ChainId;
};
declare type GetBridgeFeesResult = BridgeFees & {
    isAmountTooLow: boolean;
    isLiquidityInsufficient: boolean;
};
/**
 *
 * @param amount - amount to bridge
 * @param tokenSymbol - symbol of the token to bridge
 * @param blockTimestamp - timestamp of the block to use for calculating fees on
 * @returns Returns the `relayerFee` and `lpFee` fees for bridging the given amount of tokens, along with an `isAmountTooLow` flag indicating whether the amount is too low to bridge and an `isLiquidityInsufficient` flag indicating whether the liquidity is insufficient.
 */
export declare function getBridgeFees({ amount, tokenSymbol, blockTimestamp, toChainId, }: GetBridgeFeesArgs): Promise<GetBridgeFeesResult>;
export declare const getConfirmationDepositTime: (amount: BigNumber, limits: BridgeLimits, toChain: ChainId) => "~1-4 minutes" | "~5-15 minutes" | "~12-25 minutes" | "~20-35 minutes" | "~10-30 minutes" | "~2-4 hours";
declare type AcrossDepositArgs = {
    fromChain: ChainId;
    toChain: ChainId;
    toAddress: string;
    amount: ethers.BigNumber;
    tokenAddress: string;
    relayerFeePct: ethers.BigNumber;
    timestamp: ethers.BigNumber;
    referrer?: string;
    isNative: boolean;
};
declare type AcrossApprovalArgs = {
    chainId: ChainId;
    tokenAddress: string;
    amount: ethers.BigNumber;
};
/**
 * Makes a deposit on Across.
 * @param signer A valid signer, must be connected to a provider.
 * @param depositArgs - An object containing the {@link AcrossDepositArgs arguments} to pass to the deposit function of the bridge contract.
 * @returns The transaction response obtained after sending the transaction.
 */
export declare function sendAcrossDeposit(signer: ethers.Signer, { fromChain, tokenAddress, amount, toAddress: recipient, toChain: destinationChainId, relayerFeePct, timestamp: quoteTimestamp, isNative, referrer, }: AcrossDepositArgs): Promise<ethers.providers.TransactionResponse>;
export declare function sendAcrossApproval(signer: ethers.Signer, { tokenAddress, amount, chainId }: AcrossApprovalArgs): Promise<ethers.providers.TransactionResponse>;
export default class LpFeeCalculator {
    private provider;
    private blockFinder;
    private hubPoolInstance;
    private configStoreClient;
    constructor(provider: Provider, hubPoolAddress: string, configStoreAddress: string);
    isLiquidityInsufficient(tokenAddress: string, amount: utils.BigNumberish): Promise<boolean>;
    getLpFeePct(tokenAddress: string, amount: utils.BigNumberish, timestamp?: number): Promise<ethers.BigNumber>;
}
export declare function relayFeeCalculatorConfig(chainId: ChainId): relayFeeCalculator.RelayFeeCalculatorConfig;
export declare function getBridgeLimits(token?: string, fromChainId?: ChainId, toChainId?: ChainId): Promise<{
    minDeposit: ethers.BigNumber;
    maxDeposit: ethers.BigNumber;
    maxDepositInstant: ethers.BigNumber;
    maxDepositShortDelay: ethers.BigNumber;
} | null>;
export declare function calculateBridgeFee(inputAmount: number, inputSymbol: string, fromChainId: ChainId, toChainId: ChainId): Promise<{
    token: import("./constants").TokenInfo;
    timeEstimate: string;
    input: string;
    output: string;
    breakdown: {
        name: string;
        total: string;
        percent: string;
        display: string;
    }[];
    totalFeeRaw: string;
    fee: string;
    feeDisplay: string;
    totalFee: string;
}>;
export {};
//# sourceMappingURL=sdk.d.ts.map