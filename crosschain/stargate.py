import json
from web3 import Web3
from common import *

tokenAbi = """[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_upgradedAddress","type":"address"}],"name":"deprecate","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_value","type":"uint256"}],"name":"approve","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"deprecated","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_evilUser","type":"address"}],"name":"addBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"upgradedAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balances","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maximumFee","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"_totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"unpause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_maker","type":"address"}],"name":"getBlackListStatus","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowed","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"paused","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"who","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"pause","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"getOwner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"newBasisPoints","type":"uint256"},{"name":"newMaxFee","type":"uint256"}],"name":"setParams","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"issue","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"redeem","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"basisPointsRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"isBlackListed","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_clearedUser","type":"address"}],"name":"removeBlackList","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"MAX_UINT","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_blackListedUser","type":"address"}],"name":"destroyBlackFunds","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_initialSupply","type":"uint256"},{"name":"_name","type":"string"},{"name":"_symbol","type":"string"},{"name":"_decimals","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Issue","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"amount","type":"uint256"}],"name":"Redeem","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"newAddress","type":"address"}],"name":"Deprecate","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"feeBasisPoints","type":"uint256"},{"indexed":false,"name":"maxFee","type":"uint256"}],"name":"Params","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_blackListedUser","type":"address"},{"indexed":false,"name":"_balance","type":"uint256"}],"name":"DestroyedBlackFunds","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"AddedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_user","type":"address"}],"name":"RemovedBlackList","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"owner","type":"address"},{"indexed":true,"name":"spender","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"from","type":"address"},{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[],"name":"Unpause","type":"event"}]"""
rpcMap = {
    "Ethereum": "https://rpc.ankr.com/eth",
    "BSC": "https://bsc-dataseed1.binance.org",
    "Avalanche": "https://api.avax.network/ext/bc/C/rpc",
    "Polygon": "https://polygon-rpc.com",
    "Arbitrum": "https://arb1.arbitrum.io/rpc",
    "Optimism": "https://mainnet.optimism.io",
    "Fantom": "https://rpcapi.fantom.network"
}
chain2coin = {
    "Ethereum": "ETH",
    "BSC": "BNB",
    "Avalanche": "AVAX",
    "Polygon": "MATIC",
    "Arbitrum": "ETH",
    "Optimism": "ETH",
    "Fantom": "FTM"
}

# get bridge details from offline json file
bridge = json.load(open("stargate/stargate.json"))
router = json.load(open("stargate/router.json"))
chain2tokens = {}
chain2router = {}
chain2feePool = {}
chain2Id = {}
for item in bridge:
    chain2tokens[item["network"]] = item["tokens"]
    chain2router[item["network"]] = item["router"]
    chain2feePool[item["network"]] = item["feePool"]
    chain2Id[item["network"]] = item["chainId"]

# fetch token liquidity in each pool
for network, tokens in chain2tokens.items():
    w3 = Web3(Web3.HTTPProvider(rpcMap[network]))
    for i in range(len(tokens)):
        token = tokens[i]
        tokenContract = w3.eth.contract(address=token["address"], abi=tokenAbi)
        balance = tokenContract.functions.balanceOf(token["poolAddress"]).call()
        token["liquidity"] = balance/10**token["decimal"]
        token["network"] = network
        chain2tokens[network][i] = token

# generate offline bridge info file
res = [HEADER]  # ["bridge","srcchain","srctoken","dstchain","dsttoken","srctoken_contract","dsttoken_contract","srcholder","dstholder","isopen","fee_fixed","fee_percent","fee_minfee","fee_maxfee","minamount", "liquidity", "extra"]
allTokens = chain2tokens.values()


def generate_path(src_tokens, dst_tokens):
    for src_token in src_tokens:
        for dst_token in dst_tokens:
            extra = get_native_extra_fee(src_token["network"], dst_token["network"])
            res.append(["stargate", src_token["network"], src_token["symbol"], dst_token["network"], dst_token["symbol"], src_token["address"], dst_token["address"], src_token["poolAddress"], dst_token["poolAddress"], True, 0, 0.06, 0, 0, 0, dst_token["liquidity"], extra])


def get_native_extra_fee(src_network, dst_network):
    w3 = Web3(Web3.HTTPProvider(rpcMap[src_network]))
    router_contract = w3.eth.contract(address=chain2router[src_network], abi=router)
    params = {
        "dstGasForCall": 0,
        "dstNativeAmount": 0,
        "dstNativeAddr": ""
    }
    quote_fee = router_contract.functions.quoteLayerZeroFee(chain2Id[dst_network], 1, "0x0000000000000000000000000000000000000000", "", params).call()
    coin = chain2coin[src_network]
    extra = {
        "nativeGasToken": {coin: quote_fee[0]}
    }
    print(str(extra))
    return str(extra)


for src_tokens in allTokens:
    for dst_tokens in allTokens:
        if src_tokens[0]["network"] == dst_tokens[0]["network"]:
            continue
        else:
            generate_path(src_tokens, dst_tokens)

writecsv("stargate.txt", res)
    
@lru_cache()
def stargate_query(srcchain, dstchain, srctoken, dsttoken, amount, _ts):
    result = {}
    chains = json.load(open("stargate/chains.json"))
    fee_pool = json.load(open("stargate/feePool.json"))
    w3 = Web3(Web3.HTTPProvider(chains[srcchain]["rpc"]))
    fee_contract = w3.eth.contract(address=chains[srcchain]["feePool"], abi=fee_pool)
    response = fee_contract.functions.getFees(chains[srcchain][srctoken], chains[dstchain][dsttoken], chains[dstchain]["chainId"], "0x0000000000000000000000000000000000000000", amount * 10 ** 6).call()
    result["EQ Fee"] = response[1] / 10 ** 6
    result["EQ Rewards"] = response[2] / 10 ** 6
    result["Lp Fee"] = response[3] / 10 ** 6
    result["Protocol Fee"] = response[4] / 10 ** 6
    return result  # final fees = EQ Fee + Lp Fee + Protocol Fee - EQ Rewards
