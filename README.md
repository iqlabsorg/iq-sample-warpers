# IQ NFT Collection

[![Node.js CI](https://github.com/iqlabsorg/iq-nft-collection/actions/workflows/node.js.yml/badge.svg)](https://github.com/iqlabsorg/iq-nft-collection/actions/workflows/node.js.yml)

## Deployment

```shell
# Deploy the NFT
yarn hardhat deploy:nft --name "IQ NFT Collection" --symbol "IQNFT" --supply [65, 25, 7, 3]

# Deploy the NFT Warper
yarn hardhat deploy:warper --original 0x0000000000000000000000000000000000000000 --metahub 0x0000000000000000000000000000000000000000 --tier-rewards-per-second [10, 20, 30, 40]

```

## Listing
```shell
yarn hardhat metahub:list-tokens --metahub 0xECC...7e3 --original 0x7a2...814F  --lock 604800 --price 1000 --payout
false --tokens [1,2,3,4,5]
```
