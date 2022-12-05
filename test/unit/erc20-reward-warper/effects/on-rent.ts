/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import hre, { ethers } from 'hardhat';
import { FakeContract, MockContract } from '@defi-wonderland/smock';
import { ERC20Mock, ERC721Mock, Metahub } from '@iqprotocol/solidity-contracts-nft/typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { Auth, ContractRegistryMock, ERC20RewardDistributorMock, ERC20RewardWarper } from '../../../../typechain';
import { BytesLike, defaultAbiCoder, keccak256, parseEther } from 'ethers/lib/utils';
import { CONTRACT_REGISTRY_KEY_IDS, HUNDRED_PERCENT, HUNDRED_PERCENT_PRECISION_4 } from '../../../../src/constants';
import {
  EarningType,
  MockAgreementTerms,
  MockAsset,
  MockListingTerms,
  MockPaymentTokenData,
  MockRentalAgremeent,
  MockRentalEarnings,
  MockTaxTerms,
} from '../utils/types';
import {
  makeAgreementTerms,
  makeERC721Asset,
  makeListingTermsFixedRate,
  makeListingTermsFixedRateWithReward,
  makePaymentTokenData,
  makeProtocolEarning,
  makeRentalAgreement,
  makeRentalEarnings,
  makeTaxTermsFixedRate,
  makeTaxTermsFixedRateWithReward,
  makeUniverseEarning,
  makeUserEarning,
} from '../utils/helpers';
import { BigNumber } from 'ethers';
import { expect } from 'chai';
import { latestBlockTimestamp } from '../../../shared/utils/general-utils';

export function shouldBehaveLikeOnRent(): void {
  /**** Constants ****/
  const RENT_PRICE = parseEther('10');
  const RENT_REWARD = parseEther('2');
  const GLOBAL_RENTAL_PERIOD = 3600;
  const GLOBAL_BASE_RATE = BigNumber.from(1000);
  const GLOBAL_REWARD_PERCENTAGE = '10';
  const GLOBAL_UNIVERSE_TAX_RATE = '25';
  const GLOBAL_UNIVERSE_REWARD_TAX_RATE = '30';
  const GLOBAL_PROTOCOL_TAX_RATE = '35';
  const GLOBAL_PROTOCOL_REWARD_TAX_RATE = '20';
  const GLOBAL_UNIVERSE_ID = BigNumber.from(1);
  const GLOBAL_RENTAL_ID = BigNumber.from(1);
  const GLOBAL_TOKEN_ID = BigNumber.from(1);
  const GLOBAL_LISTING_ID = BigNumber.from(1);
  /**** Contracts ****/
  let auth: Auth;
  let erc20RewardWarper: ERC20RewardWarper;
  /**** Mocks ****/
  let erc20RewardWarperMock: FakeContract<ERC20RewardWarper>;
  let metahubMock: FakeContract<Metahub>;
  let contractRegistryMock: ContractRegistryMock;
  let erc20RewardDistributorMock: ERC20RewardDistributorMock;
  /**** ERC20 & ERC721 Token Mocks ****/
  let baseToken: ERC20Mock;
  let rewardToken: ERC20Mock;
  let originalCollection: ERC721Mock;
  /**** Signers ****/
  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;
  let renter: SignerWithAddress;
  let metahubMockAddress: SignerWithAddress;
  let stranger: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  /**** Data Structs ****/
  let fixedPriceWithRewardAssets: MockAsset[];
  let fixedPriceAssets: MockAsset[];
  let listingTerms: MockListingTerms;
  let universeTaxTerms: MockTaxTerms;
  let protocolTaxterms: MockTaxTerms;
  let paymentTokenData: MockPaymentTokenData;
  let agreementTerms: MockAgreementTerms;
  let rentalAgreement: MockRentalAgremeent;
  let rentalEarnings: MockRentalEarnings;
  /**** Variables ****/
  let collectionId: BytesLike;
  let rentalStartTime: number;
  let rentalEndTime: number;

  beforeEach(async function () {
    // Contract setup
    auth = this.contracts.auth;
    erc20RewardWarper = this.contracts.warper;
    // Mocks setup
    erc20RewardWarperMock = this.mocks.warper;
    metahubMock = this.mocks.metahub;
    contractRegistryMock = this.mocks.contractRegistry;
    baseToken = this.mocks.assets.baseToken;
    rewardToken = this.mocks.assets.rewardToken;
    originalCollection = this.mocks.assets.originalCollection;
    // Signers setup
    deployer = this.signers.named.deployer;
    lister = this.signers.named.lister;
    renter = this.signers.named.renter;
    metahubMockAddress = this.signers.named.metahubMockAddress;
    stranger = this.signers.unnamed[1];
    authorizedCaller = this.signers.named.authorizedCaller;
    // Variables setup
    collectionId = keccak256(defaultAbiCoder.encode(['address'], [originalCollection.address]));
    rentalStartTime = await latestBlockTimestamp();
    rentalEndTime = rentalStartTime + GLOBAL_RENTAL_PERIOD;
    // Structs setup
    fixedPriceWithRewardAssets = [
      makeERC721Asset(originalCollection.address, 1),
      makeERC721Asset(originalCollection.address, 2),
      makeERC721Asset(originalCollection.address, 3),
    ];
    fixedPriceAssets = [makeERC721Asset(originalCollection.address, 4), makeERC721Asset(originalCollection.address, 5)];
    listingTerms = makeListingTermsFixedRateWithReward(GLOBAL_BASE_RATE, GLOBAL_REWARD_PERCENTAGE);
    universeTaxTerms = makeTaxTermsFixedRateWithReward(GLOBAL_UNIVERSE_TAX_RATE, GLOBAL_UNIVERSE_REWARD_TAX_RATE);
    protocolTaxterms = makeTaxTermsFixedRateWithReward(GLOBAL_PROTOCOL_TAX_RATE, GLOBAL_PROTOCOL_REWARD_TAX_RATE);
    paymentTokenData = makePaymentTokenData(baseToken.address, RENT_PRICE);
    agreementTerms = makeAgreementTerms(listingTerms, universeTaxTerms, protocolTaxterms, paymentTokenData);
    rentalAgreement = makeRentalAgreement(
      fixedPriceWithRewardAssets,
      GLOBAL_UNIVERSE_ID,
      collectionId,
      GLOBAL_LISTING_ID,
      renter.address,
      rentalStartTime,
      rentalEndTime,
      agreementTerms,
    );

    const listerEarning = RENT_PRICE.mul(GLOBAL_RENTAL_PERIOD);
    const universeEarning = listerEarning.mul(GLOBAL_UNIVERSE_TAX_RATE).div(HUNDRED_PERCENT);
    const protocolEarning = listerEarning.mul(GLOBAL_PROTOCOL_TAX_RATE).div(HUNDRED_PERCENT);

    rentalEarnings = makeRentalEarnings(
      [makeUserEarning(EarningType.LISTER_FIXED_FEE, true, lister.address, listerEarning, baseToken.address)],
      makeUniverseEarning(EarningType.UNIVERSE_FIXED_FEE, GLOBAL_UNIVERSE_ID, universeEarning, baseToken.address),
      makeProtocolEarning(EarningType.PROTOCOL_FIXED_FEE, protocolEarning, baseToken.address),
    );

    // ERC20RewardDistributorMock setup
    const renterRewardPercentage = BigNumber.from(HUNDRED_PERCENT_PRECISION_4)
      .sub(GLOBAL_REWARD_PERCENTAGE)
      .sub(GLOBAL_UNIVERSE_REWARD_TAX_RATE)
      .sub(GLOBAL_PROTOCOL_REWARD_TAX_RATE);

    erc20RewardDistributorMock = await hre.run('deploy:mock:erc20-reward-distributor', {
      listingBeneficiary: lister.address,
      listingBeneficiaryRewardAmount: RENT_REWARD,
      renter: renter.address,
      renterRewardAmount: RENT_REWARD.mul(renterRewardPercentage).div(HUNDRED_PERCENT),
      universeId: GLOBAL_UNIVERSE_ID,
      universeRewardAmount: RENT_REWARD.mul(GLOBAL_UNIVERSE_REWARD_TAX_RATE).div(HUNDRED_PERCENT),
      protocolRewardAmount: RENT_REWARD.mul(GLOBAL_PROTOCOL_REWARD_TAX_RATE).div(HUNDRED_PERCENT),
    });

    await contractRegistryMock.registerContract(
      CONTRACT_REGISTRY_KEY_IDS.ERC20_REWARD_DISTRIBUTOR,
      erc20RewardDistributorMock.address,
    );
  });

  context('when called by non-Metahub', () => {
    context('called by non-metahub address', () => {
      let emptyRentalAgreement: MockRentalAgremeent;
      let emptyRentalEarnings: MockRentalEarnings;

      beforeEach(function () {
        emptyRentalAgreement = makeRentalAgreement(
          [
            {
              id: { class: '0x00000000', data: '0x' },
              value: BigNumber.from(0),
            },
          ],
          BigNumber.from(0),
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          BigNumber.from(0),
          renter.address,
          0,
          0,
          {
            listingTerms: { strategyId: '0x00000000', strategyData: '0x' },
            universeTaxTerms: { strategyId: '0x00000000', strategyData: '0x' },
            protocolTaxTerms: { strategyId: '0x00000000', strategyData: '0x' },
            paymentTokenData: { paymentToken: baseToken.address, paymentTokenQuote: BigNumber.from(0) },
          },
        );

        emptyRentalEarnings = makeRentalEarnings(
          [],
          {
            earningType: EarningType.UNIVERSE_FIXED_FEE,
            universeId: BigNumber.from(0),
            value: parseEther('1'),
            token: baseToken.address,
          },
          {
            earningType: EarningType.PROTOCOL_FIXED_FEE,
            value: parseEther('1'),
            token: baseToken.address,
          },
        );
      });

      it('reverts', async () => {
        const callTx = erc20RewardWarper.__onRent(GLOBAL_RENTAL_ID, emptyRentalAgreement, emptyRentalEarnings);

        await expect(callTx).to.be.revertedWith(`CallerIsNotMetahub()`);
      });
    });
  });

  context('when called by Metahub', () => {
    context('When using `FIXED_PRICE` listing strategy', () => {
      beforeEach(function () {
        rentalAgreement.warpedAssets = fixedPriceAssets;
        rentalAgreement.agreementTerms.listingTerms = makeListingTermsFixedRate(GLOBAL_BASE_RATE);
        rentalAgreement.agreementTerms.universeTaxTerms = makeTaxTermsFixedRate(GLOBAL_UNIVERSE_TAX_RATE);
        rentalAgreement.agreementTerms.protocolTaxTerms = makeTaxTermsFixedRate(GLOBAL_PROTOCOL_TAX_RATE);

        erc20RewardWarperMock.__onRent.whenCalledWith(GLOBAL_RENTAL_ID, rentalAgreement, rentalEarnings).returns({
          success: true,
          data: '',
        });

        erc20RewardWarperMock.getTokenRental.whenCalledWith(renter.address, GLOBAL_TOKEN_ID).returns(GLOBAL_RENTAL_ID);
        erc20RewardWarperMock.getRentalListing.whenCalledWith(GLOBAL_RENTAL_ID).returns(GLOBAL_LISTING_ID);
      });

      it('registers linking between token id, rental id and listing id', async () => {
        const onRentHookTx = erc20RewardWarperMock
          .connect(metahubMockAddress)
          .__onRent(GLOBAL_RENTAL_ID, rentalAgreement, rentalEarnings);

        const rentalId = await erc20RewardWarperMock.connect(stranger).getTokenRental(renter.address, GLOBAL_TOKEN_ID);
        const listingId = await erc20RewardWarperMock.connect(stranger).getRentalListing(rentalId);

        await expect(onRentHookTx).to.be.fulfilled;
        expect(rentalId).to.be.eq(GLOBAL_RENTAL_ID);
        expect(listingId).to.be.eq(GLOBAL_LISTING_ID);
      });
    });

    context('When using `FIXED_PRICE_WITH_REWARDS` listing strategy', () => {
      beforeEach(function () {
        erc20RewardWarperMock.__onRent.whenCalledWith(GLOBAL_RENTAL_ID, rentalAgreement, rentalEarnings).returns({
          success: true,
          data: '',
        });

        erc20RewardWarperMock.getTokenRental.whenCalledWith(renter.address, GLOBAL_TOKEN_ID).returns(GLOBAL_RENTAL_ID);
        erc20RewardWarperMock.getRentalListing.whenCalledWith(GLOBAL_RENTAL_ID).returns(GLOBAL_LISTING_ID);
      });

      it('registers linking between token id, rental id and listing id', async () => {
        const onRentHookTx = erc20RewardWarperMock
          .connect(metahubMockAddress)
          .__onRent(GLOBAL_RENTAL_ID, rentalAgreement, rentalEarnings);
        const rentalId = await erc20RewardWarperMock.connect(stranger).getTokenRental(renter.address, GLOBAL_TOKEN_ID);
        const listingId = await erc20RewardWarperMock.connect(stranger).getRentalListing(rentalId);

        await expect(onRentHookTx).to.be.fulfilled;
        expect(rentalId).to.be.eq(GLOBAL_RENTAL_ID);
        expect(listingId).to.be.eq(GLOBAL_LISTING_ID);
      });
    });
  });
}
