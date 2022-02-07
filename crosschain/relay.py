from common import *
CHAINS=sess.get("https://relay-api-33e56.ondigitalocean.app/api/crosschain-config").json()
res = [HEADER]
for c1 in CHAINS:
    cid = c1["chainId"]
    name = chainid2name(c1["networkId"])
    print(cid, name)
    rpcs = chain2rpcs(c1["networkId"])
    if not rpcs:
        print("no such rpc???")
        continue
    x=Endpoint_Provider(rpcs)
    ids = []
    for c2 in CHAINS:
        if c1==c2:
            continue
        ids.append(c2["chainId"])
    if name == "CRO":
        feeres = []
        for i in ids:
            feeres.append(callfunction("https://evm-cronos.crypto.org/", c1["bridgeAddress"], "_fees(uint8)", toarg(i)))
    else:
        feeres = x.batch_callfunction_decode([[c1["bridgeAddress"], "_fees(uint8)", toarg(i)] for i in ids], ["uint256"])
    dstid2fee = dict(zip(ids, feeres))
    for token1 in c1["tokens"]:
        for c2 in CHAINS:
            if c1==c2:
                continue
            for token2 in c2["tokens"]:
                if token1["resourceId"]!=token2["resourceId"]:
                    continue
                #["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
                res.append(["relay", chainid2name(c1["networkId"]), token1["symbol"], chainid2name(c2["networkId"]), token2["symbol"], token1["address"], token2["address"], "", "", True, 0,0,0,0,0,0, json.dumps({"nativeFee":[dstid2fee[c2["chainId"]]/10**18, c1["nativeTokenSymbol"]]})])
writecsv("relay.txt", res)