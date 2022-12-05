import { FakeContract } from '@defi-wonderland/smock';
import { ERC20Mock, ERC721Mock, Metahub } from '@iqprotocol/solidity-contracts-nft/typechain';
import { ethers } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { ERC20RewardWarper } from '../../../typechain';
import { shouldBehaveLikeERC20RewardWarper } from './erc20-reward-warper.behaviour';
import { unitFixtureERC20RewardWarper } from './erc20-reward-warper.fixture';

export function unitTestERC20RewardWarper(): void {
  const FIXED_PRICE_WITH_REWARD_TOKENS = [1, 2, 3];
  const FIXED_PRICE_TOKENS = [4, 5];

  describe('ERC20RewardWarper', function () {
    const fixture = async (): Promise<{
      warper: ERC20RewardWarper;
      metahubMock: FakeContract<Metahub>;
      warperMock: FakeContract<ERC20RewardWarper>;
      baseToken: ERC20Mock;
      rewardToken: ERC20Mock;
      originalCollection: ERC721Mock;
    }> => unitFixtureERC20RewardWarper();

    beforeEach(async function () {
      this.timeout(120000); // initial deployment may take time
      const { warper, metahubMock, warperMock, baseToken, rewardToken, originalCollection } = await this.loadFixture(
        fixture,
      );

      this.contracts.warper = warper;
      this.mocks.metahub = metahubMock;
      this.mocks.warper = warperMock;
      this.mocks.assets.baseToken = baseToken;
      this.mocks.assets.rewardToken = rewardToken;
      this.mocks.assets.originalCollection = originalCollection;

      // Mint the original tokens
      for (const iterator of [...FIXED_PRICE_WITH_REWARD_TOKENS, ...FIXED_PRICE_TOKENS]) {
        await originalCollection.mint(this.signers.named.lister.address, iterator);
      }
      await baseToken.mint(this.signers.named.renter.address, parseEther('10000000000'));
      await baseToken.connect(this.signers.named.renter).approve(metahubMock.address, ethers.constants.MaxUint256);
      await rewardToken.mint(this.signers.named.authorizedCaller.address, parseEther('10000000000'));
      await rewardToken
        .connect(this.signers.named.authorizedCaller)
        .approve(metahubMock.address, ethers.constants.MaxUint256);
      await warper.setAuthorizationStatus(this.signers.named.authorizedCaller.address, true);
    });

    shouldBehaveLikeERC20RewardWarper();
  });
}
