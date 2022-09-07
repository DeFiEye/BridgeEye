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
        return res.json({
          error: `${adapter} not support`,
        });
      }

      const result = await new Promise((resolve, reject) => {
        (async () => {
          try {
            const feeInfo = await currentAdapter.estimateFee(
              srcchain as string,
              dstchain as string,
              token as string,
              parseInt(amount as string)
            );
            resolve([
              {
                bridge: adapter,
                dstchain: dstchain,
                dsttoken: feeInfo.outputToken ? feeInfo.outputToken.symbol : token,
                dsttoken_contract: feeInfo.outputToken
                  ? feeInfo.outputToken.mainnetAddress
                  : feeInfo.token.mainnetAddress,
                fee_gasvalue: 0,
                fee_info: feeInfo.breakdown.map((_: any) => [_.name, _.display]),
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
          } catch(e) {
            reject(e)
          }
        })();
        setTimeout(() => {
          reject('timeout')
        }, 15 * 1000);
      })
      res.json(result)
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
    adapters.multichain.generateCSV(),
    adapters.relay.generateCSV(),
  ]);
}

async function runTask() {
  for (let index = 0; index < Infinity; index++) {
    try {
      await generate();
    } catch (e) {
      console.log("failed", e);
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 60 * 1000 * 60);
    });
  }
}

runTask();