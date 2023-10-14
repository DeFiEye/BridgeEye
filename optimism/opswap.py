from web3 import Web3
from web3 import HTTPProvider
import time
from web3.middleware import geth_poa_middleware
import json
import os.path
from config import op_provider

# Pool
pool_names = ['Uni WETH-OP-0.3%','Uni OP-USDC-0.3%']
pool_addresses = ['0x68f5c0a2de713a54991e01858fd27a3832401849','0x1C3140aB59d6cAf9fa7459C6f83D4B52ba881d36']
coin_names = [['WETH','OP'],['OP','USDC']]
# swap event topic
swap_event_topic = {"Uni":'0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67'}
threshhold = 10000
data_len = 200
file_path = "./cache/op_swap.json"

coin = {
    "USDC":{
        "address":'0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        "decimal":1e6
    },
    "OP":{
        "address":'0x4200000000000000000000000000000000000042',
        "decimal":1e18
    },
    "WETH":{
        "address":'0x4200000000000000000000000000000000000006',
        "decimal":1e18
    }
}


def twos_complement(hex_str, num_bits):
    bin_str = bin(int(hex_str, 16))[2:]
    value = (int(bin_str, 2) ^ (1 << num_bits) - 1) + 1
    if bin_str[0] == '1':
        value = -value
    return value


class Swap:

    def __init__(self):
        self.web3 = Web3(HTTPProvider(op_provider))
        for i in self.web3:
            i.middleware_onion.inject(geth_poa_middleware, layer=0)
        self.index = 2
        self.fliters = []
        self.now_block = self.web3.eth.blockNumber - 200
        for i in range(len(pool_names)):
            host = pool_names[i].split(" ")[0]
            topic = swap_event_topic[host]
            address = pool_addresses[i]
            self.fliters.append({"address":Web3.toChecksumAddress(address),"name":pool_names[i],"topic":topic,"host":host,"coins":coin_names[i]})
        self.data = json.load(open(file_path)) if os.path.exists(file_path) else {}
        self.run()

    def run(self):
        while True:
            try:
                # self.index+=1
                new_block = self.web3.eth.blockNumber
                print(self.now_block,new_block,"swap")
                if new_block - self.now_block >= 200:
                    for i in self.fliters:
                        filter = self.web3.eth.filter({
                            "fromBlock": max(self.now_block+1,new_block-400),
                            "toBlock": new_block,
                            "address": i['address'],
                            "topics": [
                                i['topic']
                            ]
                        })
                        log_entries = filter.get_all_entries()
                        for j in log_entries:
                            block = j['blockNumber']
                            timestamp = self.web3.eth.getBlock(int(block)).timestamp
                            hash = j['transactionHash'].hex()
                            address = j['address']
                            topics = j['topics']
                            event_data = j['data']
                            split_event_data = []
                            index = 2
                            while index<len(event_data):
                                split_event_data.append(event_data[index:index+64])
                                index+=64
                            for k in range(len(topics)):
                                topics[k] = topics[k].hex()
                            if i['host']=='Uni':
                                if int(split_event_data[1],16) > 0 and int(split_event_data[1],16) < 1e50:
                                    from_volume = -int(twos_complement(split_event_data[0], 64*4))/coin[i['coins'][0]]['decimal']
                                    to_volume = int(split_event_data[1],16)/coin[i['coins'][1]]['decimal']
                                    if i['coins'][1]=='OP' and to_volume>threshhold or i['coins'][0]=='OP' and from_volume>threshhold:
                                        if block not in self.data.keys():
                                            self.data[block] = []
                                        self.data[block].append({"timestamp":timestamp,"swapFrom":i['coins'][0],'swapTo':i['coins'][1],'fromVolume':from_volume,'toVolume':to_volume,'transcationHash':hash,'pool_address':address,"pool_name":i['name']})
                                else:
                                    from_volume = -int(twos_complement(split_event_data[1], 64*4))/coin[i['coins'][1]]['decimal']
                                    to_volume = int(split_event_data[0],16)/coin[i['coins'][0]]['decimal']
                                    if i['coins'][0]=='OP' and to_volume>threshhold or i['coins'][1]=='OP' and from_volume>threshhold:
                                        if block not in self.data.keys():
                                            self.data[block] = []
                                        self.data[block].append({"timestamp":timestamp,"swapFrom":i['coins'][1],'swapTo':i['coins'][0],'fromVolume':from_volume,'toVolume':to_volume,'transcationHash':hash,'pool_address':address,"pool_name":i['name']})                 
                    if len(self.data.keys())>data_len:
                        key_list = sorted(list(self.data.keys()), key=lambda x: int(x))
                        for i in key_list[:-data_len]:
                            del self.data[i]
                    self.now_block = new_block
                    with open(file_path, "w") as output:
                        json.dump(self.data, output)
            except Exception as e:
                print(e)
                time.sleep(30)
            time.sleep(90)


if __name__ == '__main__':
    Swap()
