from common import *

res=[HEADER]
#liquidityinfo = {(i["chainId"], i["DelegateToken"].lower()):i for i in sess.get("https://netapi.anyswap.net/bridge/v2/info").json()["bridgeList"] if  i["DelegateToken"]!=""}
for _, data in sess.get("https://bridgeapi.anyswap.exchange/v2/serverInfoFull/all").json().items():
    for id, d in data.items():
        src_, dst_ = d["SrcToken"], d["DestToken"]
        if d["symbol"]=="FTM":#fix for FTM delegation
            src_["Symbol"] = dst_["Symbol"] = "FTM"
            dst_["ContractAddress"] = "0x4e15361fd6b4bb609fa63c81a2be19d873717870"
            dst_["DcrmAddress"] = "0x5cbe98480a790554403694b98bff71a525907f5d"
        for src, dst in [[src_,dst_], [dst_,src_]]:
            srcchain, dstchain = chainid2name(d["srcChainID"]), chainid2name(d["destChainID"])
            if src==dst_:
                srcchain, dstchain = dstchain, srcchain
            srctoken, dsttoken = src["Symbol"], dst["Symbol"]
            srctoken_contract, dsttoken_contract = src.get("ContractAddress", "0"), dst.get("ContractAddress", "0")
            srcholder, dstholder = src["DcrmAddress"], dst["DcrmAddress"]
            isopen = not src["DisableSwap"]
            fee_percent = src["SwapFeeRate"]*100
            fee_minfee = src["MinimumSwapFee"]
            fee_maxfee = src["MaximumSwapFee"]
            minamount = src["MinimumSwap"]
            #lkey = (d["destChainID"], dsttoken_contract.lower())
            #if lkey in liquidityinfo:
            #    info = liquidityinfo[lkey]
            #    liquidity = int(info["balance"])/10**info["decimals"]
            if dsttoken == "FTM" and dstchain in ["ETH", "FTM"]:
                if dstchain == "ETH":
                    liquidity = Endpoint_Provider(chain2rpcs("ETH")).erc20_balanceOf("0x4e15361fd6b4bb609fa63c81a2be19d873717870", "0x5cbe98480a790554403694b98bff71a525907f5d")/10**18
                else:
                    liquidity = Endpoint_Provider(chain2rpcs("FTM")).eth_balanceOf("0xE3e0C14bbCBF86b3Ff60E8666C070d34b84F3f73")/10**18
            else:
                liquidity = -1
            if srcchain=="8545" or dstchain=="8545":
                continue
            res.append(["anyswapv2", srcchain, srctoken, dstchain, dsttoken, srctoken_contract, dsttoken_contract, srcholder,  dstholder, isopen, 0, fee_percent, fee_minfee, fee_maxfee, minamount, liquidity, ""])

writecsv("anyswapv2.txt", res)