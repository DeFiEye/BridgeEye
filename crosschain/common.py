import csv, cloudscraper
import os, sys, time, random
from pprint import pprint
sys.path.append("..")
from base import *
from mpms import MPMS
sess=cloudscraper.create_scraper()

ALLOWED_CHAINS = [ "ATOM",  "Arbitrum",  "Avalanche",  "BCH",  "BEP2",  "BLOCK",  "BSC",  "BTC",  "CELO",  "COLX",  "DOGE",  "DOT",  "EGLD",  "EOS",  "ETC",  "Ethereum",  "FIL",  "FIRO",  "FSN",  "Fantom",  "Goerli",  "HECO",  "Harmony",  "IOTA",  "IoTeX",  "KCC",  "KMD",  "LTC",  "LTO",  "Moonriver",  "NEAR",  "NULS",  "OEC",  "ONT",  "Optimism",  "Polygon",  "RON",  "SDN",  "Solana",  "TRX",  "XRP",  "XTZ",  "ZEC",  "xDAI"]

def checkrpc():
    for c, rs in CHAINRPCS.items():
     for r in rs:
      try:
       print(c, r, sess.post(r, json={"id":0, "jsonrpc":"2.0", "method":"eth_chainId"}).json()["result"])
      except:
       print("error:", c, r)

def writecsv(filename, res):
    with open(filename, "w") as fp:
        c = csv.writer(fp)
        for item in res:
            c.writerow(item)

HEADER=["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]