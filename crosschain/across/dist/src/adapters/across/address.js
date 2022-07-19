"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCode = exports.noContractCode = exports.getAddress = exports.isValidAddress = void 0;
const constants_1 = require("./constants");
const ethers_1 = require("ethers");
function isValidAddress(address) {
    return ethers_1.ethers.utils.isAddress(address);
}
exports.isValidAddress = isValidAddress;
function getAddress(address) {
    return ethers_1.ethers.utils.getAddress(address);
}
exports.getAddress = getAddress;
exports.noContractCode = "0x";
async function getCode(address, chainId) {
    const provider = (0, constants_1.getProvider)(chainId);
    return await provider.getCode(address);
}
exports.getCode = getCode;
//# sourceMappingURL=address.js.map