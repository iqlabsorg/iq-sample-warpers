import { subtask, task, types } from "hardhat/config";
import { BigNumber } from "ethers";
import {
  AccountId,
  AssetId,
  MetahubAdapter,
  Multiverse,
} from "@iqprotocol/multiverse";
import chaiAsPromised from "chai-as-promised";
import chai from "chai";
import { TASK_TEST_SETUP_TEST_ENVIRONMENT } from "hardhat/builtin-tasks/task-names";

import "./warper";
import "./auth";
import { ERC721Mock__factory } from "@iqprotocol/solidity-contracts-nft/typechain";

//eslint-disable-next-line @typescript-eslint/require-await
subtask(TASK_TEST_SETUP_TEST_ENVIRONMENT, async (): Promise<void> => {
  //eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  chai.use(chaiAsPromised);
});

task("metahub:list-tokens", "List tokens for renting")
  .addParam("metahub", "METAHUB address", undefined, types.string, false)
  .addParam(
    "original",
    "Original collection address",
    undefined,
    types.string,
    false
  )
  .addParam(
    "tokens",
    "An array of token IDs to be listed",
    undefined,
    types.json,
    false
  )
  .addParam("lock", "Listing max lock period", undefined, types.int, false)
  .addParam(
    "price",
    "Listing price (baseTokens/second)",
    undefined,
    types.string,
    false
  )
  .addParam("payout", "Listing immediate payout", false, types.boolean, true)
  .addParam("rewardPercent", "Listers reward percent", 0, types.int, true)
  .setAction(
    async (
      args: {
        metahub: string;
        original: string;
        tokens: number[];
        lock: number;
        price: string;
        payout: boolean;
        rewardPercent: number;
      },
      hre
    ) => {
      const lister = await hre.ethers.getNamedSigner('lister');

      console.log("Listing params:", args);

      console.log("Connecting to metahub...");
      const multiverse = await Multiverse.init({
        signer: lister,
      });
      const chainId = await multiverse.getChainId();
      const metahub = multiverse.metahub(
        new AccountId({ chainId, address: args.metahub })
      );
      console.log("Metahub connected!");

      const nft = new ERC721Mock__factory(lister).attach(
        args.original
      );
      const setApprovalTx = await nft.setApprovalForAll(args.metahub, true);
      console.log(`Setting Metahub approvals. Tx: ${setApprovalTx.hash}`);
      await setApprovalTx.wait();
      console.log(`Metahub is now the original collection operator.`);

      console.log("Starting Listing");
      for (const tokenId of args.tokens) {
        console.log(tokenId);
        console.log(`Listing token ${tokenId}`);
        const tx = await metahub.listAsset({
          asset: {
            id: new AssetId({
              chainId,
              assetName: {
                namespace: "erc721",
                reference: args.original,
              },
              tokenId: tokenId.toString(),
            }),
            value: 1,
          },
          strategy: args.rewardPercent === 0 ? {
            name: "FIXED_PRICE",
            data: {
              price: BigNumber.from(args.price),
            }
          } : {
            name: "FIXED_PRICE_WITH_REWARD",
            data: {
              price: BigNumber.from(args.price),
              rewardPercent: BigNumber.from(args.rewardPercent),
            }
          }
          ,
          maxLockPeriod: BigNumber.from(args.lock),
          immediatePayout: args.payout,
        });
        console.log(`Tx ${tx.hash}`);
      }

      const removeApprovalTx = await nft.setApprovalForAll(args.metahub, false);
      console.log(`Removing Metahub approvals. Tx: ${removeApprovalTx.hash}`);
      await removeApprovalTx.wait();
      console.log(`Metahub is no longer the original collection operator.`);
      console.log("Listing Complete!");
    }
  );
