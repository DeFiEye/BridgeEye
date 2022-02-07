from common import *
data = getsess().get("https://allbridgeapi.net/token-info").json()
chain2tokens = {i: j["tokens"] for i,j in data.items()}

def tokenid(token):
    return token["tokenSource"]+"_"+token["tokenSourceAddress"]

LIQUIDITY = {}

def fetch_liquidity(chain, tokenSource, tokenSourceAddress):
    x = getsess().get(f"https://allbridgeapi.net/check/{chain}/balance/{tokenSource}/{tokenSourceAddress}")
    return chain, tokenSource, tokenSourceAddress, float(x.json()["balance"])

def handler_liquidity(meta, res):
    global LIQUIDITY
    chain, tokenSource, tokenSourceAddress, liquidity = res
    LIQUIDITY[(chain, tokenSource, tokenSourceAddress)] = liquidity

def chainname(c):
    return {"AVA":"AVAX", "ETH":"Ethereum", "POL":"Polygon", "SOL":"Solana"}.get(c,c)
if __name__ == "__main__":
    m = MPMS(fetch_liquidity, handler_liquidity, processes=4, threads=5)
    m.start()
    for chain, tokens in chain2tokens.items():
        for t in tokens:
            tokenSource, tokenSourceAddress = t["tokenSource"], t["tokenSourceAddress"]
            if t["isWrapped"]:
                LIQUIDITY[(chain, tokenSource, tokenSourceAddress)] = -1
            else:
                m.put(chain, tokenSource, tokenSourceAddress)
    m.join()
    res = [HEADER]
    for chain1, tokens1 in chain2tokens.items():
        for token1 in tokens1:
            for chain2, tokens2 in chain2tokens.items():
                if chain1 == chain2:
                    continue
                for token2 in tokens2:
                    if tokenid(token1) == tokenid(token2):
                        #print(chain1, chain2, token1["symbol"], token2["symbol"])
                        #print(token2)
                        #["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity"]
                        res.append(["allbridge", chainname(chain1), token1["symbol"], chainname(chain2), token2["symbol"], 
                            token1["address"], token2["address"], "", "", 
                            True, int(token1["minFee"])/10**token1["precision"], 0, 0, 0, 0, LIQUIDITY[(chain1, token1["tokenSource"], token1["tokenSourceAddress"])], ""])
    #pprint(res)
    writecsv("allbridge.txt", res)