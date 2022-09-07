"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCache = exports.nameToChainId = exports.chainIdToName = exports.chainNames = void 0;
exports.chainNames = {
    "1": "Ethereum",
    "5": "Goerli",
    "10": "Optimism",
    "25": "Cronos",
    "40": "TLOS",
    "56": "BSC",
    "57": "SYS",
    "66": "OKxChain",
    "70": "HSC",
    "100": "Gnosis",
    "122": "Fuse",
    "128": "Heco",
    "137": "Polygon",
    "250": "Fantom",
    "288": "Boba",
    "321": "KCC",
    "336": "SDN",
    "592": "Astar",
    "1088": "Metis",
    "1284": "Moonbeam",
    "1285": "Moonriver",
    "2001": "Milkomeda",
    "4689": "IoTeX",
    "32659": "FSN",
    "42161": "Arbitrum",
    "42220": "CELO",
    "42262": "Oasis(Emerald)",
    "43114": "Avalanche",
    "62621": "MTV",
    "1313161554": "Aurora",
    "1666600000": "Harmony",
};
function chainIdToName(chainId, originalName) {
    return exports.chainNames[chainId] ? exports.chainNames[chainId] : originalName;
}
exports.chainIdToName = chainIdToName;
function nameToChainId(chainName) {
    return Object.keys(exports.chainNames).find((id) => {
        return exports.chainNames[id] === chainName;
    });
}
exports.nameToChainId = nameToChainId;
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
            console.log("expired - fetching new data");
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
exports.DataCache = DataCache;
//# sourceMappingURL=utils.js.map