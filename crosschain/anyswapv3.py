from common import *
data = sess.get("https://bridgeapi.anyswap.exchange/v3/serverinfoV2?chainId=all&version=all").json()
chainid2tokens = {}
for k, v in data["STABLEV3"].items():
    chainid2tokens.setdefault(int(k), {}).update(v)
for k, v in data["UNDERLYINGV2"].items():
    chainid2tokens.setdefault(int(k), {}).update(v)
alltoken_info = {} #{56: {("USDC address", "anyUSDC holder addr"): ("USDC", 6, "?")}} "?" will be replaced to liquidity
for (chainid, values) in chainid2tokens.items(): #token list from source
    tmp = {}
    for undercontract, detail in values.items():
        u = detail["underlying"]
        #print(detail)
        tmp[undercontract, u["address"] if u else ""] = [detail["symbol"] if "symbol" in detail else u["symbol"], u["decimals"] if u else detail["decimals"], "?"]
    alltoken_info[chainid] = tmp

for (chainid, values) in chainid2tokens.items(): # token list from dest
    for undercontract, detail in values.items():
        for cid, swapinfo in detail["destChains"].items():
            cid = int(cid)
            u = swapinfo["underlying"]
            newitem = [swapinfo["symbol"], u["decimals"] if u else swapinfo["decimals"], "?" ]
            if (swapinfo["address"], u["address"] if u else "") in alltoken_info[cid]:
                if alltoken_info[cid][swapinfo["address"], u["address"] if u else ""] != newitem: # should not be there
                    print("error:", cid, swapinfo["address"], newitem)
            alltoken_info[cid][swapinfo["address"], u["address"] if u else ""] = newitem

def mkslice(datalist, count):
    for i in range(0, len(datalist), count):
        yield datalist[i:i+count]

for chainid, tmp in alltoken_info.items(): # liquidity query
    rpcs = chain2rpcs(chainid)
    if rpcs:
        x=Endpoint_Provider(rpcs)
        datalist = []
        res2idx = []
        for (undercontract, holder), detail in tmp.items():
            if detail[2] and holder and undercontract.startswith("0x"):
                datalist.append([undercontract, "balanceOf(address)", toarg(holder)])
                res2idx.append((undercontract, holder))
        for d in mkslice(datalist, 20):
            for idx, liquidity in enumerate(x.batch_callfunction_decode(datalist, ["uint256"])):
                #print(idx, res2idx[idx], liquidity)
                tmp[res2idx[idx]][-1] = liquidity/10**tmp[res2idx[idx]][1]
    #print(tmp)

res=[HEADER]#["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity"]
for (chainid, values) in chainid2tokens.items():
    for undercontract, detail in values.items():
        for cid, swapinfo in detail["destChains"].items():
            if not swapinfo["underlying"]:
                liquidity = -1  
            else:
                liquidity = alltoken_info[int(cid)][swapinfo["address"], swapinfo["underlying"]["address"] if swapinfo["underlying"] else ""][-1]
            res.append(["anyswapv3", chainid2name(chainid), detail["symbol"] if "symbol" in detail else detail["underlying"]["symbol"], chainid2name(cid), swapinfo["symbol"], 
                undercontract, swapinfo["address"], 
                detail["underlying"]["address"] if detail["underlying"] else "", swapinfo["underlying"]["address"] if swapinfo["underlying"] else "",
                True, 0, swapinfo["SwapFeeRatePerMillion"], swapinfo["MinimumSwapFee"], swapinfo["MaximumSwapFee"], swapinfo["MinimumSwap"], liquidity, "" ])
writecsv("anyswapv3.txt", res)