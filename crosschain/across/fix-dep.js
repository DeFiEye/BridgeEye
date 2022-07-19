const fs = require("fs");

const codeFile = `./node_modules/@uma/sdk/dist/node/index.cjs.development.js`;
const content = fs.readFileSync(codeFile, 'utf-8');

const fixedCode = content
  .replace(
    "getV1OptimisticOracleInterfaceAbi",
    "getOptimisticOracleInterfaceAbi"
  )
  .replace(
    "V1OptimisticOracleInterfaceEthers__factory",
    "OptimisticOracleInterfaceEthers__factory"
  );


fs.writeFileSync(codeFile, fixedCode);

// const Factory = V1OptimisticOracleInterfaceEthers__factory;
// function connect$a(address, provider) {
//   return Factory$a.connect(address, provider);
// }
// const contractInterface = /*#__PURE__*/ new ethers$1.utils.Interface(
//   /*#__PURE__*/ rateModelStore.getOptimisticOracleInterfaceAbi()
// );