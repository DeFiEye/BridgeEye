curl 'localhost:8587/v1/crosschain/estimateFee/across?token=USDC&srcchain=Ethereum&dstchain=Arbitrum&amount=1000' \
  --compressed

curl 'localhost:8587/v1/crosschain/estimateFee/hyphen?token=USDC&srcchain=Ethereum&dstchain=Arbitrum&amount=1000' \
  --compressed