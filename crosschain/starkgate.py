from common import *
import json
import os, time
supportedTokens = [
    {
        "symbol": "ETH",
        "address": "0x0000000000000000000000000000000000000000",
        "l2Address": "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7"
    },
    {
        "symbol": "WBTC",
        "address": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "l2Address": "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac"
    },
    {
        "symbol": "USDT",
        "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        "l2Address": "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8"
    },
    {
        "symbol": "USDC",
        "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "l2Address": "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8"
    },
    {
        "symbol": "DAI",
        "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
        "l2Address": "0x00da114221cb83fa859dbdb4c44beeaa0bb37c7537ad5ae66fe5e0efd20e6eb3"
    }
]
supportedChains = ["Ethereum"]

res = [HEADER]  
for chain in supportedChains:
    for token in supportedTokens:
        res.append(["starkgate", chain, token["symbol"], "StarkNet", token["symbol"], token["address"], token["l2Address"], "", "", True, 0, 0, 0, 0, 0, 0, ""])
        res.append(["starkgate", "StarkNet", token["symbol"], chain, token["symbol"], token["l2Address"], token["address"], "", "", True, 0, 0, 0, 0, 0, 0, ""])
writecsv("starkgate.txt", res)