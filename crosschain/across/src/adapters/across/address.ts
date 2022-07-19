import { ChainId, getProvider } from "./constants";
import { ethers } from "ethers";
export function isValidAddress(address: string) {
  return ethers.utils.isAddress(address);
}

export function getAddress(address: string) {
  return ethers.utils.getAddress(address);
}

export const noContractCode = "0x";
export async function getCode(address: string, chainId: ChainId) {
  const provider = getProvider(chainId);
  return await provider.getCode(address);
}
