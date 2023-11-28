import { expect } from 'chai';
import hre from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { IERC721, IntegrationFeatureRegistry, MinimumThreshold } from '../../../../../../typechain';

export function integrationTestMinimumThreshold(): void {
  describe('MinimumThreshold', function () {
    let minimumThreshold: MinimumThreshold;
    let integrationFeatureRegistry: IntegrationFeatureRegistry;
    let erc721: IERC721;
  });

  context('Minimum Trhreshold Feature Operations', () => {
    it('should pass tests', async () => {
      console.log('test');
    });
  });
}
