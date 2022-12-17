from common import *
import json
import os,time

# Docs: https://docs.socket.tech/socket-api/v2
# Swagger: https://api.socket.tech/v2/swagger
FOLDER = os.path.dirname(os.path.realpath(__file__))
api_key = os.getenv("bungee_api_key")
headers = {"API-KEY": api_key}
sample_address = "0x3e8cB4bd04d81498aB4b94a392c334F5328b237b"


def get_supported_chains():
    url = "https://api.socket.tech/v2/supported/chains"
    response = sess.get(url=url, headers=headers)
    supported_chains = response.json()["result"]
    return supported_chains


def get_from_tokens(from_id, to_id):
    url = "https://api.socket.tech/v2/token-lists/from-token-list?fromChainId={}&toChainId={}&disableSwapping=true&singleTxOnly=true".format(
        from_id, to_id)
    response = sess.get(url=url, headers=headers)
    from_tokens = response.json()["result"]
    return from_tokens


def get_to_tokens(from_id, to_id):
    url = "https://api.socket.tech/v2/token-lists/to-token-list?fromChainId={}&toChainId={}&disableSwapping=true&singleTxOnly=true".format(
        from_id, to_id)
    response = sess.get(url=url, headers=headers)
    to_tokens = response.json()["result"]
    return to_tokens


# generate supported tokens and used offline. Can be called periodically to update the latest supported tokens on bungee
def generate_supported_tokens():
    chains = get_supported_chains()
    supported_tokens = {}
    for fromChain in chains:
        for toChain in chains:
            from_id = fromChain["chainId"]
            to_id = toChain["chainId"]
            if from_id == to_id:
                continue
            if from_id not in supported_tokens:
                supported_tokens[from_id] = {}
            if to_id not in supported_tokens:
                supported_tokens[to_id] = {}
            from_tokens = get_from_tokens(from_id, to_id)
            to_tokens = get_to_tokens(from_id, to_id)
            for from_token in from_tokens:
                supported_tokens[from_id][from_token["address"]] = from_token["decimals"]
            for to_token in to_tokens:
                supported_tokens[to_id][to_token["address"]] = to_token["decimals"]
    with open("./bungee/supported_tokens.json", "w") as outfile:
        json.dump(supported_tokens, outfile)


# This method needs to be called in real time to get latest quotes
@lru_cache()
def bungee_query(from_id, to_id, from_address, to_address, amount, _ts):
    result = {}
    tokens_info = json.load(open(FOLDER + "/bungee/supported_tokens.json"))
    from_decimal, to_decimal = 18, 18
    try:
        from_decimal = tokens_info[str(from_id)][from_address]
        to_decimal = tokens_info[str(to_id)][to_address]
    except:
        print("Need to update supported tokens")
    amount = int(amount) * 10 ** from_decimal
    url = "https://api.socket.tech/v2/quote?fromChainId={}&fromTokenAddress={}&toChainId={}&toTokenAddress={}&fromAmount={}&userAddress={}&recipient={}&uniqueRoutesPerBridge=true&disableSwapping=true&sort=output&singleTxOnly=true".format(
        from_id, from_address, to_id, to_address, amount, sample_address, sample_address)
    try:
        response = sess.get(url=url, headers=headers)
        #print(response.json())
        route = response.json()["result"]["routes"][0]
        bridge_name = route["usedBridgeNames"][0]
        if "anyswap" in bridge_name:
            bridge_name = "Multichain"
        elif "celer" in bridge_name:
            bridge_name = "cBridge"
        result["amount_receive"] = round(float(route["toAmount"]) / 10 ** to_decimal, 2)
        result["fee_usd"] = round(route["totalGasFeesInUsd"], 2)
        result["service_time"] = route["serviceTime"]
        result["bridges"] = bridge_name
    except Exception as e:
        print(e)
    return result


def from_token_not_to_token(token1, token2):
    if token1 == token2:
        return False
    derivative_tokens = [["WETH", "WETH.E"], ["WBTC", "BTCB", "WBTC.E", "BTC"], ["USDC", "USDC.E", "FUSDC"], ["USDT", "USDT.E", "FUSDT"], ["DAI", "DAI.E", "XDAI"], ["AAVE", "AAVE.E"], ["BUSD", "BUSD.E"]]
    for derivative_token in derivative_tokens:
        if token1 in derivative_token and token2 in derivative_token:
            return False
    return True


def tokens_abanded(token1, token2):
    abandoned_token = ["0xa45b966996374e9e65ab991c6fe4bfce3a56dde8", "0x8b47b31aaabfc6280f43c77a04f80eb2f57d032b"]
    return token1 in abandoned_token or token2 in abandoned_token


def generate_path(from_name, to_name, from_tokens, to_tokens):
    for from_token in from_tokens:
        for to_token in to_tokens:
            if tokens_abanded(from_token["address"], to_token["address"]): continue
            if from_token_not_to_token(from_token["symbol"], to_token["symbol"]):
                continue
            res.append(["bungee", from_name, from_token["symbol"], to_name, to_token["symbol"], from_token["address"],
                        to_token["address"], "", "", True, 0, 0.1, 0, 0, 0, 0, ""])


def normalizeChainName(chain_name):
    if chain_name == "BSC":
        return "BNB Chain"
    else:
        return chain_name


if __name__ == '__main__':
    if os.path.isfile("bungee.txt") and time.time() < os.path.getmtime("bungee.txt")+86400 and "force" not in sys.argv:
        exit(0)
    res = [HEADER]  # ["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
    chains = get_supported_chains()
    for fromChain in chains:
        for toChain in chains:
            from_id = fromChain["chainId"]
            to_id = toChain["chainId"]
            if from_id == to_id:
                continue
            from_name = normalizeChainName(fromChain["name"])
            to_name = normalizeChainName(toChain["name"])
            from_tokens = get_from_tokens(from_id, to_id)
            to_tokens = get_to_tokens(from_id, to_id)
            generate_path(from_name, to_name, from_tokens, to_tokens)
    writecsv("bungee.txt", res)
