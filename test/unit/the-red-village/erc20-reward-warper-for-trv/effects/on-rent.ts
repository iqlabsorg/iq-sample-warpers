// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// import hre, { ethers, getChainId } from 'hardhat';
// import {
//   ERC20Mock,
//   ERC721Mock,
//   IListingWizardV1,
//   IRentingManager,
//   IUniverseWizardV1,
//   ITaxTermsRegistry, IListingManager, IListingTermsRegistry,
// } from '@iqprotocol/solidity-contracts-nft/typechain';
// import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
// import { IERC20RewardWarperForTRV } from '../../../../../typechain';
// import { BytesLike, defaultAbiCoder, keccak256, parseEther } from 'ethers/lib/utils';
// import {
//   CONTRACT_REGISTRY_KEY_IDS,
//   HUNDRED_PERCENT,
//   HUNDRED_PERCENT_PRECISION_4,
//   SECONDS_IN_DAY
// } from '../../../../../src/constants';
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
// import { BigNumber, BigNumberish } from 'ethers';
// import { expect } from 'chai';
// import { convertToWei, latestBlockTimestamp } from '../../../../shared/utils/general-utils';
// import {
//   ADDRESS_ZERO,
//   EMPTY_BYTES4_DATA_HEX,
//   EMPTY_BYTES_DATA_HEX,
//   LISTING_STRATEGIES
// } from "@iqprotocol/solidity-contracts-nft";
// import {
//   Asset,
//   AssetId,
//   AssetListingParams, AssetType,
//   ListingWizardAdapterV1,
//   Multiverse,
//   UniverseWizardAdapterV1
// } from "@iqprotocol/iq-space-sdk-js";
// import { toAccountId } from "../../../../shared/utils/sdk-utils";
// import { makeListingParams, makeListingTermsFixedRate } from "../../../../shared/utils/listing-utils";
// import { makeTaxTermsFixedRate, makeTaxTermsFixedRateWithReward } from "../../../../shared/utils/tax-terms-utils";
// import { calculateBaseRate, convertPercentage } from "../../../../shared/utils/pricing-utils";
// import { makeERC721Asset } from "../utils/helpers";
// import { Provider } from "@ethersproject/providers";
// import { makeRentingParams } from "../../../../shared/utils/renting-utils";
//
// export function shouldBehaveLikeOnRent(): void {
//   /**** Constants ****/
//   const PROTOCOL_BASE_TAX_RATE = '5';
//   const PROTOCOL_REWARD_TAX_RATE = '7';
//   const LISTER_TOKEN_ID_1 = 1;
//   const LISTER_TOKEN_ID_2 = 2;
//   /**** Config ****/
//   let chainId: string;
//   /**** Contracts ****/
//   let taxTermsRegistry: ITaxTermsRegistry;
//   let listingTermsRegistry: IListingTermsRegistry;
//   let listingWizardV1: IListingWizardV1;
//   let universeWizardV1: IUniverseWizardV1;
//   let rentingManager: IRentingManager;
//   let listingManager: IListingManager;
//   let erc20RewardWarperForTRV: IERC20RewardWarperForTRV;
//   /**** Mocks & Samples ****/
//   let baseToken: ERC20Mock;
//   let rewardToken: ERC20Mock;
//   let originalCollection: ERC721Mock;
//   /**** Signers ****/
//   let deployer: SignerWithAddress;
//   let lister: SignerWithAddress;
//   let renter: SignerWithAddress;
//   let stranger: SignerWithAddress;
//   let universeOwner: SignerWithAddress;
//   /**** SDK ****/
//   let listingWizardV1Adapter: ListingWizardAdapterV1;
//   let universeWizardV1Adapter: UniverseWizardAdapterV1;
//   /**** Data Structs ****/
// /*  let fixedPriceWithRewardAssets: MockAsset[];
//   let fixedPriceAssets: MockAsset[];
//   let listingTerms: MockListingTerms;
//   let universeTaxTerms: MockTaxTerms;
//   let protocolTaxterms: MockTaxTerms;
//   let paymentTokenData: MockPaymentTokenData;
//   let agreementTerms: MockAgreementTerms;
//   let rentalAgreement: MockRentalAgremeent;
//   let rentalEarnings: MockRentalEarnings;*/
//   /**** Variables ****/
// /*  let collectionId: BytesLike;
//   let rentalStartTime: number;
//   let rentalEndTime: number;*/
//
//   beforeEach(async function () {
//     /**** Config ****/
//     chainId = await getChainId();
//     /**** Contracts ****/
//     listingWizardV1 = this.contracts.wizardsV1.listingWizard;
//     universeWizardV1 = this.contracts.wizardsV1.universeWizard;
//     rentingManager = this.contracts.rentingManager;
//     erc20RewardWarperForTRV = this.contracts.theRedVillage.erc20RewardWarperForTRV;
//     rewardToken = this.contracts.theRedVillage.rewardToken;
//     /**** Mocks & Samples ****/
//     baseToken = this.mocks.assets.baseToken;
//     originalCollection = this.mocks.assets.originalCollection;
//     /**** Signers ****/
//     deployer = this.signers.named.deployer;
//     [lister, renter, stranger, universeOwner] = this.signers.unnamed;
//
//     taxTermsRegistry = await ethers.getContract("TaxTermsRegistry") as ITaxTermsRegistry;
//     await taxTermsRegistry.connect(deployer).registerProtocolGlobalTaxTerms(
//       makeTaxTermsFixedRate(PROTOCOL_BASE_TAX_RATE)
//     )
//     await taxTermsRegistry.connect(deployer).registerProtocolGlobalTaxTerms(
//       makeTaxTermsFixedRateWithReward(PROTOCOL_BASE_TAX_RATE, PROTOCOL_REWARD_TAX_RATE)
//     )
//
//     listingTermsRegistry = await ethers.getContract("ListingTermsRegistry") as IListingTermsRegistry;
//
//     listingManager = await ethers.getContract("ListingManager") as IListingManager;
//
//     await originalCollection.mint(lister.address, LISTER_TOKEN_ID_1);
//     await originalCollection.mint(lister.address, LISTER_TOKEN_ID_2);
//
//     // listingWizardV1Adapter = multiverse.listingWizardV1(toAccountId(chainId, listingWizardV1.address));
//     // Setup universe with TRV's Warper
//
//
//     // // Variables setup
//     // collectionId = keccak256(defaultAbiCoder.encode(['address'], [originalCollection.address]));
//     // rentalStartTime = await latestBlockTimestamp();
//     // rentalEndTime = rentalStartTime + GLOBAL_RENTAL_PERIOD;
//     // // Structs setup
//     // fixedPriceWithRewardAssets = [
//     //   makeERC721Asset(originalCollection.address, 1),
//     //   makeERC721Asset(originalCollection.address, 2),
//     //   makeERC721Asset(originalCollection.address, 3),
//     // ];
//     // fixedPriceAssets = [makeERC721Asset(originalCollection.address, 4), makeERC721Asset(originalCollection.address, 5)];
//     // listingTerms = makeListingTermsFixedRateWithReward(GLOBAL_BASE_RATE, GLOBAL_REWARD_PERCENTAGE);
//     // universeTaxTerms = makeTaxTermsFixedRateWithReward(GLOBAL_UNIVERSE_TAX_RATE, GLOBAL_UNIVERSE_REWARD_TAX_RATE);
//     // protocolTaxterms = makeTaxTermsFixedRateWithReward(GLOBAL_PROTOCOL_TAX_RATE, GLOBAL_PROTOCOL_REWARD_TAX_RATE);
//     // paymentTokenData = makePaymentTokenData(baseToken.address, RENT_PRICE);
//     // agreementTerms = makeAgreementTerms(listingTerms, universeTaxTerms, protocolTaxterms, paymentTokenData);
//     // rentalAgreement = makeRentalAgreement(
//     //   fixedPriceWithRewardAssets,
//     //   GLOBAL_UNIVERSE_ID,
//     //   collectionId,
//     //   GLOBAL_LISTING_ID,
//     //   renter.address,
//     //   rentalStartTime,
//     //   rentalEndTime,
//     //   agreementTerms,
//     // );
//     //
//     // const listerEarning = RENT_PRICE.mul(GLOBAL_RENTAL_PERIOD);
//     // const universeEarning = listerEarning.mul(GLOBAL_UNIVERSE_TAX_RATE).div(HUNDRED_PERCENT);
//     // const protocolEarning = listerEarning.mul(GLOBAL_PROTOCOL_TAX_RATE).div(HUNDRED_PERCENT);
//   });
//
//   context('Renting with various Listing Terms', () => {
//     const TRV_UNIVERSE_WARPER_BASE_TAX_RATE = '3.5';
//     const TRV_UNIVERSE_WARPER_REWARD_TAX_RATE = '5.9';
//
//     let TRV_UNIVERSE_ID: BigNumberish;
//
//     beforeEach(async () => {
//       const multiverse = await Multiverse.init({ signer: universeOwner });
//       const universeParams = { name: 'The Red Village', paymentTokens: [toAccountId(chainId, baseToken.address)] };
//
//       universeWizardV1Adapter = multiverse.universeWizardV1(toAccountId(chainId, universeWizardV1.address));
//       const setupUniverseTx = await universeWizardV1Adapter.setupUniverseAndWarper(
//         universeParams,
//         createAssetReference(chainId, 'erc721', erc20RewardWarperForTRV.address),
//         makeTaxTermsFixedRateWithReward(TRV_UNIVERSE_WARPER_BASE_TAX_RATE, TRV_UNIVERSE_WARPER_REWARD_TAX_RATE),
//         {
//           name: 'TRV Warper',
//           universeId: TRV_UNIVERSE_ID,
//           paused: false,
//         },
//         EMPTY_BYTES4_DATA_HEX,
//         EMPTY_BYTES_DATA_HEX,
//       );
//       const newUniverseId = (await multiverse.universeRegistry(toAccountId(chainId, ADDRESS_ZERO)).findUniverseByCreationTransaction(
//         setupUniverseTx.hash
//       ))?.universeId;
//
//       if (!newUniverseId) {
//         throw new Error("Universe was not created!");
//       } else {
//         TRV_UNIVERSE_ID = newUniverseId;
//       }
//     });
//
//     it(`works with ${LISTING_STRATEGIES.FIXED_RATE} strategy`, async () => {
//       const LISTING_BASE_RATE = calculateBaseRate("300", SECONDS_IN_DAY);
//       const listingTerms = makeListingTermsFixedRate(LISTING_BASE_RATE);
//
//       const listingParams: AssetListingParams = {
//         assets: [makeERC721AssetForSDK(chainId, originalCollection.address, LISTER_TOKEN_ID_1)],
//         params: makeListingParams(chainId, lister.address),
//         maxLockPeriod: SECONDS_IN_DAY,
//         immediatePayout: true,
//       }
//
//       const createListingTx = await listingWizardV1Adapter.createListingWithTerms(
//         TRV_UNIVERSE_ID,
//         listingParams,
//         listingTerms,
//       );
//
//       const listingId = await findListingIdByCreationTransaction(listingManager, createListingTx.hash);
//
//       if (!listingId) {
//         throw new Error("Listing was not created!");
//       }
//
//       const listingTermsId = (await listingTermsRegistry.allListingTerms({
//         listingId,
//         universeId: TRV_UNIVERSE_ID,
//         warperAddress: erc20RewardWarperForTRV.address,
//       }, 0, 1))[0][0];
//
//       if (!listingTermsId) {
//         throw new Error("Listing Terms were not found!");
//       }
//
//       const rentingParams = makeRentingParams(
//         listingId,
//         erc20RewardWarperForTRV.address,
//         renter.address,
//         SECONDS_IN_DAY,
//         baseToken.address,
//         listingTermsId,
//       );
//
//       const rentalFees = await rentingManager.estimateRent(rentingParams);
//
//       await expect(rentalFees.listerBaseFee).to.be.equal(convertToWei("300"));
//       await expect(rentalFees.universeBaseFee).to.be.equal(rentalFees.listerBaseFee.mul(convertPercentage(TRV_UNIVERSE_WARPER_BASE_TAX_RATE)).div(100));
//       await expect(rentalFees.universeBaseFee).to.be.equal(rentalFees.listerBaseFee.mul(convertPercentage(PROTOCOL_BASE_TAX_RATE)).div(100));
//
//       // rentingManager.rent()
//
//     })
//   })
//
//   // context('when called by non-Metahub', () => {
//   //   context('called by non-metahub address', () => {
//   //     let emptyRentalAgreement: MockRentalAgremeent;
//   //     let emptyRentalEarnings: MockRentalEarnings;
//   //
//   //     beforeEach(function () {
//   //       emptyRentalAgreement = makeRentalAgreement(
//   //         [
//   //           {
//   //             id: { class: '0x00000000', data: '0x' },
//   //             value: BigNumber.from(0),
//   //           },
//   //         ],
//   //         BigNumber.from(0),
//   //         '0x0000000000000000000000000000000000000000000000000000000000000000',
//   //         BigNumber.from(0),
//   //         renter.address,
//   //         0,
//   //         0,
//   //         {
//   //           listingTerms: { strategyId: '0x00000000', strategyData: '0x' },
//   //           universeTaxTerms: { strategyId: '0x00000000', strategyData: '0x' },
//   //           protocolTaxTerms: { strategyId: '0x00000000', strategyData: '0x' },
//   //           paymentTokenData: { paymentToken: baseToken.address, paymentTokenQuote: BigNumber.from(0) },
//   //         },
//   //       );
//   //
//   //       emptyRentalEarnings = makeRentalEarnings(
//   //         [],
//   //         {
//   //           earningType: EarningType.UNIVERSE_FIXED_FEE,
//   //           universeId: BigNumber.from(0),
//   //           value: parseEther('1'),
//   //           token: baseToken.address,
//   //         },
//   //         {
//   //           earningType: EarningType.PROTOCOL_FIXED_FEE,
//   //           value: parseEther('1'),
//   //           token: baseToken.address,
//   //         },
//   //       );
//   //     });
//   //
//   //     it('reverts', async () => {
//   //       const callTx = erc20RewardWarperForTRV.__onRent(GLOBAL_RENTAL_ID, emptyRentalAgreement, emptyRentalEarnings);
//   //
//   //       await expect(callTx).to.be.revertedWith(`CallerIsNotMetahub()`);
//   //     });
//   //   });
//   // });
//
//   // context('when called by Metahub', () => {
//   //   context('When using `FIXED_PRICE` listing strategy', () => {
//   //     beforeEach(function () {
//   //       rentalAgreement.warpedAssets = fixedPriceAssets;
//   //       rentalAgreement.agreementTerms.listingTerms = makeListingTermsFixedRate(GLOBAL_BASE_RATE);
//   //       rentalAgreement.agreementTerms.universeTaxTerms = makeTaxTermsFixedRate(GLOBAL_UNIVERSE_TAX_RATE);
//   //       rentalAgreement.agreementTerms.protocolTaxTerms = makeTaxTermsFixedRate(GLOBAL_PROTOCOL_TAX_RATE);
//   //
//   //       erc20RewardWarperMock.__onRent.whenCalledWith(GLOBAL_RENTAL_ID, rentalAgreement, rentalEarnings).returns({
//   //         success: true,
//   //         data: '',
//   //       });
//   //
//   //       erc20RewardWarperMock.getTokenRental.whenCalledWith(renter.address, GLOBAL_TOKEN_ID).returns(GLOBAL_RENTAL_ID);
//   //       erc20RewardWarperMock.getRentalListing.whenCalledWith(GLOBAL_RENTAL_ID).returns(GLOBAL_LISTING_ID);
//   //     });
//   //
//   //     it('registers linking between token id, rental id and listing id', async () => {
//   //       const onRentHookTx = erc20RewardWarperMock
//   //         .connect(metahubMockAddress)
//   //         .__onRent(GLOBAL_RENTAL_ID, rentalAgreement, rentalEarnings);
//   //
//   //       const rentalId = await erc20RewardWarperMock.connect(stranger).getTokenRental(renter.address, GLOBAL_TOKEN_ID);
//   //       const listingId = await erc20RewardWarperMock.connect(stranger).getRentalListing(rentalId);
//   //
//   //       await expect(onRentHookTx).to.be.fulfilled;
//   //       expect(rentalId).to.be.eq(GLOBAL_RENTAL_ID);
//   //       expect(listingId).to.be.eq(GLOBAL_LISTING_ID);
//   //     });
//   //   });
//   //
//   //   context('When using `FIXED_PRICE_WITH_REWARDS` listing strategy', () => {
//   //     beforeEach(function () {
//   //       erc20RewardWarperMock.__onRent.whenCalledWith(GLOBAL_RENTAL_ID, rentalAgreement, rentalEarnings).returns({
//   //         success: true,
//   //         data: '',
//   //       });
//   //
//   //       erc20RewardWarperMock.getTokenRental.whenCalledWith(renter.address, GLOBAL_TOKEN_ID).returns(GLOBAL_RENTAL_ID);
//   //       erc20RewardWarperMock.getRentalListing.whenCalledWith(GLOBAL_RENTAL_ID).returns(GLOBAL_LISTING_ID);
//   //     });
//   //
//   //     it('registers linking between token id, rental id and listing id', async () => {
//   //       const onRentHookTx = erc20RewardWarperMock
//   //         .connect(metahubMockAddress)
//   //         .__onRent(GLOBAL_RENTAL_ID, rentalAgreement, rentalEarnings);
//   //       const rentalId = await erc20RewardWarperMock.connect(stranger).getTokenRental(renter.address, GLOBAL_TOKEN_ID);
//   //       const listingId = await erc20RewardWarperMock.connect(stranger).getRentalListing(rentalId);
//   //
//   //       await expect(onRentHookTx).to.be.fulfilled;
//   //       expect(rentalId).to.be.eq(GLOBAL_RENTAL_ID);
//   //       expect(listingId).to.be.eq(GLOBAL_LISTING_ID);
//   //     });
//   //   });
//   // });
// }
//
// const makeERC721AssetForSDK = (chainId: string, token: string, tokenId: number, value: BigNumberish = 1): Asset => {
//   return {
//     id: toAssetId(chainId, token, tokenId),
//     value,
//   };
// };
//
// const toAssetId = (chainId: string, collectionAddress: string, tokenId: number): AssetId => {
//   return new AssetId(`${chainId}/erc721:${collectionAddress}/${tokenId}`);
// };
//
// export const createAssetReference = (chainId: string, namespace: 'erc721' | 'erc20', address: string): AssetType => {
//   return new AssetType({
//     chainId,
//     assetName: { namespace, reference: address },
//   });
// };
//
// async function findListingIdByCreationTransaction(listingManager: IListingManager, transactionHash: string): Promise<BigNumberish | undefined> {
//   const tx = await listingManager.provider.getTransaction(transactionHash);
//   if (!tx.blockHash) {
//     return undefined;
//   }
//
//   const event = (await listingManager.queryFilter(listingManager.filters.ListingCreated(), tx.blockHash)).find(
//     event => event.transactionHash === transactionHash,
//   );
//
//   return event ? event.args.listingId: undefined;
// }
