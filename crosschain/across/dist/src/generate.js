"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapters_1 = require("./adapters");
async function generate() {
    await adapters_1.across.generateCSV();
}
async function runTask() {
    for (let index = 0; index < Infinity; index++) {
        try {
            await generate();
        }
        catch (e) {
            console.log('failed');
        }
        await new Promise((resolve) => {
            setTimeout(resolve, 60 * 1000 * 60);
        });
    }
}
runTask();
//# sourceMappingURL=generate.js.map