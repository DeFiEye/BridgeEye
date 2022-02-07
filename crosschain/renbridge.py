from common import *
x=sess.post("https://lightnode-mainnet.herokuapp.com/", json={"id":1,"jsonrpc":"2.0","method":"ren_queryBlockState","params":{}})
minerfee = {k: int(i["gasCap"])*int(i["gasLimit"])/10**{"FIL":18, "LUNA":6}.get(k, 8) for k, i in x.json()["result"]["state"]["v"].items() if "gasCap" in i}
stat = sess.post("https://stats.renproject.io/", json={"query":"{Snapshot {\n    timestamp\n    locked {\n      asset\n      chain\n      amount\n      amountInUsd\n    }\n  }\n}"}).json()["data"]["Snapshot"]["locked"]

def chain_normalize(name):
    return {"BinanceSmartChain":"BSC", "Avalanche":"AVAX"}.get(name, name)

res = [HEADER]
for i in stat:
    if i["asset"] not in minerfee:
        continue
    res.append(["renbridge", i["asset"], i["asset"], chain_normalize(i["chain"]), "ren"+i["asset"], 
                "", "", "", "", True, minerfee.get(i["asset"], 0), 0.15, 0,0, 0, -1, ""])
#print(res)
writecsv("renbridge.txt", res)