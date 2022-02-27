from common import *
data = json.load(open("orbiter.json")) #copy from https://www.orbiter.finance/static/js/app.ce6f5863.js and using demjson.decode and json.dumps

def chainname(c):
    return {"mainnet":"Ethereum", "arbitrum":"Arbitrum", "optimism":"Optimism", "polygon":"Polygon", "zksync":"zkSync"}.get(c,c)

res = [HEADER]
for i in data:
    print(chainname(i["c1Name"]), chainname(i["c2Name"]))
    #["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity"]
    res.append(["Orbiter", chainname(i["c1Name"]), i["tName"], chainname(i["c2Name"]), i["tName"],
        i["t1Address"], i["t2Address"], i["makerAddress"], i["makerAddress"],
        True, i["c1TradingFee"], i["c1GasFee"]/10, 0, 0, i["c1MinPrice"], i["c1MaxPrice"],
        ""
    ])
    res.append(["Orbiter", chainname(i["c2Name"]), i["tName"], chainname(i["c1Name"]), i["tName"],
        i["t2Address"], i["t1Address"], i["makerAddress"], i["makerAddress"],
        True, i["c2TradingFee"], i["c2GasFee"]/10, 0, 0, i["c2MinPrice"], i["c2MaxPrice"],
        ""
    ])
writecsv("orbiter.txt", res)