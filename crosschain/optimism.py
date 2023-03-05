from common import *
import json
import os, time
tokenlist = sess.get("https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json").json()
tokens = {(i["symbol"], i["chainId"]):i for i in tokenlist["tokens"]}
res = [HEADER]  
for (symbol, chainid), info in tokens.items():
    if chainid==1 and (symbol, 10) in tokens:
        # ["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
        eth_info = info
        op_info = tokens[(symbol, 10)]
        if "optimismBridgeAddress" not in eth_info["extensions"]:
            continue
        res.append(["optimism", "Ethereum", symbol, "Optimism", symbol, eth_info["address"], op_info["address"], eth_info["extensions"]["optimismBridgeAddress"], "", True, 0, 0, 0, 0, 0, 0, ""])
        res.append(["optimism", "Optimism", symbol, "Ethereum", symbol, op_info["address"], eth_info["address"], "", eth_info["extensions"]["optimismBridgeAddress"], True, 0, 0, 0, 0, 0, 0, ""])
writecsv("optimism.txt", res)