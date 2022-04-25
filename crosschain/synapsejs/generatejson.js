async function dump(){
	let {Bridge, Tokens, ChainId,  Networks} = await import("@synapseprotocol/sdk");
	const fs = require('fs');
	fs.writeFileSync('synapse_data.json', JSON.stringify({"Tokens":Tokens.AllTokens, "ChainId":ChainId, "Networks":Networks}))
}
dump()