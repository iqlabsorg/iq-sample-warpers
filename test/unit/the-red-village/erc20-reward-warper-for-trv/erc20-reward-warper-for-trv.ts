import {
  ERC20Mock,
} from '@iqprotocol/solidity-contracts-nft/typechain';
import { ERC20RewardWarperForTRV } from '../../../../typechain';
import { shouldBehaveLikeERC20RewardWarperForTRV } from './erc20-reward-warper-for-trv.behaviour';
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ADDRESS_ZERO } from "@iqprotocol/iq-space-sdk-js";

export function unitTestERC20RewardWarperForTRV(): void {
  describe('ERC20RewardWarperForTRV', function () {

    beforeEach(async function () {
      const fixtureERC20RewardWarperForTRV = async (): Promise<{
        erc20RewardWarperForTRV: ERC20RewardWarperForTRV;
        rewardToken: ERC20Mock;
      }> => {
        const rewardToken = (await hre.run('deploy:test:mock:erc20', {
          name: 'Reward Token',
          symbol: 'RWRD',
        })) as ERC20Mock;

        const erc20RewardWarperForTRV = (await hre.run('deploy:trv:erc20-reward-warper-for-trv', {
          original: this.mocks.assets.originalCollection.address,
          metahub: this.contracts.metahub.address,
          rewardPool: ADDRESS_ZERO,
        })) as ERC20RewardWarperForTRV;

        return {
          erc20RewardWarperForTRV,
          rewardToken,
        };
      };

      const {
        erc20RewardWarperForTRV,
        rewardToken
      } = await loadFixture(
        fixtureERC20RewardWarperForTRV,
      );

      this.contracts.theRedVillage = {
        erc20RewardWarperForTRV,
        rewardToken,
      };
    });

    shouldBehaveLikeERC20RewardWarperForTRV();
  });
}
