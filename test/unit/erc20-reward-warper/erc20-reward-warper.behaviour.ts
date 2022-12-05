import { shouldBehaveLikeOnJoinTournament } from './effects/on-join-tournament';
import { shouldBehaveLikeSupportsInterface } from './view/supports-interface';
import { shouldBehaveLikeDistributeRewards } from './effects/distribute-reward';
import { shouldBehaveLikeOnRent } from './effects/on-rent';

export function shouldBehaveLikeERC20RewardWarper(): void {
  describe('Effects Functions', function () {
    describe('__onRent', function () {
      shouldBehaveLikeOnRent();
    });

    describe('distributeRewards', function () {
      shouldBehaveLikeDistributeRewards();
    });

    describe('onJoinTournament', function () {
      shouldBehaveLikeOnJoinTournament();
    });
  });

  describe('View Functions', function () {
    describe('supportsInterface', function () {
      shouldBehaveLikeSupportsInterface();
    });
  });
}
