from common import *
TOKENS = json.loads("""[{"symbol":"ETH","name":"Ethereum","nearAddress":"aurora","decimals":18,"origin":"ethereum"},{"symbol":"USDT","name":"TetherUS","ethereumAddress":"0xdac17f958d2ee523a2206206994597c13d831ec7","nearAddress":"dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near","auroraAddress":"0x4988a896b1227218e4a686fde5eabdcabd91571f","decimals":6,"origin":"ethereum"},{"symbol":"LINK","name":"ChainLink","ethereumAddress":"0x514910771af9ca656af840dff83e8264ecf986ca","nearAddress":"514910771af9ca656af840dff83e8264ecf986ca.factory.bridge.near","auroraAddress":"0x94190d8ef039c670c6d6b9990142e0ce2a1e3178","decimals":18,"origin":"ethereum"},{"symbol":"UNI","name":"Uniswap","ethereumAddress":"0x1f9840a85d5af5bf1d1762f925bdaddc4201f984","nearAddress":"1f9840a85d5af5bf1d1762f925bdaddc4201f984.factory.bridge.near","auroraAddress":"0x1bc741235ec0ee86ad488fa49b69bb6c823ee7b7","decimals":18,"origin":"ethereum"},{"symbol":"USDC","name":"USD Coin","ethereumAddress":"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","nearAddress":"a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near","auroraAddress":"0xb12bfca5a55806aaf64e99521918a4bf0fc40802","decimals":6,"origin":"ethereum"},{"symbol":"WBTC","name":"Wrapped Bitcoin","ethereumAddress":"0x2260fac5e5542a773aa44fbcfedf7c193bc2c599","nearAddress":"2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near","auroraAddress":"0xf4eb217ba2454613b15dbdea6e5f22276410e89e","decimals":8,"origin":"ethereum"},{"symbol":"AAVE","name":"Aave","ethereumAddress":"0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9","nearAddress":"7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9.factory.bridge.near","auroraAddress":"0x4e834cdcc911605227eedddb89fad336ab9dc00a","decimals":18,"origin":"ethereum"},{"symbol":"DAI","name":"Dai","ethereumAddress":"0x6b175474e89094c44da98b954eedeac495271d0f","nearAddress":"6b175474e89094c44da98b954eedeac495271d0f.factory.bridge.near","auroraAddress":"0xe3520349f477a5f6eb06107066048508498a291b","decimals":18,"origin":"ethereum"},{"symbol":"COMP","name":"Compound","ethereumAddress":"0xc00e94cb662c3520282e6f5717214004a7f26888","nearAddress":"c00e94cb662c3520282e6f5717214004a7f26888.factory.bridge.near","auroraAddress":"0xdeacf0faa2b80af41470003b5f6cd113d47b4dcd","decimals":18,"origin":"ethereum"},{"symbol":"SUSHI","name":"Sushi","ethereumAddress":"0x6b3595068778dd592e39a122f4f5a5cf09c90fe2","nearAddress":"6b3595068778dd592e39a122f4f5a5cf09c90fe2.factory.bridge.near","auroraAddress":"0x7821c773a12485b12a2b5b7bc451c3eb200986b1","decimals":18,"origin":"ethereum"},{"symbol":"YFI","name":"yearn.finance","ethereumAddress":"0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e","nearAddress":"0bc529c00c6401aef6d220be8c6ea1667f6ad93e.factory.bridge.near","auroraAddress":"0xa64514a8af3ff7366ad3d5daa5a548eefcef85e0","decimals":18,"origin":"ethereum"},{"symbol":"MKR","name":"Maker","ethereumAddress":"0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2","nearAddress":"9f8f72aa9304c8b593d555f12ef6589cc3a579a2.factory.bridge.near","auroraAddress":"0x1d1f82d8b8fc72f29a8c268285347563cb6cd8b3","decimals":18,"origin":"ethereum"},{"symbol":"SNX","name":"Synthetix Network Token","ethereumAddress":"0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f","nearAddress":"c011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f.factory.bridge.near","auroraAddress":"0xdc9be1ff012d3c6da818d136a3b2e5fdd4442f74","decimals":18,"origin":"ethereum"},{"symbol":"REN","name":"Ren","ethereumAddress":"0x408e41876cccdc0f92210600ef50372656052a38","nearAddress":"408e41876cccdc0f92210600ef50372656052a38.factory.bridge.near","auroraAddress":"0x18921f1e257038e538ba24d49fa6495c8b1617bc","decimals":18,"origin":"ethereum"},{"symbol":"BAL","name":"Balancer","ethereumAddress":"0xba100000625a3754423978a60c9317c58a424e3d","nearAddress":"ba100000625a3754423978a60c9317c58a424e3d.factory.bridge.near","auroraAddress":"0xb59d0fdaf498182ff19c4e80c00ecfc4470926e2","decimals":18,"origin":"ethereum"},{"symbol":"CREAM","name":"Cream Finance","ethereumAddress":"0x2ba592f78db6436527729929aaf6c908497cb200","nearAddress":"2ba592f78db6436527729929aaf6c908497cb200.factory.bridge.near","auroraAddress":"0xabe9818c5fb5e751c4310be6f0f18c8d85f9bd7f","decimals":18,"origin":"ethereum"},{"symbol":"wNEAR","name":"Wrapped NEAR","ethereumAddress":null,"nearAddress":"wrap.near","auroraAddress":"0xc42c30ac6cc15fac9bd938618bcaa1a1fae8501d","decimals":24,"origin":"near"},{"symbol":"NEAR","name":"NEAR","ethereumAddress":"0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4","auroraAddress":null,"decimals":24,"origin":"near"},{"symbol":"WETH","name":"Wrapped ETH","ethereumAddress":"0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2","nearAddress":"c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2.factory.bridge.near","auroraAddress":null,"decimals":18,"origin":"ethereum"},{"symbol":"AURORA","name":"Aurora","ethereumAddress":"0xaaaaaa20d9e0e2461697782ef11675f668207961","nearAddress":"aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near","auroraAddress":"0x8bec47865ade3b172a928df8f990bc7f2a3b9f79","decimals":18,"origin":"ethereum"},{"symbol":"BAT","name":"Basic Attention Token","ethereumAddress":"0x0d8775f648430679a709e98d2b0cb6250d2887ef","nearAddress":"0d8775f648430679a709e98d2b0cb6250d2887ef.factory.bridge.near","auroraAddress":"0x2b9025aecc5ce7a8e6880d3e9c6e458927ecba04","decimals":18,"origin":"ethereum"},{"symbol":"FRAX","name":"Frax","ethereumAddress":"0x853d955acef822db058eb8505911ed77f175b99e","nearAddress":"853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near","auroraAddress":"0xda2585430fef327ad8ee44af8f1f989a2a91a3d2","decimals":18,"origin":"ethereum"},{"symbol":"FXS","name":"Frax Share","ethereumAddress":"0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0","nearAddress":"3432b6a60d23ca0dfca7761b7ab56459d9c964d0.factory.bridge.near","auroraAddress":"0xc8fdd32e0bf33f0396a18209188bb8c6fb8747d2","decimals":18,"origin":"ethereum"},{"symbol":"MODA","name":"moda","ethereumAddress":"0x1117ac6ad6cdf1a3bc543bad3b133724620522d5","nearAddress":"1117ac6ad6cdf1a3bc543bad3b133724620522d5.factory.bridge.near","auroraAddress":"0x74974575d2f1668c63036d51ff48dbaa68e52408","decimals":18,"origin":"ethereum"},{"symbol":"OCT","name":"Octopus Network Token","ethereumAddress":"0xf5cfbc74057c610c8ef151a439252680ac68c6dc","nearAddress":"f5cfbc74057c610c8ef151a439252680ac68c6dc.factory.bridge.near","auroraAddress":"0x951cfdc9544b726872a8faf56792ef6704731aae","decimals":18,"origin":"ethereum"},{"symbol":"HAPI","name":"HAPI","ethereumAddress":"0xd9c2d319cd7e6177336b0a9c93c21cb48d84fb54","nearAddress":"d9c2d319cd7e6177336b0a9c93c21cb48d84fb54.factory.bridge.near","auroraAddress":"0x943f4bf75d5854e92140403255a471950ab8a26f","decimals":18,"origin":"ethereum"},{"symbol":"DODO","name":"DODO bird","ethereumAddress":"0x43Dfc4159D86F3A37A5A4B3D4580b888ad7d4DDd","nearAddress":"43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd.factory.bridge.near","auroraAddress":"0xe301ed8c7630c9678c39e4e45193d1e7dfb914f7","decimals":18,"origin":"ethereum"},{"symbol":"FLX","name":"Flux Token","ethereumAddress":"0x3Ea8ea4237344C9931214796d9417Af1A1180770","nearAddress":"3ea8ea4237344c9931214796d9417af1a1180770.factory.bridge.near","auroraAddress":"0xea62791aa682d455614eaa2a12ba3d9a2fd197af","decimals":18,"origin":"ethereum"},{"symbol":"PAD","name":"NearPad Token","ethereumAddress":"0xea7cc765ebc94c4805e3bff28d7e4ae48d06468a","nearAddress":"ea7cc765ebc94c4805e3bff28d7e4ae48d06468a.factory.bridge.near","auroraAddress":"0x885f8cf6e45bdd3fdcdc644efdcd0ac93880c781","decimals":18,"origin":"ethereum"},{"symbol":"PICKLE","name":"PickleToken","ethereumAddress":"0x429881672b9ae42b8eba0e26cd9c73711b891ca5","nearAddress":"429881672b9ae42b8eba0e26cd9c73711b891ca5.factory.bridge.near","auroraAddress":"0x291c8fceaca3342b29cc36171deb98106f712c66","decimals":18,"origin":"ethereum"},{"symbol":"OIN","name":"oinfinance","ethereumAddress":"0x9aeb50f542050172359a0e1a25a9933bc8c01259","nearAddress":"9aeb50f542050172359a0e1a25a9933bc8c01259.factory.bridge.near","auroraAddress":"0x07b2055fbd17b601c780aeb3abf4c2b3a30c7aae","decimals":8,"origin":"ethereum"},{"symbol":"WOO","name":"Wootrade Network","ethereumAddress":"0x4691937a7508860f876c9c0a2a617e7d9e945d4b","nearAddress":"4691937a7508860f876c9c0a2a617e7d9e945d4b.factory.bridge.near","auroraAddress":"0x99ec8f13b2afef5ec49073b9d20df109d25f78c0","decimals":18,"origin":"ethereum"},{"symbol":"STNEAR","name":"Staked NEAR","ethereumAddress":null,"nearAddress":"meta-pool.near","auroraAddress":"0x07f9f7f963c5cd2bbffd30ccfb964be114332e30","decimals":24,"origin":"near"},{"symbol":"REF","name":"Ref Finance Token","ethereumAddress":null,"nearAddress":"token.v2.ref-finance.near","auroraAddress":"0x221292443758f63563a1ed04b547278b05845fcb","decimals":18,"origin":"near"},{"symbol":"LINEAR","name":"LiNEAR","ethereumAddress":null,"nearAddress":"linear-protocol.near","auroraAddress":"0x918dbe087040a41b786f0da83190c293dae24749","decimals":24,"origin":"near"},{"symbol":"USN","name":"USN","ethereumAddress":null,"nearAddress":"usn","auroraAddress":"0x5183e1b1091804bc2602586919e6880ac1cf2896","decimals":18,"origin":"near"},{"symbol":"BRRR","name":"Burrow Token","ethereumAddress":null,"nearAddress":"token.burrow.near","auroraAddress":"0x0240ae04c9f47b91cf47ca2e7ef44c9de0d385ac","decimals":18,"origin":"near"}]""")

res = [HEADER,]
for t in TOKENS:
    if t["symbol"] == "NEAR":
        t["nearAddress"] = "near"
    elif t["symbol"]=="ETH":
        t["auroraAddress"] = t["ethereumAddress"] = "0x" + "0"*40
    #["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
    print(t)
    if t["ethereumAddress"] and t["nearAddress"]:
        res.append(["rainbowbridge", "Ethereum", t["symbol"], "Near", t["symbol"], t["ethereumAddress"], t["nearAddress"], 
                "", "", 
                True, 0, 0, 0, 0, 0, 0,
                {"gastoken":"ETH", "gas":62846, "gaschainid": 1},
        ])
        res.append(["rainbowbridge", "Near", t["symbol"], "Ethereum", t["symbol"], t["nearAddress"], t["ethereumAddress"],
                "", "", 
                True, 0, 0, 0, 0, 0, 0,
                {"gastoken":"ETH", "gas":331323, "gaschainid": 1},
        ])
    if t["origin"]=="ethereum" or t.get("ethereumAddress"):
        res.append(["rainbowbridge", "Ethereum", t["symbol"], "Aurora", t["symbol"], t["ethereumAddress"], t["auroraAddress"], 
                "0x23Ddd3e3692d1861Ed57EDE224608875809e127f", "", 
                True, 0, 0, 0, 0, 0, 0,
                {"gastoken":"ETH", "gas":62846, "gaschainid": 1},
        ])
        res.append(["rainbowbridge", "Aurora", t["symbol"], "Ethereum", t["symbol"], t["auroraAddress"], t["ethereumAddress"],
                "", "0x23Ddd3e3692d1861Ed57EDE224608875809e127f", 
                True, 0, 0, 0, 0, 0, 0,
                {"gastoken":"ETH", "gas":331323, "gaschainid": 1},
        ])
    if t["nearAddress"] and t["auroraAddress"]:
        #print(t)
        if t["symbol"] == "wNEAR":
            t["symbol"] = "NEAR"
        res.append(["rainbowbridge", "Near", t["symbol"], "Aurora", t["symbol"], t["nearAddress"], t["auroraAddress"],
            "", "",
            True, 0, 0, 0, 0, 0, 0,
            {}
        ])
        res.append(["rainbowbridge", "Aurora", t["symbol"], "Near", t["symbol"], t["auroraAddress"], t["nearAddress"],
            "", "",
            True, 0, 0, 0, 0, 0, 0,
            {}
        ])
writecsv("rainbowbridge.txt", res)