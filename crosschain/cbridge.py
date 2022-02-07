from common import *
from mpms import MPMS
def query_fee(fromchain, tochain, token, amount):
    sess = getsess()
    d = sess.post('https://cbridge-prod2.celer.network/v2/estimateAmt', data={"src_chain_id":fromchain,"dst_chain_id":tochain,"token_symbol":token,"amt":str(amount), "slippage_tolerance":500}).json()
    #feeAmount, fromChainTokenAddr, toChainTokenAddr, relayNodeAddr, toChainRelayNodeBalance
    return fromchain, tochain, token, d

FEE={}
DECIMALS = {}
TOKEN2CONTRACT = {}
def fee_logger(meta, res):
    fromchain, tochain, token, d = res
    if d['err']:
        print(fromchain, "->", tochain, token, d['err'], sep="\t")
        return
    basefee =  D(d["base_fee"])/10**DECIMALS[(token, tochain)]
    percentfee = round(int(d['perc_fee'])/int(d['eq_value_token_amt']), 4)
    FEE[(fromchain, tochain, token)] = [basefee, percentfee]
    print((fromchain, tochain, token), basefee, percentfee)

if __name__ == "__main__":
    conf = sess.get("https://cbridge-prod2.celer.network/v2/getTransferConfigs").json()
    assert conf["err"] == None
    #for k, v in sorted(chainfees.items()):
    #    print("%10s"%chainid2name(k), min(i[1] for i in v)*100, max(i[1] for i in v)*100, sep="\t")
    m = MPMS(query_fee, fee_logger, processes=2, threads=2, task_queue_maxsize=4)
    m.start()
    seen = set()
    for c1 in conf["chains"]:
        chain1 = c1["id"]
        tokens1 = conf["chain_token"][str(chain1)]["token"]
        for t1 in tokens1:
            t1 = t1["token"]
            TOKEN2CONTRACT[(chain1, t1["symbol"])] = t1["address"]
            for c2 in conf["chains"]:
                chain2 = c2["id"]
                tokens2 = conf["chain_token"][str(chain2)]["token"]
                if chain1 == chain2:
                    continue
                for t2 in tokens2:
                    t2 = t2["token"]
                    if t1["symbol"]==t2["symbol"]:
                        key = (chain2, t2["symbol"])
                        if key in seen:
                            pass
                            #continue
                        seen.add(key)
                        #print(chain1, chain2, t1["symbol"], t1["decimal"], t2["symbol"], t2["decimal"])
                        DECIMALS[(t1["symbol"], chain1)]=t1["decimal"]
                        DECIMALS[(t2["symbol"], chain2)]=t2["decimal"]
                        m.put(chain1, chain2, t1["symbol"], (D("1") if t1["symbol"] in ["ETH", "WETH", "WBTC"] else 10)*10**t1["decimal"])
                        #sleep(1)
    m.join()
    res = [HEADER]
    for k in FEE:
        fromchain, tochain, token = k
        
        #["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen",
        #    "fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity"]
        res.append(["cbridge", chainid2name(fromchain), token, chainid2name(tochain), token, TOKEN2CONTRACT[fromchain, token], TOKEN2CONTRACT[tochain, token], "", "", True, 
            FEE[k][0], FEE[k][1]*100, 0,0,0, 0, ""])
        #print(fromchain, tochain, token, fee_percent, FEE_FIXED[k], liquidity)
    #for chainid, nodefees in chainfees.items():
    #    for nodeaddr, feepercent in nodefees:
    #        for t in tokenlist[chainid]:
    #            print(chainid, nodeaddr, feepercent, t["symbol"], t, LIQUIDITY.get((chainid,t["symbol"]), {}).get(nodeaddr))
    writecsv("cbridge.txt", res)