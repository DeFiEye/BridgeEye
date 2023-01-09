from common import *
import json
import os, time


# Doc: https://apidocs.li.fi/reference/welcome-to-the-lifinance-api
FOLDER = os.path.dirname(os.path.realpath(__file__))
tokens_info = json.load(open(FOLDER + "/lifinance/token_decimals.json"))

# generate supported tokens and used offline. Can be called periodically to update the latest supported tokens on bungee
def get_supported_tokens():
    url = 'https://li.quest/v1/tokens'
    response = sess.get(url=url).json()["tokens"]
    with open("./lifinance/supported_tokens.json", "w") as outfile:
        json.dump(response, outfile)


# generate token and decimals info
def generate_token_decimals():
    tokens = json.load(open(FOLDER + "/lifinance/supported_tokens.json"))
    token_decimals = {}
    for key in tokens.keys():
        if not tokens[key]:
            continue
        decimals = {}
        for token in tokens[key]:
            decimals[token["address"].lower()] = token["decimals"]
        token_decimals[key] = decimals
    with open("lifinance/token_decimals.json", "w") as outfile:
        json.dump(token_decimals, outfile)


def get_supported_chains():
    url = "https://li.quest/v1/chains"
    response = sess.get(url=url)
    supported_chains = response.json()["chains"]
    return supported_chains


def from_token_is_to_token(token1, token2):
    if token1 == token2:
        return True
    derivative_tokens = [["WETH", "WETH.E"], ["WBTC", "BTCB", "WBTC.E", "BTC"], ["USDC", "USDC.E", "FUSDC"],
                         ["USDT", "USDT.E", "FUSDT"], ["DAI", "DAI.E", "XDAI"], ["AAVE", "AAVE.E"], ["BUSD", "BUSD.E"]]
    for derivative_token in derivative_tokens:
        if token1 in derivative_token and token2 in derivative_token:
            return True
    return False


def tokens_abanded(token1, token2):
    abandoned_token = ["0xdfbef4f3fb6f4c9a3d79d8c3b91c6144bf9ea5bc"]
    return token1 in abandoned_token or token2 in abandoned_token


def generate_path(from_name, to_name, from_tokens, to_tokens):
    for from_token in from_tokens:
        for to_token in to_tokens:
            if tokens_abanded(from_token["address"], to_token["address"]): continue
            if from_token_is_to_token(from_token["symbol"].upper(), to_token["symbol"].upper()):
                res.append(
                    ["lifinance", from_name, from_token["symbol"], to_name, to_token["symbol"], from_token["address"],
                     to_token["address"], "", "", True, 0, 0.1, 0, 0, 0, 0, ""])


def normalizeChainName(chain_name):
    if chain_name == "Arbitrum One":
        return "Arbitrum"
    elif chain_name == "BSC":
        return "BNB Chain"
    elif chain_name == "CELO":
        return "Celo"
    else:
        return chain_name


@lru_cache()
def lifinance_query(from_id, to_id, from_address, to_address, amount, _ts):
    result = {}
    from_decimal, to_decimal = 18, 18
    try:
        from_decimal = tokens_info[str(from_id)][from_address.lower()]
        to_decimal = tokens_info[str(to_id)][to_address.lower()]
    except:
        print("Need to update supported tokens")
    try:
        amount = int(amount) * 10 ** from_decimal
        estimate_url = "https://li.quest/v1/advanced/routes"
        lifinance_response = sess.post(url=estimate_url, json={
            "fromChainId": from_id,
            "fromAmount": str(amount),
            "fromTokenAddress": from_address,
            "toChainId": to_id,
            "toTokenAddress": to_address
        }).json()
        route = lifinance_response["routes"][0]
        result["amount_receive"] = round(
            float(route["toAmount"]) / 10 ** to_decimal, 4)
        result["gasCostUSD"] = route["gasCostUSD"]
        bridges = ""
        for i in range(len(route["steps"])):
            bridges += route["steps"][i]["toolDetails"]["name"]
            if i < len(route["steps"]) - 1:
                bridges += " - "
        result["bridges"] = bridges

    except Exception as e:
        print(e)
    return result


if __name__ == '__main__':
    if os.path.isfile("lifinance.txt") and time.time() < os.path.getmtime(
            "lifinance.txt") + 86400 and "force" not in sys.argv:
        exit(0)
    res = [
        HEADER]  # ["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
    chains = get_supported_chains()
    tokens = json.load(open(FOLDER + "/lifinance/supported_tokens.json"))
    for fromChain in chains:
        for toChain in chains:
            from_id = str(fromChain["id"])
            to_id = str(toChain["id"])
            if from_id == to_id:
                continue
            from_name = normalizeChainName(fromChain["name"])
            to_name = normalizeChainName(toChain["name"])
            from_tokens = tokens[from_id]
            to_tokens = tokens[to_id]
            generate_path(from_name, to_name, from_tokens, to_tokens)
    writecsv("lifinance.txt", res)
