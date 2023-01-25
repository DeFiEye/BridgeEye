#Route: https://router-api.via.exchange/api/v1/routes?apiKey=e3db93a3-ae1c-41e5-8229-b8c1ecef5583&fromAddress=0x9da5C4C283c2Fe334E2a1081A7fdae45475CeB41&toAddress=0x9da5C4C283c2Fe334E2a1081A7fdae45475CeB41&fromAmount=100000000000000000000&fromChainId=1&toChainId=137&fromTokenAddress=0x0000000000000000000000000000000000000000&toTokenAddress=0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619&multiTx=true
#Token list: https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/all.json
from common import *
import json
import os, time
CHAIN_NAMES_BY_ID = {
    '1': 'ethereum',
    '10': 'optimism',
    '100': 'gnosis',
    '10000': 'smartbch',
    '-1': 'solana',
    '-2': 'near',
    '1024': 'clover',
    '11297108109': 'palm',
    '122': 'fuse',
    '128': 'heco',
    '1284': 'moonbeam',
    '1285': 'moonriver',
    '1287': 'moonbase',
    '1313161554': 'aurora',
    '137': 'polygon',
    '1666600000': 'harmony',
    '1666700000': 'harmony-testnet',
    '20': 'elastos',
    '25': 'cronos',
    '250': 'ftm',
    '256': 'heco-testnet',
    '288': 'boba',
    '3': 'ropsten',
    '321': 'kcc',
    '361': 'theta',
    '4': 'rinkeby',
    '40': 'telos',
    '4002': 'ftmtest',
    '42': 'kovan',
    '42161': 'arbitrum',
    '42220': 'celo',
    '43113': 'fuji',
    '43114': 'avax',
    '4689': 'iotex',
    '592': 'astar',
    '5': 'goerli',
    '56': 'bsc',
    '1818': 'cube',
    '65': 'okex-testnet',
    '66': 'okex',
    '70': 'hoo',
    '80001': 'mumbai',
    '82': 'meter',
    '88': 'tomochain',
    '97': 'bsc-testnet',
    '9001': 'evmos',
}


# generate supported tokens and used offline. Can be called periodically to update the latest supported tokens on bungee
def get_supported_tokens():
    url = 'https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/all.json'
    response = sess.get(url=url).json()
    with open("./via/supported_tokens.json", "w") as outfile:
        json.dump(response, outfile)


get_supported_tokens()