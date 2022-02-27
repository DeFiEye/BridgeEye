const { Hop,Chain } = require('@hop-protocol/sdk');
const hop = new Hop('mainnet');
const argv = process.argv.slice(2);
const bridge = hop.bridge(argv[0]);

async function run() {
	x = await bridge.getSendData(argv[1], Chain.fromSlug(argv[2]), Chain.fromSlug(argv[3]));
	out = {}
	for (const [key, value] of Object.entries(x)) {
	  out[key] = value.toString()
	}
	console.log(JSON.stringify(out));
}

if(argv[0]=='info'){
	console.log(JSON.stringify(bridge.addresses));
}else if(argv[0]=='chains'){
	console.log(JSON.stringify(bridge.chains));
}else{
	run()
}
