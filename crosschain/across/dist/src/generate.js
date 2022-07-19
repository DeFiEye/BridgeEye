"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adapters_1 = require("./adapters");
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
async function generate() {
    await adapters_1.across.generateCSV();
}
async function runTask() {
    for (let index = 0; index < Infinity; index++) {
        try {
            await generate();
        }
        catch (e) {
            console.log("failed");
        }
        await new Promise((resolve) => {
            setTimeout(resolve, 60 * 1000 * 60);
        });
    }
}
runTask();
app.get("/v1/crosschain/estimateFee/across", async (req, res) => {
    const { token, srcchain, dstchain, amount } = req.query;
    if (srcchain && token && dstchain && amount) {
        const feeInfo = await adapters_1.across.estimateFee(srcchain, dstchain, token, parseInt(amount));
        res.json([
            {
                bridge: "across",
                dstchain: dstchain,
                dsttoken: token,
                dsttoken_contract: "",
                fee_gasvalue: 0,
                fee_info: feeInfo.breakdown.map((_) => [_.name, _.display]),
                fee_status: "ok",
                received: parseFloat(feeInfo.output),
                srcchain: srcchain,
                srctoken: token,
                srctoken_contract: "",
                stat_info: "",
                time_info: "",
                total_fee: feeInfo.feeDisplay,
            },
        ]);
    }
});
app.listen(8587);
// v1/crosschain/estimateFee/cbridge
//# sourceMappingURL=generate.js.map