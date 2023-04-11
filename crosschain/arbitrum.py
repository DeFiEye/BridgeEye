from common import *
import json
import os, time
res = [HEADER]  
known = set()
for url in ["https://tokenlist.arbitrum.io/ArbTokenLists/arbitrum_token_token_list.json", "https://tokenlist.arbitrum.io/ArbTokenLists/arbed_arb_whitelist_era.json", "https://tokenlist.arbitrum.io/ArbTokenLists/arbed_uniswap_labs_default.json"]:
    tokenlist = sess.get(url).json()
    tokens = {(i["symbol"], i["chainId"]):i for i in tokenlist["tokens"]}
    for (symbol, chainid), info in tokens.items():
        if chainid==1 and (symbol, 42161) in tokens and symbol not in known:
            # ["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
            eth_info = info
            arb_info = tokens[(symbol, 42161)]
            bri =  arb_info["extensions"]["bridgeInfo"]
            #0.0005eth
            res.append(["arbitrum", "Ethereum", symbol, "Arbitrum", symbol, eth_info["address"], arb_info["address"], bri['1']["destBridgeAddress"], "", True, 0, 0, 0, 0, 0, 0, json.dumps({"nativeGasToken":{"ETH":500000000000000}})]) 
            res.append(["arbitrum", "Arbitrum", symbol, "Ethereum", symbol, arb_info["address"], eth_info["address"], "", bri['1']["destBridgeAddress"], True, 0, 0, 0, 0, 0, 0, ""])
            known.add(symbol)
writecsv("arbitrum.txt", res)