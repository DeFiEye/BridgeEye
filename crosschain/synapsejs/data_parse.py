import json, sys
sys.path.append("..")
from common import *
from munch import munchify
data = json.load(open("synapse_data.json"))
data = munchify(data)
available=[]
for name1, n1 in data.Networks.items():
    for name2, n2 in data.Networks.items():
        if name1==name2:
            continue
        for t1 in n1.tokens:
            for t2 in n2.tokens:
                if t1.swapType==t2.swapType:
                    available.append([chainid2name(n1.chainId), t1.symbol, chainid2name(n2.chainId), t2.symbol])
open("synapse_options.json", "w").write(json.dumps(available))
if 0:
    for token in data.Tokens:
        supported_chainids = token.addresses.keys()
        for i in supported_chainids:
            assert chainname2id(chainid2name(i)) == int(i)
            for j in supported_chainids:
                if i!=j:
                    print(token.symbol, chainid2name(i), chainid2name(j))