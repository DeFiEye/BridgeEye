from common import *
import requests
import json

# Docs: https://docs.socket.tech/socket-api/v2
# Swagger: https://api.socket.tech/v2/swagger

res = [
    HEADER]  # ["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
api_key = "Defieye 牛逼"
headers = {"API-KEY": api_key}
sample_address = "0x3e8cB4bd04d81498aB4b94a392c334F5328b237b"


def get_supported_chains():
    url = "https://api.socket.tech/v2/supported/chains"
    response = requests.get(url=url, headers=headers)
    supported_chains = response.json()["result"]
    return supported_chains


def get_from_tokens(from_id, to_id):
    url = "https://api.socket.tech/v2/token-lists/from-token-list?fromChainId={}&toChainId={}&disableSwapping=true&singleTxOnly=true".format(
        from_id, to_id)
    response = requests.get(url=url, headers=headers)
    from_tokens = response.json()["result"]
    return from_tokens


def get_to_tokens(from_id, to_id):
    url = "https://api.socket.tech/v2/token-lists/to-token-list?fromChainId={}&toChainId={}&disableSwapping=true&singleTxOnly=true".format(
        from_id, to_id)
    response = requests.get(url=url, headers=headers)
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
def get_quote(from_id, to_id, from_address, to_address, amount):
    result = {}
    with open('./bungee/supported_tokens.json', 'r') as openfile:
        tokens_info = json.load(openfile)
    from_decimal = tokens_info[str(from_id)][from_address]
    to_decimal = tokens_info[str(to_id)][to_address]
    amount = amount * 10 ** from_decimal
    url = "https://api.socket.tech/v2/quote?fromChainId={}&fromTokenAddress={}&toChainId={}&toTokenAddress={}&fromAmount={}&userAddress={}&recipient={}&uniqueRoutesPerBridge=true&disableSwapping=true&sort=output&singleTxOnly=true".format(
        from_id, from_address, to_id, to_address, amount, sample_address, sample_address)
    try:
        response = requests.get(url=url, headers=headers)
        route = response.json()["result"]["routes"][0]
        result["amount_receive"] = round(float(route["toAmount"]) / 10 ** to_decimal, 2)
        result["fee_usd"] = round(route["totalGasFeesInUsd"], 2)
        result["service_time"] = route["serviceTime"]
        print(result)
    except Exception as e:
        print(e)
    return result


def change_special_symbol(token):
    if token["symbol"] == "WETH":
        token["symbol"] = "ETH"
    elif token["symbol"] == "BTCB":
        token["symbol"] = "BTC"
    elif token["symbol"] == "WBTC":
        token["symbol"] = "BTC"


def generate_path(from_name, to_name, from_tokens, to_tokens):
    for from_token in from_tokens:
        for to_token in to_tokens:
            change_special_symbol(from_token)
            change_special_symbol(to_token)
            if from_token["symbol"] != to_token["symbol"]:
                continue
            res.append(["bungee", from_name, from_token["symbol"], to_name, to_token["symbol"], from_token["address"],
                        to_token["address"], "", "", True, 0, 0.1, 0, 0, 0, 0, ""])


if __name__ == '__main__':
    chains = get_supported_chains()
    for fromChain in chains:
        for toChain in chains:
            from_id = fromChain["chainId"]
            to_id = toChain["chainId"]
            if from_id == to_id:
                continue
            from_name = fromChain["name"]
            to_name = toChain["name"]
            from_tokens = get_from_tokens(from_id, to_id)
            to_tokens = get_to_tokens(from_id, to_id)
            generate_path(from_name, to_name, from_tokens, to_tokens)
    writecsv("./bungee/bungee.txt", res)
