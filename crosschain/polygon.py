from common import *
tokenlist=filecached_get("https://api-polygon-tokens.polygon.technology/tokenlists/default.tokenlist.json", "polygon_tokenlist")

res = [HEADER,]

for t in tokenlist["tokens"]:
    assert t["extensions"]["rootAddress"]
    res.append(["polygon", "Ethereum", t["symbol"], "Polygon", t["symbol"], t["extensions"]["rootAddress"], t["address"], 
            "", "", 
            True, 0, 0, 0, 0, 0, 0,
            "",
    ])
    res.append(["polygon", "Polygon", t["symbol"], "Ethereum", t["symbol"], t["address"],  t["extensions"]["rootAddress"],
            "", "", 
            True, 0, 0, 0, 0, 0, 0,
            "",
    ])
writecsv("polygon.txt", res)