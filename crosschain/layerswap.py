from bs4 import BeautifulSoup
from common import *

res = [HEADER]  # ["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
FOLDER = os.path.dirname(os.path.realpath(__file__))


def normalizeChain(chain_name):
    if chain_name == "BNB Chain (BSC)":
        return "BNB Chain"
    if chain_name == "Arbitrum One":
        return "Arbitrum"
    if chain_name == "zkSync Lite":
        return "zkSync"
    if chain_name == "Kucoin Chain (KCC)":
        return "KCC"
    if chain_name == "ImmutableX":
        return "Immutable X"
    if chain_name == "OKX Chain (OKC)":
        return "OKXChain"
    return chain_name


def generate_path(chains):
    for network1 in chains:
        for network2 in chains:
            if network1["display_name"] == network2["display_name"]:
                continue
            currencies1 = network1["currencies"]
            currencies2 = network2["currencies"]
            for currency1 in currencies1:
                for currency2 in currencies2:
                    if currency1["asset"] != currency2["asset"]:
                        continue
                    if not currency1["is_deposit_enabled"] or not currency2["is_withdrawal_enabled"]:
                        continue
                    asset = currency1["asset"]
                    srctoken_contract = currency1["contract_address"]
                    dsttoken_contract = currency2["contract_address"]
                    fee = currency1["deposit_fee"] + currency2["base_fee"] + currency2["withdrawal_fee"]
                    max_amount = currency2["max_withdrawal_amount"]
                    srcchain = normalizeChain(network1["display_name"])
                    dstchain = normalizeChain(network2["display_name"])
                    res.append(["Layerswap", srcchain, asset, dstchain, asset, srctoken_contract, dsttoken_contract, "", "", True, fee, "", "", "", "", max_amount, ""])


if __name__ == '__main__':
    response = sess.get('https://www.layerswap.io/')
    html = response.text
    soup = BeautifulSoup(html, "html.parser")
    pageData = json.loads(soup.find(id="__NEXT_DATA__").text)["props"]["pageProps"]["settings"]
    exchanges = list(filter(lambda x: x["status"] == "active", pageData["exchanges"]))
    networks = list(filter(lambda x: x["status"] == "active", pageData["networks"]))
    generate_path(networks)
    writecsv("layerswap.txt", res)




