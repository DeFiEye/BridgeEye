"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adapters_1 = require("./adapters");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
app.get("/v1/crosschain/estimateFee/:adapter", async (req, res) => {
    const { token, srcchain, dstchain, amount } = req.query;
    const { adapter } = req.params;
    if (srcchain && token && dstchain && amount) {
        try {
            const currentAdapter = adapters_1.adapters[adapter];
            if (!currentAdapter) {
                return res.json({
                    error: `${adapter} not support`,
                });
            }
            const result = await new Promise((resolve, reject) => {
                (async () => {
                    try {
                        const feeInfo = await currentAdapter.estimateFee(srcchain, dstchain, token, parseInt(amount));
                        resolve([
                            {
                                bridge: adapter,
                                dstchain: dstchain,
                                dsttoken: feeInfo.outputToken ? feeInfo.outputToken.symbol : token,
                                dsttoken_contract: feeInfo.outputToken
                                    ? feeInfo.outputToken.mainnetAddress
                                    : feeInfo.token.mainnetAddress,
                                fee_gasvalue: 0,
                                fee_info: feeInfo.breakdown.map((_) => [_.name, _.display]),
                                fee_status: "ok",
                                received: parseFloat(feeInfo.output),
                                srcchain: srcchain,
                                srctoken: token,
                                srctoken_contract: feeInfo.token.mainnetAddress,
                                stat_info: "",
                                time_info: "",
                                total_fee: feeInfo.feeDisplay,
                            },
                        ]);
                    }
                    catch (e) {
                        reject(e);
                    }
                })();
                setTimeout(() => {
                    reject('timeout');
                }, 15 * 1000);
            });
            res.json(result);
        }
        catch (e) {
            console.log("failed", e);
            res.json([]);
        }
    }
});
app.listen(8587);
async function generate() {
    await Promise.all([
        adapters_1.adapters.across.generateCSV(),
        adapters_1.adapters.hyphen.generateCSV(),
        adapters_1.adapters.multichain.generateCSV(),
        adapters_1.adapters.relay.generateCSV(),
    ]);
}
async function runTask() {
    for (let index = 0; index < Infinity; index++) {
        try {
            await generate();
        }
        catch (e) {
            console.log("failed", e);
        }
        await new Promise((resolve) => {
            setTimeout(resolve, 60 * 1000 * 60);
        });
    }
}
runTask();
//# sourceMappingURL=server.js.map