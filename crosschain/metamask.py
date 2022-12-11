from common import *
import json
import os,time

FOLDER = os.path.dirname(os.path.realpath(__file__))
sample_address = "0x3e8cB4bd04d81498aB4b94a392c334F5328b237b"


# generate token and decimals info
def generate_token_decimals():
    tokens = json.load(open(FOLDER + "/metamask/supported_tokens.json"))
    token_decimals = {}
    for key in tokens.keys():
        if not tokens[key]:
            continue
        decimals = {}
        for token in tokens[key]:
            decimals[token["address"].lower()] = token["decimals"]
        token_decimals[key] = decimals
    with open("metamask/token_decimals.json", "w") as outfile:
        json.dump(token_decimals, outfile)


# This method needs to be called in real time to get latest quotes
@lru_cache()
def metamask_query(from_id, to_id, from_address, to_address, amount, _ts):
    result = {}
    tokens_info = json.load(open(FOLDER + "/metamask/token_decimals.json"))
    from_decimal, to_decimal = 18, 18
    try:
        from_decimal = tokens_info[str(from_id)][from_address.lower()]
        to_decimal = tokens_info[str(to_id)][to_address.lower()]
    except:
        print("Need to update supported tokens")
    amount = int(amount) * 10 ** from_decimal
    url = "https://bridge.metaswap.codefi.network/getQuote?walletAddress={}&srcChainId={}&destChainId={}&srcTokenAddress={}&destTokenAddress={}&srcTokenAmount={}&slippage=5&aggIds=socket,lifi&insufficientBal=true".format(
        sample_address, from_id, to_id, from_address, to_address, amount)
    gas_url = "https://gas.metaswap.codefi.network/networks/{}/suggestedGasFees".format(from_id)
    try:
        print(url)
        response = sess.get(url=url)
        route = response.json()[0]
        bridges = ""
        for i in range(len(route["quote"]["bridges"])):
            bridges += route["quote"]["bridges"][i]
            if i < len(route["quote"]["bridges"]) - 1:
                bridges += " - "
        result["amount_receive"] = round(float(route["quote"]["destTokenAmount"]) / 10 ** to_decimal, 2)
        result["bridges"] = bridges
        if str(from_id) == "56":
            gas_price = 5
        else:
            response = sess.get(url=gas_url).json()
            gas_price = response["low"]["suggestedMaxFeePerGas"]
        result["gas"] = route["trade"]["gasLimit"] * float(gas_price)

    except Exception as e:
        print(e)
    return result


def from_token_not_to_token(token1, token2):
    if token1 == token2:
        return False
    derivative_tokens = [["WETH", "WETH.E"], ["WBTC", "BTCB", "WBTC.E", "BTC"], ["USDC", "USDC.E"], ["USDT", "USDT.E", "USDt"], ["DAI", "DAI.E", "XDAI"]]
    for derivative_token in derivative_tokens:
        if token1 in derivative_token and token2 in derivative_token:
            return False
    return True


def generate_path(from_name, to_name, from_tokens, to_tokens):
    for from_token in from_tokens:
        for to_token in to_tokens:
            if from_token_not_to_token(from_token["symbol"].upper(), to_token["symbol"].upper()):
                continue
            res.append(["metamask", from_name, from_token["symbol"], to_name, to_token["symbol"], from_token["address"],
                        to_token["address"], "", "", True, 0, 0.1, 0, 0, 0, 0, ""])


if __name__ == '__main__':
    if os.path.isfile("metamask.txt") and time.time() < os.path.getmtime("metamask.txt")+86400 and "force" not in sys.argv:
        exit(0)
    res = [HEADER]  # ["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
    tokens = json.load(open(FOLDER + "/metamask/supported_tokens.json"))
    chains = tokens.keys()
    for from_id in chains:
        for to_id in chains:
            if from_id == to_id:
                continue
            from_tokens = tokens[from_id]
            to_tokens = tokens[to_id]
            from_name = chainid2name(from_id)
            to_name = chainid2name(to_id)
            generate_path(from_name, to_name, from_tokens, to_tokens)
    writecsv("metamask.txt", res)
