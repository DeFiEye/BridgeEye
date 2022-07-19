import { across } from "./adapters";
import express from "express";

const app = express();

async function generate() {
  await across.generateCSV();
}

async function runTask() {
  for (let index = 0; index < Infinity; index++) {
    try {
      await generate();
    } catch (e) {
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
    const feeInfo = await across.estimateFee(
      srcchain as string,
      dstchain as string,
      token as string,
      parseInt(amount as string)
    );
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
