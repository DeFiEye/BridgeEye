from common import *

NETWORKS = [{'assetId': '0x0000000000000000000000000000000000000000', 'chainName': 'xDai Chain', 'chainId': 100, 'assets': {'DAI': '0x0000000000000000000000000000000000000000', 'USDC': '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83', 'USDT': '0x4ECaBa5870353805a9F068101A40E0f32ed605C6'}}, {'assetId': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 'chainName': 'Matic Mainnet', 'chainId': 137, 'assets': {'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063', 'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', 'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'}}, {'assetId': '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', 'chainName': 'Fantom Mainnet', 'chainId': 250, 'assets': {'DAI': '0x8d11ec38a3eb5e956b052f67da8bdc9bef8abf3e', 'USDC': '0x04068da6c83afcfa0e13ba15a6696662335d5b75', 'USDT': '0x049d68029688eabf473097a2fc38ef61633a3c7a'}}, {'assetId': '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', 'chainName': 'Binance Smart Chain Mainnet', 'chainId': 56, 'assets': {'DAI': '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', 'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', 'USDT': '0x55d398326f99059fF775485246999027B3197955'}}]
HOLDER = "0x558955605424532b2827e1567d845eb22acd5ea6"
liquidity={} #("xDAI", "USDC"): 100.1
decimals = {('xDAI', 'DAI'): 18, ('xDAI', 'USDC'): 6, ('xDAI', 'USDT'): 6, ('Polygon', 'DAI'): 18, ('Polygon', 'USDC'): 6, ('Polygon', 'USDT'): 6, ('Fantom', 'DAI'): 18, ('Fantom', 'USDC'): 6, ('Fantom', 'USDT'): 6, ('BSC', 'DAI'): 18, ('BSC', 'USDC'): 18, ('BSC', 'USDT'): 18}
if 0:
    for chain in NETWORKS:
        rpcs = chain2rpcs(chain["chainId"])
        assert rpcs is not None
        x=Endpoint_Provider(rpcs)
        chainname = chainid2name(chain["chainId"])
        datalist = []
        idx2name = {}
        idx = 0
        for name, addr in chain["assets"].items():
            if addr!="0x0000000000000000000000000000000000000000":
                datalist.append([addr, "decimals()", ""])
                idx2name[idx] = name
                idx += 1
            else:
                decimals[chainname, name] = 18
        for idx, d in enumerate(x.batch_callfunction_decode(datalist, ["uint256"])):
            decimals[chainname, idx2name[idx]] = d
    print(decimals)

for chain in NETWORKS:
    rpcs = chain2rpcs(chain["chainId"])
    assert rpcs is not None
    x=Endpoint_Provider(rpcs)
    chainname = chainid2name(chain["chainId"])
    datalist = []
    idx2name = {}
    idx = 0
    for name, addr in chain["assets"].items():
        if addr!="0x0000000000000000000000000000000000000000":
            datalist.append([addr, "balanceOf(address)", toarg(HOLDER)])
            idx2name[idx] = name
            idx += 1
        else:
            liquidity[chainname, name] = x.eth_balanceOf(HOLDER)/10**18
    for idx, bal in enumerate(x.batch_callfunction_decode(datalist, ["uint256"])):
        liquidity[chainname, idx2name[idx]] = bal/10**decimals[chainname, idx2name[idx]]
#print(liquidity)

res=[HEADER]
for c1 in NETWORKS:
    for c2 in NETWORKS:
        if c1==c2:
            continue
        c1name, c2name = chainid2name(c1["chainId"]), chainid2name(c2["chainId"])
        for srctoken, srctoken_contract in c1["assets"].items():
            dsttoken = srctoken
            dsttoken_contract = c2["assets"][dsttoken]
            l = liquidity[c2name, dsttoken]
            res.append(["xpollinatev1", c1name, srctoken, c2name, dsttoken, srctoken_contract, dsttoken_contract, HOLDER, HOLDER, True, 0, 0.05, 0, -1, 0, l, ""])
writecsv("xpollinatev1.txt", res)