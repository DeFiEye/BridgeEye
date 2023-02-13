from common import *

#Swagger: https://deswap.debridge.finance/v1.0/
#Doc: https://docs.debridge.finance/
supported_chainIds = [1, 56, 137, 42161, 43114]
chaidIds_2_native_tokens = {1: "ETH", 56: "BNB", 137: "MATIC", 42161: "ETH", 43114: "AVAX"}
token_url = "https://tokens.1inch.io/v1.1/"


def from_token_is_to_token(token1, token2):
    if token1 == token2:
        return True
    derivative_tokens = [["WETH", "WETH.E"], ["WBTC", "BTCB", "WBTC.E", "BTC"], ["USDC", "USDC.E", "FUSDC"],
                         ["USDT", "USDT.E", "FUSDT"], ["DAI", "DAI.E", "XDAI"], ["AAVE", "AAVE.E"], ["BUSD", "BUSD.E"]]
    for derivative_token in derivative_tokens:
        if token1 in derivative_token and token2 in derivative_token:
            return True
    return False


def generatePath(fromChainId, toChainId, fromChainTokens, toChainTokens):
    for from_token in fromChainTokens:
        for to_token in toChainTokens:
            if from_token_is_to_token(from_token["symbol"].upper(), to_token["symbol"].upper()):
                res.append(["debridge", chainid2name(fromChainId), from_token["symbol"], chainid2name(toChainId), to_token["symbol"], from_token["address"],
                        to_token["address"], "", "", True, 0, 0.1, 0, 0, 0, 0, ""])


def nativeToken(address):
    if address.lower() == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee":
        return "0x0000000000000000000000000000000000000000"
    return address


def isNativeSwap(address):
    return address.lower() == "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee"


@lru_cache()
def debridge_query(from_id, to_id, from_address, to_address, amount, _ts):
    result = {}
    try:
        native_swap = isNativeSwap(from_address)
        from_token_url = token_url + str(from_id)
        from_token = sess.get(url=from_token_url).json()[from_address]
        to_token_url = token_url + str(to_id)
        to_token = sess.get(url=to_token_url).json()[to_address]
        amount = int(amount) * 10 ** from_token["decimals"]
        from_address = nativeToken(from_address)
        to_address = nativeToken(to_address)
        estimate_url = "https://deswap.debridge.finance/v1.0/transaction?srcChainId={}&srcChainTokenIn={}&srcChainTokenInAmount={}&slippage=3&dstChainId={}&dstChainTokenOut={}&executionFeeAmount=auto&affiliateFeePercent=0&dstChainTokenOutRecipient=0x3e8cB4bd04d81498aB4b94a392c334F5328b237b".format(from_id, from_address, amount, to_id, to_address)
        debridge_response = sess.get(url=estimate_url).json()
        estimation = debridge_response["estimation"]
        protocol_fee_amount = float(debridge_response["tx"]["value"])
        if native_swap:
            protocol_fee_amount -= amount
        native_token = chaidIds_2_native_tokens[from_id]
        result["amount_receive"] = round(float(estimation["dstChainTokenOut"]["amount"]) / 10 ** to_token["decimals"], 4)
        execution_fee_token = estimation["executionFee"]["token"]["symbol"]
        execution_fee_decimal = estimation["executionFee"]["token"]["decimals"]
        execution_fee_amount = round(float(estimation["executionFee"]["actualAmount"]) / 10 ** execution_fee_decimal, 4)
        result["execution_fee_token"] = execution_fee_token
        result["execution_fee_amount"] = execution_fee_amount
        result["protocol_fee_token"] = native_token
        result["protocol_fee_amount"] = round(protocol_fee_amount / 10 ** 18, 4)

    except Exception as e:
        print(e)
    return result


if __name__ == '__main__':
    if os.path.isfile("debridge.txt") and time.time() < os.path.getmtime("debridge.txt")+86400 and "force" not in sys.argv:
        exit(0)
    res = [HEADER]  # ["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
    supported_tokens = {}
    for chainId in supported_chainIds:
        url = token_url + str(chainId)
        response = sess.get(url=url)
        supported_tokens[f'{chainId}'] = list(response.json().values())
    for fromChainId in supported_chainIds:
        for toChainId in supported_chainIds:
            if fromChainId == toChainId:
                continue
            fromChainTokens = supported_tokens[f'{fromChainId}']
            toChainTokens = supported_tokens[f'{toChainId}']
            generatePath(fromChainId, toChainId, fromChainTokens, toChainTokens)
    writecsv("debridge.txt", res)