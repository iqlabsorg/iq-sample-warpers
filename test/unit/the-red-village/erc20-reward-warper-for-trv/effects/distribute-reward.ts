// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import hre, { ethers } from 'hardhat';
// import { FakeContract, MockContract } from '@defi-wonderland/smock';
// import { ERC20Mock, ERC721Mock, Metahub } from '@iqprotocol/solidity-contracts-nft/typechain';
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import { Auth, ContractRegistryMock, ERC20RewardDistributorMock, ERC20RewardWarper } from '../../../../../typechain';
// import { BytesLike, defaultAbiCoder, keccak256, parseEther } from 'ethers/lib/utils';
// import { CONTRACT_REGISTRY_KEY_IDS, HUNDRED_PERCENT, HUNDRED_PERCENT_PRECISION_4 } from '../../../../../src/constants';
// import {
//   EarningType,
//   MockAgreementTerms,
//   MockAsset,
//   MockListingTerms,
//   MockPaymentTokenData,
//   MockRentalAgremeent,
//   MockRentalEarnings,
//   MockTaxTerms,
// } from '../utils/types';
// import {
//   makeAgreementTerms,
//   makeERC721Asset,
//   makeListingTermsFixedRate,
//   makeListingTermsFixedRateWithReward,
//   makePaymentTokenData,
//   makeProtocolEarning,
//   makeRentalAgreement,
//   makeRentalEarnings,
//   makeTaxTermsFixedRate,
//   makeTaxTermsFixedRateWithReward,
//   makeUniverseEarning,
//   makeUserEarning,
// } from '../utils/helpers';
// import { BigNumber } from 'ethers';
// import { expect } from 'chai';
// import { latestBlockTimestamp } from '../../../../shared/utils/general-utils';
//
// export function shouldBehaveLikeDistributeRewards(): void {
//   /**** Constants ****/
//   const FIXED_PRICE_WITH_REWARD_TOKENS = [1, 2, 3];
//   const FIXED_PRICE_TOKENS = [4, 5];
//   const RENT_PRICE = parseEther('10');
//   const RENT_REWARD = parseEther('2');
//   const GLOBAL_SERVICE_ID = 111;
//   const GLOBAL_TOURNAMENT_ID = 222;
//   const GLOBAL_RENTAL_PERIOD = 3600;
//   const GLOBAL_BASE_RATE = BigNumber.from(1000);
//   const GLOBAL_REWARD_PERCENTAGE = '10';
//   const GLOBAL_UNIVERSE_TAX_RATE = '25';
//   const GLOBAL_UNIVERSE_REWARD_TAX_RATE = '30';
//   const GLOBAL_PROTOCOL_TAX_RATE = '35';
//   const GLOBAL_PROTOCOL_REWARD_TAX_RATE = '20';
//   const GLOBAL_UNIVERSE_ID = BigNumber.from(1);
//   const GLOBAL_RENTAL_ID = BigNumber.from(1);
//   const GLOBAL_TOKEN_ID = BigNumber.from(1);
//   const GLOBAL_LISTING_ID = BigNumber.from(1);
//   /**** Contracts ****/
//   let auth: Auth;
//   let erc20RewardWarper: ERC20RewardWarper;
//   /**** Mocks ****/
//   let erc20RewardWarperMock: FakeContract<ERC20RewardWarper>;
//   let metahubMock: FakeContract<Metahub>;
//   let contractRegistryMock: ContractRegistryMock;
//   let erc20RewardDistributorMock: ERC20RewardDistributorMock;
//   /**** ERC20 & ERC721 Token Mocks ****/
//   let baseToken: ERC20Mock;
//   let rewardToken: ERC20Mock;
//   let originalCollection: ERC721Mock;
//   /**** Signers ****/
//   let deployer: SignerWithAddress;
//   let lister: SignerWithAddress;
//   let renter: SignerWithAddress;
//   let metahubMockAddress: SignerWithAddress;
//   let stranger: SignerWithAddress;
//   let authorizedCaller: SignerWithAddress;
//   /**** Data Structs ****/
//   let fixedPriceWithRewardAssets: MockAsset[];
//   let fixedPriceAssets: MockAsset[];
//   let listingTerms: MockListingTerms;
//   let universeTaxTerms: MockTaxTerms;
//   let protocolTaxterms: MockTaxTerms;
//   let paymentTokenData: MockPaymentTokenData;
//   let agreementTerms: MockAgreementTerms;
//   let rentalAgreement: MockRentalAgremeent;
//   let rentalEarnings: MockRentalEarnings;
//   let rentalRewardEarnings: MockRentalEarnings;
//   /**** Variables ****/
//   let collectionId: BytesLike;
//   let rentalStartTime: number;
//   let rentalEndTime: number;
//
//   beforeEach(async function () {
//     // Contract setup
//     auth = this.contracts.auth;
//     erc20RewardWarper = this.contracts.warper;
//     // Mocks setup
//     erc20RewardWarperMock = this.mocks.warper;
//     metahubMock = this.mocks.metahub;
//     contractRegistryMock = this.mocks.contractRegistry;
//     baseToken = this.mocks.assets.baseToken;
//     rewardToken = this.mocks.assets.rewardToken;
//     originalCollection = this.mocks.assets.originalCollection;
//     // Signers setup
//     deployer = this.signers.named.deployer;
//     lister = this.signers.named.lister;
//     renter = this.signers.named.renter;
//     metahubMockAddress = this.signers.named.metahubMockAddress;
//     stranger = this.signers.unnamed[1];
//     authorizedCaller = this.signers.named.authorizedCaller;
//     // Variables setup
//     collectionId = keccak256(defaultAbiCoder.encode(['address'], [originalCollection.address]));
//     rentalStartTime = await latestBlockTimestamp();
//     rentalEndTime = rentalStartTime + GLOBAL_RENTAL_PERIOD;
//     // Structs setup
//     fixedPriceWithRewardAssets = [
//       makeERC721Asset(originalCollection.address, 1),
//       makeERC721Asset(originalCollection.address, 2),
//       makeERC721Asset(originalCollection.address, 3),
//     ];
//     fixedPriceAssets = [makeERC721Asset(originalCollection.address, 4), makeERC721Asset(originalCollection.address, 5)];
//     listingTerms = makeListingTermsFixedRateWithReward(GLOBAL_BASE_RATE, GLOBAL_REWARD_PERCENTAGE);
//     universeTaxTerms = makeTaxTermsFixedRateWithReward(GLOBAL_UNIVERSE_TAX_RATE, GLOBAL_UNIVERSE_REWARD_TAX_RATE);
//     protocolTaxterms = makeTaxTermsFixedRateWithReward(GLOBAL_PROTOCOL_TAX_RATE, GLOBAL_PROTOCOL_REWARD_TAX_RATE);
//     paymentTokenData = makePaymentTokenData(baseToken.address, RENT_PRICE);
//     agreementTerms = makeAgreementTerms(listingTerms, universeTaxTerms, protocolTaxterms, paymentTokenData);
//     rentalAgreement = makeRentalAgreement(
//       fixedPriceWithRewardAssets,
//       GLOBAL_UNIVERSE_ID,
//       collectionId,
//       GLOBAL_LISTING_ID,
//       renter.address,
//       rentalStartTime,
//       rentalEndTime,
//       agreementTerms,
//     );
//
//     // ERC20RewardDistributorMock setup
//     const renterRewardPercentage = BigNumber.from(HUNDRED_PERCENT_PRECISION_4)
//       .sub(GLOBAL_REWARD_PERCENTAGE)
//       .sub(GLOBAL_UNIVERSE_REWARD_TAX_RATE)
//       .sub(GLOBAL_PROTOCOL_REWARD_TAX_RATE);
//     const renterEarning = RENT_REWARD.mul(renterRewardPercentage).div(HUNDRED_PERCENT);
//     const universeEarning = RENT_REWARD.mul(GLOBAL_UNIVERSE_TAX_RATE).div(HUNDRED_PERCENT);
//     const protocolEarning = RENT_REWARD.mul(GLOBAL_PROTOCOL_TAX_RATE).div(HUNDRED_PERCENT);
//     const listerEarning = RENT_REWARD.sub(renterEarning).sub(universeEarning).sub(protocolEarning);
//
//     rentalRewardEarnings = makeRentalEarnings(
//       [
//         makeUserEarning(
//           EarningType.LISTER_EXTERNAL_ERC20_REWARD,
//           true,
//           lister.address,
//           listerEarning,
//           rewardToken.address,
//         ),
//         makeUserEarning(
//           EarningType.RENTER_EXTERNAL_ERC20_REWARD,
//           true,
//           renter.address,
//           renterEarning,
//           rewardToken.address,
//         ),
//       ],
//
//       makeUniverseEarning(
//         EarningType.UNIVERSE_EXTERNAL_ERC20_REWARD,
//         GLOBAL_UNIVERSE_ID,
//         universeEarning,
//         rewardToken.address,
//       ),
//       makeProtocolEarning(EarningType.PROTOCOL_EXTERNAL_ERC20_REWARD, protocolEarning, rewardToken.address),
//     );
//
//     erc20RewardDistributorMock = await hre.run('deploy:mock:erc20-reward-distributor', {
//       listingBeneficiary: lister.address,
//       listingBeneficiaryRewardAmount: RENT_REWARD,
//       renter: renter.address,
//       renterRewardAmount: RENT_REWARD.mul(renterRewardPercentage).div(HUNDRED_PERCENT),
//       universeId: GLOBAL_UNIVERSE_ID,
//       universeRewardAmount: RENT_REWARD.mul(GLOBAL_UNIVERSE_REWARD_TAX_RATE).div(HUNDRED_PERCENT),
//       protocolRewardAmount: RENT_REWARD.mul(GLOBAL_PROTOCOL_REWARD_TAX_RATE).div(HUNDRED_PERCENT),
//     });
//
//     await contractRegistryMock.registerContract(
//       CONTRACT_REGISTRY_KEY_IDS.ERC20_REWARD_DISTRIBUTOR,
//       erc20RewardDistributorMock.address,
//     );
//   });
//
//   context('when caller is authorized', () => {
//     context('when distributed correctly', () => {
//       beforeEach(function () {
//         erc20RewardWarperMock.distributeRewards
//           .whenCalledWith(
//             GLOBAL_SERVICE_ID,
//             GLOBAL_TOURNAMENT_ID,
//             GLOBAL_TOKEN_ID,
//             RENT_REWARD,
//             renter.address,
//             rewardToken.address,
//           )
//           .returns();
//       });
//
//       it('does a distribution correctly', async () => {
//         const distributeRewardsTx = erc20RewardWarperMock
//           .connect(authorizedCaller)
//           .distributeRewards(
//             GLOBAL_SERVICE_ID,
//             GLOBAL_TOURNAMENT_ID,
//             GLOBAL_TOKEN_ID,
//             RENT_REWARD,
//             renter.address,
//             rewardToken.address,
//           );
//
//         await expect(distributeRewardsTx).to.be.fulfilled;
//       });
//     });
//   });
//
//   context('when participant does not exists', () => {
//     beforeEach(function () {
//       erc20RewardWarperMock.distributeRewards
//         .whenCalledWith(
//           GLOBAL_SERVICE_ID,
//           GLOBAL_TOURNAMENT_ID,
//           GLOBAL_TOKEN_ID,
//           RENT_REWARD,
//           stranger.address,
//           rewardToken.address,
//         )
//         .reverts('ParticipantDoesNotExist');
//     });
//
//     it('reverts', async () => {
//       const tx = erc20RewardWarperMock
//         .connect(authorizedCaller)
//         .distributeRewards(
//           GLOBAL_SERVICE_ID,
//           GLOBAL_TOURNAMENT_ID,
//           GLOBAL_TOKEN_ID,
//           RENT_REWARD,
//           stranger.address,
//           rewardToken.address,
//         );
//
//       await expect(tx).to.be.revertedWith('ParticipantDoesNotExist');
//     });
//   });
//
//   context('when caller is not authorized', () => {
//     beforeEach(function () {
//       erc20RewardWarperMock.distributeRewards
//         .whenCalledWith(
//           GLOBAL_SERVICE_ID,
//           GLOBAL_TOURNAMENT_ID,
//           GLOBAL_TOKEN_ID,
//           RENT_REWARD,
//           renter.address,
//           rewardToken.address,
//         )
//         .reverts('CallerIsNotAuthorized');
//     });
//
//     it('reverts', async () => {
//       const tx = erc20RewardWarperMock
//         .connect(stranger)
//         .distributeRewards(
//           GLOBAL_SERVICE_ID,
//           GLOBAL_TOURNAMENT_ID,
//           GLOBAL_TOKEN_ID,
//           RENT_REWARD,
//           renter.address,
//           rewardToken.address,
//         );
//
//       await expect(tx).to.be.revertedWith('CallerIsNotAuthorized');
//     });
//   });
// }