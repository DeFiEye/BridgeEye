from common import *
x = chain2provider("Ethereum")

#https://github.com/across-protocol/across-frontend/blob/master/src/utils/constants.ts#L82-L115
ARB2ETH = { #name: [token address, pool address, decimals, bar, r0, r1, r2] #bar=65 means 65% utilization ratio, r1=8 means 8% apy
    "ETH": ["", "0x7355Efc63Ae731f584380a9838292c7046c1e433", 18, 65, 0, 8, 100],
    "USDC": ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "0x256C8919CE1AB0e33974CF6AA9c71561Ef3017b6", 6, 80, 0, 4, 60],
}
DISCOUNT = 25
#https://github.com/UMAprotocol/protocol/blob/master/packages/sdk/src/across/constants.ts
SLOW_ETH_GAS = 243177
SLOW_ERC_GAS = 250939
SLOW_UMA_GAS = 273955
FAST_ETH_GAS = 273519
FAST_ERC_GAS = 281242
FAST_UMA_GAS = 305572

def ratio2apy(ratio, bar, r0, r1, r2):
    apy = r0
    if ratio<=bar:
        apy += ratio*r1/bar
    else:
        apy += r1 + (ratio-bar)*r2/(100-bar)
    return apy

def apy2week(apy):
    return 100*( (1+apy/100)**(1/52)-1 )

def ratiochange2apy(ratio1, ratio2, bar, r0, r1, r2):
    apy = r0
    assert ratio1<ratio2, "wrong ratio"
    k1 = r1/bar #y = k1*x
    k2 = r2/(100-bar) #y = r1 + k2*(x-bar)
    if ratio2<=bar:
        apy += k1*(ratio1+ratio2)/2
    elif ratio1>=bar:
        apy += r1 + k2*(ratio1-bar+ratio2-bar)/2
    else:
        area1 = (k1*ratio1 + r1)*(bar-ratio1)/2
        area2 = (r1 + r1 + k2*(ratio2-bar))*(ratio2-bar)/2
        apy += (area1+area2)/(ratio2-ratio1)
    return apy

@lru_cache()
def acrossto_query(srcchain, dstchain, name, amount, _ts):
    assert srcchain == "Arbitrum"
    assert dstchain == "Ethereum"
    coinprice = {i:j["eth"] for i,j in sess.get("https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses="+",".join(i[0] for i in ARB2ETH.values() if i[0])+"&vs_currencies=eth").json().items()}
    gasprice = x.eth_gasPrice()
    token_address, Pool, decimals, bar, r0, r1, r2 = ARB2ETH[name]
    callres0, u,p,l = x.batch_callfunction_decode([
        [Pool, "getLiquidityUtilization(uint256)", toarg(int(amount*10**decimals))], 
        [Pool, "utilizedReserves()", ""], 
        [Pool, "pendingReserves()", ""], 
        [Pool, "liquidReserves()", ""]
    ], [["uint256", "uint256"], ["uint256"], ["uint256"], ["uint256"]])
    ratio1, ratio2 = [100*i/10**18 for i in callres0]
    
    gasamount = {"ETH":FAST_ETH_GAS, "UMA":FAST_UMA_GAS}.get(name, FAST_ERC_GAS)
    gastoken = gaseth = gasamount*gasprice/10**18 *(1-DISCOUNT/100)
    if name!="ETH":
        gastoken = gaseth/coinprice[token_address]
    fee_lp_percent = apy2week(ratiochange2apy(ratio1, ratio2, bar, r0, r1, r2))
    fee_lp = fee_lp_percent/100 * amount
    outvalue = amount - gastoken - fee_lp
    liquidity = (l-p)/10**decimals
    return outvalue, gastoken, fee_lp, gasprice/10**9, fee_lp_percent, liquidity

def main():
    coinprice = {i:j["eth"] for i,j in sess.get("https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses="+",".join(i[0] for i in ARB2ETH.values() if i[0])+"&vs_currencies=eth").json().items()}
    gasprice = x.eth_gasPrice()
    res = []
    for name, (token_address, Pool, decimals, bar, r0, r1, r2) in ARB2ETH.items():
        u,p,l=x.batch_callfunction_decode([[Pool, "utilizedReserves()", ""], [Pool, "pendingReserves()", ""], [Pool, "liquidReserves()", ""]], ["uint256"])
        ratio = 100*(u+p)/(u+l)
        liquidity = l-p
        print(name, "%.2f%%"%(ratio), liquidity/10**decimals)
        apy = ratio2apy(ratio, bar, r0, r1, r2)
        lpfee_percent = apy2week(apy)
        print("%.2f%%"%lpfee_percent)
        gasamount = {"ETH":FAST_ETH_GAS, "UMA":FAST_UMA_GAS}.get(name, FAST_ERC_GAS)
        gastoken = gaseth = gasamount*gasprice/10**18 *(1-DISCOUNT/100)
        if name!="ETH":
            gastoken = gaseth/coinprice[token_address]
        print("gastoken:", gastoken)
        
        if name=="ETH":
            amount = 10
        elif name=="USDC":
            amount = 1000
        ratio1 = 100*(u+p)/(u+l)
        ratio2 = 100*(u+p+amount*10**decimals)/(u+l)
        outvalue = amount - gastoken - apy2week(ratiochange2apy(ratio1, ratio2, bar, r0, r1, r2))/100 * amount
        print(f"{amount} {name} get: {outvalue}")
        res.append({"from":"Arbitrum", "to":"Ethereum", "name":name, "token_address":token_address, "liquidity":liquidity/10**decimals, "decimals":decimals, 
            "fee_gas": gastoken, "fee_lp": lpfee_percent/100, 
            "pool_used":(u+p)/10**decimals, "pool_total":(u+l)/10**decimals, 
            "gasprice":gasprice/10**9, 
            "feerate":[bar, r0, r1, r2],
        })
    open("acrossto.json", "w").write(json.dumps(res))

if __name__ == "__main__":
    main()