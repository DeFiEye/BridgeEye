"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPoolAPY = exports.formatNumberMaxFracDigits = exports.formatNumberTwoSigDigits = exports.capitalizeFirstLetter = exports.tagAddress = exports.tagString = exports.tagHex = exports.stringToHex = exports.parseEther = exports.parseUnits = exports.formatEtherRaw = exports.formatEther = exports.formatUnits = exports.numberFormatter = exports.shortenTransactionHash = exports.shortenString = exports.shortenAddress = exports.isValidString = void 0;
const ethers_1 = require("ethers");
const assert_1 = __importDefault(require("assert"));
function isValidString(s) {
    if (s != null && typeof s === "string" && s !== "") {
        return true;
    }
    return false;
}
exports.isValidString = isValidString;
/**
 *
 * @param address valid web3 address
 * @param delimiter string to put between your split string, eg: "...", "---"
 * @param numChars number of characters to keep on each part of the string
 * @returns string. Formatted version of address param.
 */
function shortenAddress(address, delimiter, numChars) {
    if (!isValidString(address)) {
        return "";
    }
    return shortenString(address, delimiter, numChars);
}
exports.shortenAddress = shortenAddress;
/**
 *
 * @param str string to shorten
 * @param delimiter string to put between your split string, eg: "...", "---"
 * @param numChars number of characters to keep on each part of the string
 * @returns string. Formatted version of str param.
 */
function shortenString(str, delimiter, numChars) {
    // Cannot shorten this string, force early return.
    if (str.length < 2 * numChars)
        return str;
    return `${str.substring(0, numChars)}${delimiter}${str.substring(str.length - numChars, str.length)}`;
}
exports.shortenString = shortenString;
function shortenTransactionHash(hash) {
    return `${hash.substring(0, 5)}...`;
}
exports.shortenTransactionHash = shortenTransactionHash;
// this actually will round up in some cases
const numberFormatter = (num) => new Intl.NumberFormat("en-US", {
    minimumSignificantDigits: 1,
    maximumSignificantDigits: 4,
}).format(num);
exports.numberFormatter = numberFormatter;
function formatUnits(wei, decimals) {
    return (0, exports.numberFormatter)(Number(ethers_1.ethers.utils.formatUnits(wei, decimals)));
}
exports.formatUnits = formatUnits;
function formatEther(wei) {
    return formatUnits(wei, 18);
}
exports.formatEther = formatEther;
function formatEtherRaw(wei) {
    return ethers_1.ethers.utils.formatUnits(wei, 18);
}
exports.formatEtherRaw = formatEtherRaw;
function parseUnits(value, decimals) {
    return ethers_1.ethers.utils.parseUnits(value, decimals);
}
exports.parseUnits = parseUnits;
function parseEther(value) {
    return parseUnits(value, 18);
}
exports.parseEther = parseEther;
function stringToHex(value) {
    return ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.toUtf8Bytes(value));
}
exports.stringToHex = stringToHex;
// appends hex tag to data
function tagHex(dataHex, tagHex, delimitterHex = "") {
    (0, assert_1.default)(ethers_1.ethers.utils.isHexString(dataHex), "Data must be valid hex string");
    return ethers_1.ethers.utils.hexConcat([dataHex, delimitterHex, tagHex]);
}
exports.tagHex = tagHex;
// converts a string tag to hex and appends, currently not in use
function tagString(dataHex, tagString) {
    return tagHex(dataHex, stringToHex(tagString));
}
exports.tagString = tagString;
// tags only an address
function tagAddress(dataHex, address, delimiterHex = "") {
    (0, assert_1.default)(ethers_1.ethers.utils.isAddress(address), "Data must be a valid address");
    return tagHex(dataHex, address, delimiterHex);
}
exports.tagAddress = tagAddress;
function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
exports.capitalizeFirstLetter = capitalizeFirstLetter;
const twoSigFormatter = new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 2,
});
exports.formatNumberTwoSigDigits = twoSigFormatter.format.bind(twoSigFormatter);
const threeMaxFracFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 3,
});
exports.formatNumberMaxFracDigits = threeMaxFracFormatter.format.bind(threeMaxFracFormatter);
function formatPoolAPY(wei, decimals) {
    return (0, exports.formatNumberMaxFracDigits)(Number(ethers_1.ethers.utils.formatUnits(wei, decimals)));
}
exports.formatPoolAPY = formatPoolAPY;
//# sourceMappingURL=format.js.map