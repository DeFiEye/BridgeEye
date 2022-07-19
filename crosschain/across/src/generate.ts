import { across } from "./adapters";

async function generate() {
   await across.generateCSV()
}

async function runTask() {
    for (let index = 0; index < Infinity; index++) {
        try {
            await generate();
        } catch(e) {
            console.log('failed')
        }
        await new Promise((resolve) => {
            setTimeout(resolve, 60 * 1000 * 60);
        })
    }
}

runTask();