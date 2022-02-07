from common import *
holder = {
        "Ethereum": 'terra13yxhrk08qvdf5zdc9ss5mwsg5sf7zva9xrgwgc',
        "BSC": 'terra1g6llg3zed35nd3mh9zx6n64tfw3z67w2c48tn2',
        "Harmony": 'terra1rtn03a9l3qsc0a9verxwj00afs93mlm0yr7chk',
}

#{terra1afdz4l9vsqddwmjqxmel99atu4rwscpfjm4yfp: ["uusd", "terra1w7zgkcyt7y4zpct9dw8mw362ywvdlydnum2awa"]}
pairs = sess.get("https://assets.terra.money/cw20/pairs.json").json()["mainnet"] 

#{terra1aa00lpfexyycedfg5k2p60l9djcmw0ue5l8fhc: {
    #icon: "https://whitelist.mirror.finance/icon/SPY.png"
    #name: "SPDR S&P 500"
    #protocol: "Mirror"
    #symbol: "mSPY"
    #token: "terra1aa00lpfexyycedfg5k2p60l9djcmw0ue5l8fhc"
#} #ONLY CW20 tokens
tokens = sess.get("https://assets.terra.money/cw20/tokens.json").json()["mainnet"]

#{terra1cc3enj9qgchlrj34cnzhwuclc4vl2z3jl7tkqg: "0xEdb0414627E6f1e3F082DE65cD4F9C693D78CCA9"}
ethtokens = sess.get("https://assets.terra.money/shuttle/eth.json").json()["mainnet"] 

#{uusd: "0x23396cF899Ca06c4472205fC903bDB4de249D6fC"}
bsctokens = sess.get("https://assets.terra.money/shuttle/bsc.json").json()["mainnet"] 

#uusd: "0x224e64ec1BDce3870a6a6c777eDd450454068FEC"
hmytokens = sess.get("https://assets.terra.money/shuttle/hmy.json").json()["mainnet"]

#{"ucny":251.8623}
oracle = {i["Denom"]:float(i["Amount"]) for i in sess.post("https://mantle.terra.dev/", json={"query":"\nquery {\n    OracleDenomsExchangeRates {\n      Height\n      Result {\n        Amount\n        Denom\n      }\n    }\n  }\n  "}, headers={ "Accept":"application/json"}).json()["data"]["OracleDenomsExchangeRates"]["Result"]}
lunaprice = oracle["uusd"] #39.2784
TOKENPRICE = {"uusd":1, "uluna":lunaprice}
for name, value in oracle.items():
    TOKENPRICE[name] = value/lunaprice

pairquery = "\n  query {\n"
for paircontract, (denom, t) in pairs.items():
    if denom!="uusd":
        continue
    if not t.startswith("terra"):
        continue
    pairquery += "CONTRACT: WasmContractsContractAddressStore(\n            ContractAddress: \"CONTRACT\"\n            QueryMsg: \"{\\\"pool\\\":{}}\"\n        ) {\n            Height\n            Result\n        },".replace("CONTRACT", paircontract)
pairquery = pairquery[:-1]+'\n  }'
x = sess.post("https://mantle.terra.dev/", json={"query":pairquery},headers={ "Accept":"application/json"})
for paircontract, infotext in x.json()["data"].items():
    assets = json.loads(infotext["Result"])["assets"]
    usdinfo = [i for i in assets if "native_token" in i["info"] and i["info"]["native_token"]["denom"]=="uusd"][0]
    tokeninfo = [i for i in assets if i!=usdinfo][0]
    tokencontract = tokeninfo["info"]["token"]["contract_addr"]
    try:
        tokenname = tokens[tokencontract]["symbol"]
    except:
        print("cannot find token", tokencontract)
        continue
    try:
        tokenprice = float(usdinfo["amount"])/float(tokeninfo["amount"])
    except:
        print("wrong price:", tokenname)
        continue
    #print(tokenname, tokenprice)
    TOKENPRICE[tokenname] = tokenprice

res = [HEADER]
for dstchain, tokendata in [("Ethereum", ethtokens), ("BSC", bsctokens), ("Harmony", hmytokens)]:
    x=Endpoint_Provider(chain2rpcs(dstchain))
    dsttoken_contracts = sorted(tokendata.values())
    dsttoken2name = dict(zip(dsttoken_contracts, x.batch_callfunction_decode([[contract, "symbol()", ""] for contract in dsttoken_contracts], ["string"])))
    for _n, dstcontract in tokendata.items():
        n = _n
        if n.startswith("terra"):
            n = tokens[n]["symbol"]
        if "(Delisted)" in n:
            continue
        if n in ["aUST"]:
            price = 0
        else:
            price = TOKENPRICE[n]
        #bridge,srcchain,srctoken,dstchain,dsttoken,srctoken_contract,dsttoken_contract,srcholder,dstholder,isopen,fee_fixed,fee_percent,fee_minfee,fee_maxfee,minamount,liquidity
        name = dsttoken2name[dstcontract]
        if price>0:
            fee_minfee = 1/price
        else:
            fee_minfee = 0
        res.append(["terrabridge", "Terra", name, dstchain, name, _n, dstcontract, holder[dstchain], "", True, 0, 0.1, fee_minfee, 0, fee_minfee, 0, ""])
        res.append(["terrabridge", dstchain, name, "Terra", name, dstcontract, _n, "", holder[dstchain], True, 0, 0, 0, 0, 0, 0, ""])
writecsv("terrabridge.txt", res)