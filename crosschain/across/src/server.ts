import { adapters } from "./adapters";
import express from "express";

const app = express();

app.get("/v1/crosschain/estimateFee/:adapter", async (req, res) => {
  const { token, srcchain, dstchain, amount } = req.query;
  const { adapter } = req.params;
  if (srcchain && token && dstchain && amount) {
    try {
      const currentAdapter = adapters[adapter];
      if (!currentAdapter) {
        res.json({
          error: `${adapter} not support`,
        });
      }
      const feeInfo = await currentAdapter.estimateFee(
        srcchain as string,
        dstchain as string,
        token as string,
        parseInt(amount as string)
      );
      res.json([
        {
          bridge: adapter,
          dstchain: dstchain,
          dsttoken: token,
          dsttoken_contract: "",
          fee_gasvalue: 0,
          fee_info: feeInfo.breakdown.map((_: any) => [_.name, _.display]),
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
    } catch (e) {
      console.log("failed", e);
      res.json([]);
    }
  }
});

app.listen(8587);

async function generate() {
  await Promise.all([
    adapters.across.generateCSV(),
    adapters.hyphen.generateCSV(),
  ]);
  // await across.generateCSV();
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