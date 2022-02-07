import csv
from common import *
from SECRET import CEX_DATASOURCE
open("cex.csv", "wb").write(sess.get(CEX_DATASOURCE).content)
r = csv.reader(open("cex.csv"))
title = next(r)
data_from = {}
data_to = {}
for line in r:
    cex, token, chain, can_deposit, _, can_withdraw, withdraw_fee, withdraw_min, _, _, _ = line
    if can_deposit=="True":
        data_from.setdefault((cex,token), []).append(chain)
    if can_withdraw=="True":
        data_to.setdefault((cex,token), []).append([chain, withdraw_fee, withdraw_min])

def normalize_chainname(n):
    if n in ALLOWED_CHAINS:
        return n
    return {"以太坊 ETH ERC20":"Ethereum", "币安智能链 BSC BEP20":"BSC", "币安链 BNB BEP2":"BEP2", "库币社区链 KCC":"KCC",
        "欧易 OEC OKExChain":"OEC", "波场 TRX TRC20":"TRX", "火币生态链 HECO HRC20":"HECO", "雪崩 Avalanche C链":"Avalanche",
        "马蹄 MATIC Polygon":"Polygon", "xDai":"xDAI", "XDAI":"xDAI", "FTM":"Fantom", "MOVR":"Moonriver","IOTX":"IoTeX",
        "Fusion":"FSN", "fusion":"FSN","FSN1":"FSN",
        "SOL":"Solana"
    }.get(n,None)
    
res = []
for (cex,token), chain1s in data_from.items():
    for chain1 in chain1s:
        for chain2, withdraw_fee, withdraw_min in data_to.get((cex,token), []):
            if chain1==chain2:
                continue
            c1 = normalize_chainname(chain1)
            c2 = normalize_chainname(chain2)
            if not c1 or not c2:
                continue
            #bridge,srcchain,srctoken,dstchain,dsttoken,srctoken_contract,dsttoken_contract,srcholder,dstholder,isopen,fee_fixed,fee_percent,fee_minfee,fee_maxfee,minamount,liquidity
            res.append([cex.split()[0], c1, token, c2, token, "", "", "", "", True, withdraw_fee, 0, 0, 0, withdraw_min, 0, ""])
writecsv("cex.txt", res)