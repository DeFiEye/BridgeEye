import sentry_sdk
from appconfig import SENTRY_DSN, CHROME_SERVER
from flask import Flask
from sentry_sdk.integrations.flask import FlaskIntegration
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[FlaskIntegration()],
        traces_sample_rate=0.1
    )

import sys, os
sys.path.append("..")
sys.path.append("../crosschain")
import glob, csv
from flask import *
from flask_cors import CORS
from base import *
from runsql import *
from functools import lru_cache
import subprocess
app = Flask(__name__)
CORS(app)
@app.route("/")
def view_test():
    return "hello"


from common import *

def bridge_fee(amt, bridge,srcchain,srctoken,dstchain,dsttoken,srctoken_contract,dsttoken_contract,srcholder,dstholder,isopen,fee_fixed,fee_percent,fee_minfee,fee_maxfee,minamount,liquidity,extra):
    #status, infos, received, fee_gasfee, stat_info, time_info
    #print(amt, bridge,srcchain,srctoken,dstchain,dsttoken,srctoken_contract,dsttoken_contract,srcholder,dstholder,isopen,fee_fixed,fee_percent,fee_minfee,fee_maxfee,minamount,liquidity,extra)
    amt, fee_fixed,fee_percent,fee_minfee,fee_maxfee,minamount,liquidity = map(lambda i:float(i) if i and i!="?" else 0, [amt, fee_fixed,fee_percent,fee_minfee,fee_maxfee,minamount,liquidity])
    if extra == "":
        extra = {}
    else:
        extra = json.loads(extra)
    if not isopen:
        return "bridge closed", [], "", 0, "", ""
    minamt = max(fee_fixed, fee_minfee, minamount)
    if amt<minamt:
        return f"amount not enough, should be greater than {minamt} {srctoken}", [], "", 0, "", ""
    if liquidity>0 and amt>liquidity:
        return f"bridge liquidity not enough, can only send {liquidity} {srctoken}", [], "", 0, "", ""
    fee = 0
    infos = []
    if fee_fixed>0:
        fee += fee_fixed
        infos.append([f"Fixed Fee", f"{fee_fixed} {srctoken}"])
    if fee_percent>0:
        fee2 = amt*fee_percent/100
        fee += fee2
        infos.append([f"Percentage Fee", f"{fee_percent}% = {fee2} {srctoken}"])
    if fee_minfee>0:
        if fee<fee_minfee:
            fee = fee_minfee
            infos.append([f"Min Fee", f"{fee_minfee} {srctoken}"])
    if fee_maxfee>0:
        if fee>fee_maxfee:
            fee = fee_maxfee
            infos.append([f"Max Fee", f"{fee_maxfee} {srctoken}"])
    if "nativeFee" in extra:
        infos.append(["Fee (srcChain native)", "{:.5f} {}".format(*extra["nativeFee"])])
    return "ok", infos, amt-fee, 0, "", ""

CHAINLIST = {i["chainId"]:i for i in sess.get("https://chainid.network/chains.json").json()}

def normalize_chainname(name):
    name = {"SOL": "Solana", "AVAX":"Avalanche", "AVAXC":"Avalanche", "MOVR":"Moonriver", "BNB":"BEP2", "IOTX":"IoTeX",}.get(name, name)
    if name.isdigit() and int(name) in CHAINLIST:
        name = CHAINLIST[int(name)]['chain']
    return name

def crosschain_filter(bridge=None):
    alldata = []
    for i in glob.glob("../crosschain/*.txt"):
        reader = csv.reader(open(i))
        title = next(reader)
        for line in reader:
            line[1], line[3] = normalize_chainname(line[1]), normalize_chainname(line[3])
            alldata.append(line)
    if request.args.get("srcchain", None):
        alldata = list(filter(lambda i:i[1]==request.args.get("srcchain"), alldata))
    if request.args.get("dstchain", None):
        alldata = list(filter(lambda i:i[3]==request.args.get("dstchain"), alldata))
    if request.args.get("token", None):
        tokenlist = [request.args.get("token")]
        if request.args.get("token")=="ETH":
            tokenlist.append("WETH")
        alldata = list(filter(lambda i:i[2] in tokenlist or i[4] in tokenlist, alldata))
    if bridge:
        alldata = list(filter(lambda i:i[0]==bridge, alldata))
    return title, alldata

@app.route("/api/v1/crosschain/raw")
def view_crosschain_raw():
    title, alldata = crosschain_filter()
    return jsonify([title]+alldata)

hop_all = []
for srcchain in ["Ethereum", "xDAI", "Polygon", "Arbitrum", "Optimism"]:
    for dstchain in ["Ethereum", "xDAI", "Polygon", "Arbitrum", "Optimism"]:
        if srcchain == dstchain:
            continue
        for token in ["ETH", "USDC", "USDT", "DAI", "MATIC"]:
            if token=="MATIC" and (srcchain in ["Arbitrum", "Optimism"] or dstchain in ["Arbitrum", "Optimism"]):
                continue
            hop_all.append(["hop", srcchain, token, dstchain, token, "LOAD", [], "0", "0", "", ""])

def hook_from_tokenlist(alltokens):
    def f_hook(amt, srcchain, dstchain, token):
        h = alltokens
        if srcchain:
            h = list(filter(lambda i:i[1]==srcchain, h))
        if dstchain:
            h = list(filter(lambda i:i[3]==dstchain, h))
        if token:
            h = list(filter(lambda i:i[2] == token or i[4] == token, h))
        print(h)
        return h
    return f_hook

hop_hook = hook_from_tokenlist(hop_all)

synapse_all = []
synapse_seen = set()
synapse_available = []
try:
    synapse_available = json.load(open("../crosschain/synapsejs/synapse_options.json"))
    for srcchain,srctoken,dstchain,dsttoken in synapse_available:
        for token in [srctoken, dsttoken]:
            if (srcchain, token, dstchain) in synapse_seen:
                continue
            synapse_seen.add((srcchain, token, dstchain))
            synapse_all.append(["synapse", srcchain, token, dstchain, token, "LOAD", [], "0", "0", "", ""])
except:
    traceback.print_exc()
synapse_hook = hook_from_tokenlist(synapse_all)

def ratiochange2feepercent(ratio1, ratio2, feerate):
    bar, r0, r1, r2 = feerate
    apy = r0
    assert ratio1<ratio2, "wrong ratio"
    k1 = r1/bar #y = k1*x
    k2 = r2/(100-bar) #y = r1 + k2*(x-bar)
    if ratio2<=bar:
        apy += k1*(ratio1+ratio2)/2
    elif ratio1>=bar:
        apy += r1 + k2*(ratio1-bar+ratio2-bar)/2
    else:
        area1 = (k1*ratio1 + r1)*(bar-ratio1)/2
        area2 = (r1 + r1 + k2*(ratio2-bar))*(ratio2-bar)/2
        apy += (area1+area2)/(ratio2-ratio1)
    return (1+apy/100)**(1/52)-1

def acrossto_hook(amt, srcchain, dstchain, token):
    res = []
    try:
        across_json = json.load(open("../crosschain/acrossto.json"))
    except:
        traceback.print_exc()
        return []
    items = [i for i in across_json if i["name"]==token and i["from"]==srcchain and i["to"]==dstchain]
    if not items:
        return []
    for i in items:
        fee_percent = ratiochange2feepercent(100*i["pool_used"]/i["pool_total"], 100*(i["pool_used"]+amt)/i["pool_total"], i["feerate"])
        fee_lp = amt*fee_percent
        fee_info = [
            ["Relayer Gas Fee", f"{i['fee_gas']:.4f} {i['name']}"],
            ["(Gas Price", f"{i['gasprice']:.1f} Gwei)"],
            ["LP Fee", f"{fee_lp:.4f} {i['name']} ({100*fee_percent:.2f}%)"],
        ]
        received = amt - i['fee_gas'] - fee_lp
        if amt>i['liquidity']:
            res.append(["acrossto", i["from"], i["name"], i["to"], i["name"], f"bridge liquidity not enough, can only send {i['liquidity']:.4f} {i['name']}", [], 0, 0, "", ""])
        elif received > 0:
            res.append(["acrossto", i["from"], i["name"], i["to"], i["name"], "ok_LOAD", fee_info, received, 0, "", "1~3min"])
        else:
            res.append(["acrossto", i["from"], i["name"], i["to"], i["name"], f"amount not enough, gas fee ({i['fee_gas']:.4f} {i['name']}) too high", [], 0, 0, "", ""])
    return res

@app.route("/api/v1/crosschain/estimateFee/acrossto")
def view_crosschain_estimateFee_acrossto():
    from acrossto import acrossto_query
    amt = float(request.args["amount"])
    srcchain, dstchain, token = request.args.get("srcchain", None), request.args.get("dstchain", None), request.args.get("token", None)
    outvalue, gastoken, fee_lp, gasprice, fee_lp_percent, liquidity = acrossto_query(srcchain, dstchain, token, amt, int(time.time()//10))
    title = ["bridge", "srcchain","srctoken","dstchain","dsttoken", "fee_status", "fee_info", "received", "fee_gasvalue", "stat_info", "time_info"]
    fee_info = [
        ["Relayer Gas Fee", f"{gastoken:.4f} {token}"],
        ["(Gas Price", f"{gasprice:.1f} Gwei)"],
        ["LP Fee", f"{fee_lp:.4f} {token} ({fee_lp_percent:.2f}%)"],
    ]
    if amt>liquidity:
        res = [["acrossto", srcchain, token, dstchain, token, f"bridge liquidity not enough, can only send {liquidity:.4f} {token}", [], 0, 0, "", ""]]
    elif outvalue>0:
        res = [["acrossto", srcchain, token, dstchain, token, "ok", fee_info, outvalue, 0, "", "1~3min"]]
    else:
        res = [["acrossto", srcchain, token, dstchain, token, f"amount not enough, gas fee ({gastoken:.4f} {token}) too high", [], 0, 0, "", ""]]
    return jsonify([{title[idx]: item[idx] for idx in range(len(item))} for item in res])

@app.route("/api/v1/crosschain/estimateFee/synapse")
def view_crosschain_estimateFee_synapse():
    amt = float(request.args["amount"])
    srcchain, dstchain, token = request.args.get("srcchain", None), request.args.get("dstchain", None), request.args.get("token", None)
    if (srcchain, token, dstchain) not in synapse_seen:
        return abort(400)
    candidates = []
    for _srcchain,_srctoken,_dstchain,_dsttoken in synapse_available:
        if (srcchain, dstchain) != (_srcchain, _dstchain):
            continue
        if _srctoken==token and _dsttoken==token:
            candidates = [[_srcchain,_srctoken,_dstchain,_dsttoken]]
            break
        elif _srctoken==token or _dsttoken==token:
            candidates.append([_srcchain,_srctoken,_dstchain,_dsttoken])
    #if len(candidates)>1:
    #    print("warning: multiple candidates:", candidates)
    title = ["bridge", "srcchain","srctoken","dstchain","dsttoken", "fee_status", "fee_info", "received", "fee_gasvalue", "stat_info", "time_info"]
    res = []
    for srcchain,srctoken,dstchain,dsttoken in candidates:
        print({"srcchainid": chainname2id(srcchain), "srctoken":srctoken, "dstchainid":chainname2id(dstchain), "dsttoken":dsttoken, "amount":str(amt)})
        x=sess.post("http://127.0.0.1:3000", {"srcchainid": chainname2id(srcchain), "srctoken":srctoken, "dstchainid":chainname2id(dstchain), "dsttoken":dsttoken, "amount":str(amt)})
        if x.status_code == 200:
            received, bridgefee = x.json()
            received, bridgefee = float(received), float(bridgefee)
            lp_fee = (amt-bridgefee-received)
            lp_ratio = 100*lp_fee/amt
            if received>0:
                res.append(["synapse", srcchain, srctoken, dstchain, dsttoken, "ok", [
                    ["Bridge Fee", f"{bridgefee:.4f} {srctoken}"], 
                    ["LP Fee", f"{lp_fee:.4f} {srctoken} ({lp_ratio:.1f}%)"]
                ], received, 0, "", ""])
            else:
                res.append(["synapse", srcchain, srctoken, dstchain, dsttoken, f"amount not enough, bridge fee ({bridgefee:.4f} {srctoken}) too high", [], 0, 0, "", ""])
        else:
            res.append(["synapse", srcchain, srctoken, dstchain, dsttoken, f"internal error, please query later", [], 0, 0, "", ""])
    return jsonify([{title[idx]: item[idx] for idx in range(len(item))} for item in res])

HOOK_FUNCS = [hop_hook, acrossto_hook, synapse_hook]
@app.route("/api/v1/crosschain/estimateFee")
def view_crosschain_estimateFee():
    title, alldata = crosschain_filter()
    res = []
    amt = float(request.args["amount"])
    title = ["bridge", "srcchain","srctoken","dstchain","dsttoken", "fee_status", "fee_info", "received", "fee_gasvalue", "stat_info", "time_info"]
    for item in alldata:
        bridge,srcchain,srctoken,dstchain,dsttoken = item[:5]
        fee_info = list(bridge_fee(amt, *item))
        if bridge == "cbridge":
            if fee_info[0] == "ok":
                fee_info[0] = "ok_LOAD"
            else:
                fee_info[0] = "LOAD"
        res.append([bridge,srcchain,srctoken,dstchain,dsttoken]+fee_info)
    for hook_func in HOOK_FUNCS:
        if all([request.args.get("srcchain", None), request.args.get("dstchain", None), request.args.get("token", None)]):
            res.extend(hook_func(amt, request.args.get("srcchain", None), request.args.get("dstchain", None), request.args.get("token", None)))
    return jsonify([{title[idx]: item[idx] for idx in range(len(item))} for item in res])
    
_chain2id = {i.split(":")[1]:i.split(":")[0] for i in CHAINID2NAME_DICT.strip().split("\n")}
def chain2id(c):
    return int(_chain2id[c])

@lru_cache()
def cbridge_conf():
    conf = sess.get("https://cbridge-prod2.celer.network/v2/getTransferConfigs").json()
    return conf

@app.route("/api/v1/crosschain/estimateFee/cbridge")
def view_crosschain_estimateFee_cbridge():
    title, alldata = crosschain_filter(bridge="cbridge")
    res = []
    amt = float(request.args["amount"])
    title = ["bridge", "srcchain","srctoken","dstchain","dsttoken", "fee_status", "fee_info", "received", "fee_gasvalue", "stat_info", "time_info"]
    DECIMALS = {}
    conf = cbridge_conf()
    for c1 in conf["chains"]:
        for t1 in conf["chain_token"][str(c1["id"])]["token"]:
            t1 = t1["token"]
            DECIMALS[(t1["symbol"], c1["id"])]=t1["decimal"]
    for item in alldata:
        bridge,srcchain,srctoken,dstchain,dsttoken = item[:5]
        fromchainid, tochainid = chain2id(srcchain), chain2id(dstchain)
        amount = int(amt*10**DECIMALS[srctoken, fromchainid])
        fee_info = list(bridge_fee(amt, *item)) #status, infos, received, fee_gasfee, stat_info, time_info
        #x = sess.post('https://cbridge-api.celer.network/v1/findQualifiedRelayNodeToTransfer', json={"fromChainId":fromchainid,"toChainId":tochainid,"token":srctoken,"amount":str(amount)})
        x = sess.post('https://cbridge-prod2.celer.network/v2/estimateAmt', data={"src_chain_id":fromchainid,"dst_chain_id":tochainid,"token_symbol":srctoken,"amt":str(amount), "slippage_tolerance":500})
        d = x.json()
        print(d, x.request.body)
        if d["err"]:
            if "no liquidity on dest chain" in d["err"]:
                fee_info[0] = "no liquidity"
            else:
                fee_info[0] = str(d["err"])
        else:
            fee_info[0] = "ok"
            print(d)
            fee_info[1].insert(0, ["Total (real)", amt - int(d['estimated_receive_amt'])/10**DECIMALS[dsttoken, tochainid] ])
            fee_info[2] = int(d['estimated_receive_amt'])/10**DECIMALS[dsttoken, tochainid]
            if fee_info[2]<0:
                fee_info[0] = "not enough amount, should be greater than "+str(int(d["feeAmount"])/10**DECIMALS[srctoken, tochainid])+" "+srctoken
        res.append([bridge,srcchain,srctoken,dstchain,dsttoken]+fee_info)
    #status, infos, received, fee_gasfee, stat_info, time_info
    return jsonify([{title[idx]: item[idx] for idx in range(len(item))} for item in res])

def chain2hopchain(c):
    c = c.lower()
    return {"xdai":"gnosis"}.get(c, c)

class HopException(Exception):
    def __init__(self, data):
        self.data = data

HOP_DECIMALS = {
    "Ethereum": {"USDC": 6, "USDT": 6, "MATIC": 18, "DAI": 18, "ETH": 18, "WBTC": 8}, 
    "xDAI": {"USDC": 6, "USDT": 6, "MATIC": 18, "DAI": 18, "ETH": 18, "WBTC": 8}, 
    "Polygon": {"USDC": 6, "USDT": 6, "MATIC": 18, "DAI": 18, "ETH": 18, "WBTC": 8}, 
    "Optimism": {"USDC": 6, "USDT": 6, "DAI": 18, "ETH": 18, "WBTC": 8}, 
    "Arbitrum": {"USDC": 6, "USDT": 6, "DAI": 18, "ETH": 18, "WBTC": 8}
}
@lru_cache(256)
def cached_hop_query_old(token, srcchain, dstchain, amount, ts):
    url = f"{CHROME_SERVER}/hop?token={token}&srcchain={chain2hopchain(srcchain)}&dstchain={chain2hopchain(dstchain)}&amount={amount}"
    x = sess.get(url).json()
    if x["error"]:
        raise HopException(x)
    return x

@lru_cache(256)
def cached_hop_query(token, srcchain, dstchain, amount, ts):
    amt = str(int(amount*10**HOP_DECIMALS[srcchain][token]))
    data = json.loads(subprocess.check_output(["node", "../crosschain/hopjs/gethop.js", token, amt, chain2hopchain(srcchain), chain2hopchain(dstchain)]))
    D = HOP_DECIMALS[dstchain][token]
    received = float(data["estimatedReceived"])/10**D
    amountOut = float(data["amountOut"])/10**D
    slippage_fee = amount-amountOut
    bonder_fee = float(data["adjustedBonderFee"])/10**D
    tx_fee = float(data["adjustedDestinationTxFee"])/10**D
    return {"received":"%.4f"%received, "slippage_fee":"%.4f"%(slippage_fee), "bonder_fee":"%.4f"%bonder_fee, "tx_fee":"%.4f"%tx_fee, "error":""}

@app.route("/api/v1/crosschain/estimateFee/hop")
def view_crosschain_estimateFee_hop():
    bridge = "hop"
    srcchain, dstchain, token = request.args["srcchain"], request.args["dstchain"], request.args["token"]
    assert srcchain in ["Ethereum", "xDAI", "Polygon", "Arbitrum", "Optimism"]
    assert dstchain in ["Ethereum", "xDAI", "Polygon", "Arbitrum", "Optimism"]
    assert token in ["ETH", "USDC", "USDT", "DAI", "MATIC"]
    if token == "MATIC":
        assert srcchain not in ["Arbitrum", "Optimism"]
        assert dstchain not in ["Arbitrum", "Optimism"]
    amount = float(request.args["amount"])
    try:
        x = cached_hop_query(token, srcchain, dstchain, amount, int(time.time()/60))
    except HopException as ex:
        x = ex.data
    except:
        raise
    res = []
    title = ["bridge", "srcchain","srctoken","dstchain","dsttoken", "fee_status", "fee_info", "received", "fee_gasvalue", "stat_info", "time_info"]
    err =  x["error"]
    if err:
        fee_info = [err, [], 0, 0, "", ""]
    else:
        fee_info = ["ok", [["slippage", x["slippage_fee"]], ["bonder fee", x["bonder_fee"]], ["tx fee (paid to bonder)", x["tx_fee"]]], float(x["received"].split(" ")[0]), 0, "", ""]
    res.append([bridge,srcchain,token,dstchain,token]+fee_info)
    return jsonify([{title[idx]: item[idx] for idx in range(len(item))} for item in res])

@app.route("/api/v1/crosschain/choices")
def view_crosschain_choices():
    title, alldata = crosschain_filter()
    srcchains = set(i[1] for i in alldata)
    dstchains = set(i[3] for i in alldata)
    tokens = set(i[2] for i in alldata)|set(i[4] for i in alldata)
    return jsonify({"srcchains":sorted(srcchains), "dstchains":sorted(dstchains), "tokens":sorted(tokens)})

@app.route("/api/v1/crosschain/basicInfo")
def view_crosschain_basicInfo():
    return jsonify({
        "anyswapv2":{"url": "https://anyswap.exchange/bridge#/bridge", "note":"Mapping based", "display_name":"Anyswap Bridge"},
        "anyswapv3":{"url":"https://anyswap.exchange/bridge#/router", "note":"Pool based", "display_name":"Anyswap Router"},
        #"xpollinatev1": {"url":"https://v1.xpollinate.io/", "note":"Pool based, CONNEXT", "display_name":"xpollinate v1"},
        "xpollinatev2": {"url":"https://bridge.connext.network/", "note":"Pool based", "display_name":"Connext Bridge"},
        "renbridge": {"url":"https://bridge.renproject.io/mint", "note":"Mapping based, only support non-EVM tokens", "display_name":"RenBridge"},
        "cbridge": {"url":"https://cbridge.celer.network/#/transfer", "note":"Pool based", "display_name":"cBridge"},
        "binancebridge": {"url":"https://www.binance.org/en/bridge", "note":"CEX based, equal to Binance; free into BSC", "display_name":"Binance Bridge"},
        "hop":{"url":"https://app.hop.exchange/send?token=USDC", "note":"Mapping based", "display_name":"Hop Exchange"},
        "allbridge":{"url":"https://app.allbridge.io/bridge", "note":"Pool+Mapping based", "display_name":"Allbridge"},
        "terrabridge":{"url":"https://bridge.terra.money/", "note":"Mapping based", "display_name":"Terra Bridge"},
        "relay":{"url":"https://app.relaychain.com/#/cross-chain-bridge-transfer", "note":"Mapping based", "display_name":"Relay"},
        "acrossto":{"url":"https://across.to/", "note":"Pool based", "display_name":"Across.to"},
        "orbiter":{"url":"https://www.orbiter.finance/", "note":"Pool based", "display_name":"Orbiter"},
        "synapse":{"url":"https://synapseprotocol.com/", "note":"Pool based", "display_name":"Synapse Bridge"},
        "stargate":{"url":"https://stargate.finance/transfer", "note":"", "display_name":"stargate"},
        #cex
        "huobi":{"url":"https://www.huobi.com/", "note":"Huobi Exchange", "display_name":"Huobi (CEX)"},
        "binance":{"url":"https://www.binance.com/", "note":"Binance Exchange", "display_name":"Binance (CEX)"},
        "okx":{"url":"https://www.okx.com/", "note":"OKX Exchange", "display_name":"OKX (CEX)"},
        "ftx":{"url":"https://ftx.com/", "note":"FTX Exchange", "display_name":"FTX (CEX)"},
        "kucoin":{"url":"https://www.kucoin.com/", "note":"KuCoin Exchange", "display_name":"KuCoin (CEX)"},
        "mxc":{"url":"https://www.mexc.com/", "note":"MEXC Exchange", "display_name":"MXC (CEX)"},
        "hotbit":{"url":"https://www.hotbit.io/", "note":"Hotbit Exchange", "display_name":"Hotbit (CEX)"},
        "gateio":{"url":"https://www.gate.io/", "note":"Gate.io Exchange", "display_name":"Gate.io (CEX)"},
        "ascendex":{"url":"https://ascendex.com/", "note":"AscendEx Exchange", "display_name":"AscendEx (CEX)"},
        "bybit":{"url":"https://www.bybit.com/", "note":"Bybit Exchange", "display_name":"Bybit (CEX)"},
    })

if __name__ == "__main__":
    from pprint import pprint
    if os.getuid()!=0:
        app.run(port=16487, host="0.0.0.0", debug=os.environ.get("DEBUG", "")!="")
