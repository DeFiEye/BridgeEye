from common import *
from mpms import MPMS
tokens = {}
def query_network(symbol):
    try:
        x = sess.get(f"https://api.binance.org/bridge/api/v2/tokens/{symbol}/networks")
    except:
        x = sess.get(f"https://api.binance.org/bridge/api/v2/tokens/{symbol}/networks")
    return x.json()["data"]["networks"]

def chain_normalize(name):
    return {"ETH":"Ethereum"}.get(name, name)

def handler(meta, networks):
    token = tokens[networks[0]["symbol"]]
    for n1 in networks:
        if not n1["depositEnabled"]:
            continue
        fromcontract = {"ETH": token["ethContractAddress"], "BSC": token["bscContractAddress"]}.get(n1["name"], "")
        for n2 in networks:
            if n1==n2 or not n2["withdrawEnabled"]:
                continue
            tocontract = {"ETH": token["ethContractAddress"], "BSC": token["bscContractAddress"]}.get(n2["name"], "")
            networkfee = n2["networkFee"]
            if n2["name"] in ["BSC", "BNB"]:
                networkfee = 0
            fee_percent = n2["swapFeeRate"]
            minamount = n2["withdrawMinAmount"]
            meta["res"].append(["binancebridge", chain_normalize(n1["name"]), n1["symbol"], chain_normalize(n2["name"]), n2["symbol"], 
                fromcontract, tocontract, "", "", True, networkfee, fee_percent*100, 0,0, minamount, -1, ""])

if __name__ == "__main__":
    tokens = {i["symbol"]:i for i in sess.get("https://api.binance.org/bridge/api/v2/tokens?walletNetwork=").json()["data"]["tokens"]}
    res = [HEADER]
    m = MPMS(query_network, handler, processes=5, threads=2, meta={"res": res})
    m.start()
    for k, v in tokens.items():
        m.put(k)
    m.join()
    writecsv("binancebridge.txt", res)