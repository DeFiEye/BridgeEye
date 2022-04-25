const express = require('express');
const bodyParser = require('body-parser')
async function start(srcid, srctoken, dstid, dsttoken, amount, res) {
	let {Bridge, Tokens, ChainId,  Networks} = await import("@synapseprotocol/sdk");
	let {JsonRpcProvider} = await import("@ethersproject/providers");
	let {parseUnits, formatUnits}  = await import( "@ethersproject/units");

	const SYNAPSE_BRIDGE = new Bridge.SynapseBridge({
	    network:  Networks.supportedNetworks().find(i=>i.chainId==srcid),
	});
	const
	    TOKEN_IN   = Tokens.AllTokens.find(i=>i.symbol==srctoken),
	    TOKEN_OUT  = Tokens.AllTokens.find(i=>i.symbol==dsttoken),
	    CHAIN_OUT  = dstid,
	    INPUT_AMOUNT = parseUnits(amount, TOKEN_IN.decimals(srcid));
	    
	SYNAPSE_BRIDGE.estimateBridgeTokenOutput({
	        tokenFrom:  TOKEN_IN,      // token to send from the source chain, in this case USDT on Avalanche
	        chainIdTo:  CHAIN_OUT,     // Chain ID of the destination chain, in this case BSC
	        tokenTo:    TOKEN_OUT,     // Token to be received on the destination chain, in this case USDC
	        amountFrom: INPUT_AMOUNT,
	}).then(({ amountToReceive, bridgeFee }) => {
		let amountOutFormatted = formatUnits(
		    amountToReceive,
		    TOKEN_OUT.decimals(CHAIN_OUT)
		);
		res.json([amountOutFormatted, formatUnits(bridgeFee, 18)])
		console.log(amountOutFormatted);
	}).catch(err => res.status(500).send('error'));;
}
var app = express();
const PORT = 3000;
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }))
app.post("/", async function(req, res){
	const {srcchainid, srctoken, dstchainid, dsttoken, amount} = req.body
	//start(43114, "USDC", 56, "DAI", "1000")
	console.log(parseInt(srcchainid), srctoken, parseInt(dstchainid), dsttoken, amount);
	try{
		await start(parseInt(srcchainid), srctoken, parseInt(dstchainid), dsttoken, amount, res);
	}catch{
		res.status(500).send('error');
	}
})
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send(err);
});
app.listen(PORT, function (){ 
    console.log('Listening on Port 3000');
});  
