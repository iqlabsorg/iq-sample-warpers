/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { defaultAbiCoder, parseEther } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";
import {
  MockTournament,
  MockTournament__factory,
  ERC20RewardWarper,
  ERC20RewardWarper__factory,
  MockTRVTournament,
  MockAllocationResolver,
  MockMetahub,
  MockTRVCollection,
  MockTRVCollection__factory,
} from "../typechain";
import {
  ERC20,
  ERC20Mock,
  ERC721Mock,
  Metahub,
  SolidityInterfaces,
  SolidityInterfaces__factory,
} from "@iqprotocol/solidity-contracts-nft/typechain";
import {
  AccountId,
  Multiverse,
  AssetType,
  MetahubAdapter,
  ChainId,
  RentingParams,
} from "@iqprotocol/multiverse";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, ContractTransaction } from "ethers";
import { Rentings } from "@iqprotocol/solidity-contracts-nft/typechain/contracts/metahub/Metahub";
import { Fixture } from "ethereum-waffle";

const mineBlock = async (timestamp = 0): Promise<unknown> => {
  return ethers.provider.send("evm_mine", timestamp > 0 ? [timestamp] : []);
};

const latestBlockTimestamp = async (): Promise<number> => {
  return (await ethers.provider.getBlock("latest")).timestamp;
};

const waitBlockchainTime = async (seconds: number): Promise<void> => {
  const time = await latestBlockTimestamp();
  await mineBlock(time + seconds);
};

describe("ERC20RewardWarper", function () {
  let trvTournament: MockTRVTournament;
  let trvCollection: MockTRVCollection;
  let metahub: Metahub;
  let warper: ERC20RewardWarper;
  let mockAllocationResolver: MockAllocationResolver;
  let mockMetahub: MockMetahub;
  let baseToken: ERC20Mock;
  let metahubSDK: MetahubAdapter;

  let deployer: SignerWithAddress;
  let lister: SignerWithAddress;
  let renter: SignerWithAddress;
  let metahubTreasury: SignerWithAddress;
  let trvTreasury: SignerWithAddress;
  let stranger: SignerWithAddress;
  let chainId: ChainId;
  let loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
  // Token Related variables
  const name = "Test TRV NFT";
  const symbol = "TRV";
  const totalSupply = 5;
  const tokensIds = [1, 2, 3, 4, 5];
  const fixedPrice = parseEther("33");

  // Warper Related variables
  const rentalId: number = 1;
  const tokenId: number = 1;
  const protocolAllocation: number = 500;
  const universeAllocation: number = 1000;
  const listerAllocation: number = 3500;

  before(() => {
    loadFixture = hre.waffle.createFixtureLoader();
  });

  async function fixture() {
    deployer = await hre.ethers.getNamedSigner("deployer");
    lister = await hre.ethers.getNamedSigner("lister");
    renter = await hre.ethers.getNamedSigner("renter");

    metahubTreasury = await hre.ethers.getNamedSigner("metahubTreasury");
    trvTreasury = await hre.ethers.getNamedSigner("trvTreasury");
    [stranger] = await hre.ethers.getUnnamedSigners();

    // Deploy & set up metahub
    baseToken = (await hre.run("deploy:mock:ERC20", {
      name: "Base Token",
      symbol: "BASE",
    })) as ERC20Mock;
    const infrastructure = await hre.run("deploy:initial-deployment", {
      baseToken: baseToken.address,
      rentalFee: 100,
      unsafe: true,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    metahub = infrastructure.metahub;

    // Instantiate the SDK
    const multiverse = await Multiverse.init({
      signer: deployer,
    });
    chainId = await multiverse.getChainId();
    metahubSDK = multiverse.metahub(
      new AccountId({ chainId, address: metahub.address })
    );

    // Deploy mock of TRV Collection Contract
    trvCollection = (await hre.run("deploy:mock-trv-collection", {
      name,
      symbol,
      totalSupply,
    })) as MockTRVCollection;

    // Deploy mock of TRV Tournament Contract
    trvTournament = (await hre.run("deploy:mock-trv-tournament", {
      rewardTokenAddress: baseToken.address,
    })) as MockTRVTournament;

    // Deploy mock of Allocation Resolver Contract
    mockAllocationResolver = (await hre.run(
      "deploy:mock-allocation-resolver",
      {}
    )) as MockAllocationResolver;

    // Deploy mock of Metahub
    mockMetahub = (await hre.run("deploy:mock-metahub", {
      treasuryAddress: metahubTreasury.address,
    })) as MockMetahub;

    // Create a new universe
    const universeRegistry = multiverse.universeRegistry(
      new AccountId({
        chainId,
        address: infrastructure.universeRegistry.address,
      })
    );
    const tx = await universeRegistry.createUniverse({
      name: "Test Universe",
      rentalFeePercent: 100,
    });
    const universe = await universeRegistry.findUniverseByCreationTransaction(
      tx.hash
    );

    // Deploy the warper contract
    warper = (await hre.run("deploy:warper", {
      original: trvCollection.address,
      metahub: metahub.address,
      mockTournament: trvTournament.address,
      mockAllocationResolver: mockAllocationResolver.address,
      mockMetahub: mockMetahub.address,
      universeTreasury: trvTreasury.address,
    })) as ERC20RewardWarper;

    // Register the warper
    console.log("registering the warper");
    await metahubSDK.registerWarper(
      new AssetType({
        chainId,
        assetName: `erc721:${warper.address}`,
      }),
      {
        name: "my-warper",
        universeId: universe!.universeId,
        paused: false,
      }
    );

    // List originals
    await hre.run("metahub:list-tokens", {
      metahub: metahub.address,
      original: trvCollection.address,
      tokens: tokensIds,
      lock: 99604800,
      price: fixedPrice.toString(),
    });

    // Approve ERC20 tokens
    console.log("minting erc20 tokens to the deployer");
    await baseToken.mint(deployer.address, parseEther("1000000"));
    console.log("approving erc20 tokens to the metahub");
    await baseToken.approve(metahub.address, ethers.constants.MaxUint256);
    await baseToken
      .connect(stranger)
      .approve(metahub.address, ethers.constants.MaxUint256);
  }

  beforeEach(async () => {
    await loadFixture(fixture);
  });

  describe("supportsInterface", () => {
    let ifaces: SolidityInterfaces.InterfaceStructOutput[];
    beforeEach(async () => {
      const ifacePrinter = await new SolidityInterfaces__factory(
        deployer
      ).deploy();
      ifaces = await ifacePrinter.list();
    });

    context("supports IRentingHookMechanics interface", () => {
      it("returns true", async () => {
        const iface = ifaces.find(
          (e) => e.name === "IRentingHookMechanics"
        )!.id;

        await expect(warper.supportsInterface(iface)).to.eventually.eq(true);
      });
    });

    context("supports IWarper interface", () => {
      it("returns true", async () => {
        const iface = ifaces.find((e) => e.name === "IWarper")!.id;

        await expect(warper.supportsInterface(iface)).to.eventually.eq(true);
      });
    });

    context("supports IAvailabilityPeriodMechanics interface", () => {
      it("returns true", async () => {
        const iface = ifaces.find(
          (e) => e.name === "IAvailabilityPeriodMechanics"
        )!.id;

        await expect(warper.supportsInterface(iface)).to.eventually.eq(true);
      });
    });

    context("supports IRentalPeriodMechanics interface", () => {
      it("returns true", async () => {
        const iface = ifaces.find(
          (e) => e.name === "IRentalPeriodMechanics"
        )!.id;

        await expect(warper.supportsInterface(iface)).to.eventually.eq(true);
      });
    });
  });

  describe("__onRent", () => {
    context("called by non-metahub address", () => {
      const emptyRentingAgreement: Rentings.AgreementStruct = {
        warpedAsset: {
          id: { class: "0x00000000", data: "0x" },
          value: BigNumber.from(0),
        },
        collectionId:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        listingId: BigNumber.from(0),
        renter: ethers.constants.AddressZero,
        startTime: 0,
        endTime: 0,
      };

      it("reverts", async () => {
        await expect(
          warper.__onRent(42, 15, deployer.address, emptyRentingAgreement, {
            protocolEarningToken: baseToken.address,
            protocolEarningValue: parseEther("1").toString(),
            universeEarningToken: baseToken.address,
            universeEarningValue: parseEther("1").toString(),
            universeId: 1,
            userEarnings: [],
          })
        ).to.be.revertedWith(`CallerIsNotMetahub()`);
      });
    });

    context("called with zero rental ID", () => {
      const emptyRentingAgreement: Rentings.AgreementStruct = {
        warpedAsset: {
          id: { class: "0x00000000", data: "0x" },
          value: BigNumber.from(0),
        },
        collectionId:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        listingId: BigNumber.from(0),
        renter: ethers.constants.AddressZero,
        startTime: 0,
        endTime: 0,
      };

      it("reverts", async () => {
        await expect(
          warper
            .connect(metahub.address)
            .__onRent(0, 15, deployer.address, emptyRentingAgreement, {
              protocolEarningToken: baseToken.address,
              protocolEarningValue: parseEther("1").toString(),
              universeEarningToken: baseToken.address,
              universeEarningValue: parseEther("1").toString(),
              universeId: 1,
              userEarnings: [],
            })
        ).to.be.revertedWith(`RentalDoesNotExists()`);
      });
    });
  });

  describe("renting process via Metahub", () => {
    beforeEach(async () => {
      await mockAllocationResolver.setAllocations(
        rentalId,
        protocolAllocation,
        universeAllocation,
        listerAllocation
      );
    });

    context("called with correct rental ID", () => {
      it("registers allocations and rental for token", async () => {
        await metahubSDK.rent({
          listingId: 1,
          maxPaymentAmount: ethers.constants.MaxUint256,
          paymentToken: new AssetType({
            chainId,
            assetName: `erc20:${baseToken.address}`,
          }),
          rentalPeriod: 99999,
          renter: new AccountId({ chainId, address: renter.address }),
          warper: new AssetType({
            chainId,
            assetName: `erc20:${warper.address}`,
          }),
        });

        const allocation = await warper.getAllocations(rentalId);
        const rentalForToken = await warper.getRentalForToken(
          renter.address,
          tokenId
        );

        expect(allocation.protocolAllocation).to.be.eq(protocolAllocation);
        expect(allocation.universeAllocation).to.be.eq(universeAllocation);
        expect(allocation.listerAllocation).to.be.eq(listerAllocation);
        expect(allocation.lister).to.be.eq(deployer.address);
        expect(allocation.renter).to.be.eq(renter.address);
        expect(rentalForToken.toNumber()).to.be.eq(rentalId);
      });
    });

    context("user tries to rent once again", () => {
      const rentalPeriod = 9999;
      let rentingParams: RentingParams;
      beforeEach(async () => {
        rentingParams = {
          listingId: 1,
          maxPaymentAmount: ethers.constants.MaxUint256,
          paymentToken: new AssetType({
            chainId,
            assetName: `erc20:${baseToken.address}`,
          }),
          rentalPeriod: rentalPeriod,
          renter: new AccountId({ chainId, address: renter.address }),
          warper: new AssetType({
            chainId,
            assetName: `erc20:${warper.address}`,
          }),
        };
        await metahubSDK.rent(rentingParams);
      });

      it("reverts", async () => {
        // NOTE: The assertions do not work properly. ethers.js thinks that: "Transaction reverted without a reason string".
        // whereas we'd actually expect the msg `AssetIsNotRentable("User not authorized to rent")`
        await expect(metahubSDK.rent({ ...rentingParams, listingId: 2 })).to.be
          .reverted;
      });
    });

    context("A different user tries to rent the same listing later on", () => {
      const rentalPeriod = 10;
      let rentingParams: RentingParams;
      beforeEach(async () => {
        rentingParams = {
          listingId: 1,
          maxPaymentAmount: ethers.constants.MaxUint256,
          paymentToken: new AssetType({
            chainId,
            assetName: `erc20:${baseToken.address}`,
          }),
          rentalPeriod: rentalPeriod,
          renter: new AccountId({ chainId, address: renter.address }),
          warper: new AssetType({
            chainId,
            assetName: `erc20:${warper.address}`,
          }),
        };
        // Setting the allocations for rental
        await mockAllocationResolver.setAllocations(
          2,
          protocolAllocation,
          universeAllocation,
          listerAllocation
        );
        await metahubSDK.rent(rentingParams);
      });

      it("rents successfully when payer is the other user", async () => {
        await baseToken.transfer(
          stranger.address,
          await baseToken.balanceOf(deployer.address)
        );
        const multiverse = await Multiverse.init({
          signer: stranger,
        });
        const strangerMetahubSDK = multiverse.metahub(
          new AccountId({ chainId, address: metahub.address })
        );

        // Wait for the rental period to pass
        await waitBlockchainTime(rentalPeriod * 100);

        // Attempt to rent from a different account
        await expect(
          strangerMetahubSDK.rent({
            ...rentingParams,
            renter: new AccountId({ chainId, address: stranger.address }),
          })
        ).to.not.reverted;
      });

      it("rents successfully when payer is someone else", async () => {
        // Wait for the rental period to pass
        await waitBlockchainTime(rentalPeriod * 100);

        // Attempt to rent from a different account
        const tx = await metahubSDK.rent({
          ...rentingParams,
          renter: new AccountId({ chainId, address: stranger.address }),
        });

        const allocation = await warper.getAllocations(2);
        const rentalForToken = await warper.getRentalForToken(
          stranger.address,
          1
        );

        expect(allocation.protocolAllocation).to.be.eq(protocolAllocation);
        expect(allocation.universeAllocation).to.be.eq(universeAllocation);
        expect(allocation.listerAllocation).to.be.eq(listerAllocation);
        expect(allocation.lister).to.be.eq(deployer.address);
        expect(allocation.renter).to.be.eq(stranger.address);
        expect(rentalForToken.toNumber()).to.be.eq(2);
      });
    });

    context("renting period", () => {
      let rentingParams: RentingParams;
      beforeEach(async () => {
        await warper.__setMinRentalPeriod(10);
        await warper.__setMaxRentalPeriod(100);
        // Setting the allocations for rental
        rentingParams = {
          listingId: 1,
          maxPaymentAmount: ethers.constants.MaxUint256,
          paymentToken: new AssetType({
            chainId,
            assetName: `erc20:${baseToken.address}`,
          }),
          rentalPeriod: 50,
          renter: new AccountId({ chainId, address: deployer.address }),
          warper: new AssetType({
            chainId,
            assetName: `erc20:${warper.address}`,
          }),
        };
        await mockAllocationResolver.setAllocations(
          rentalId,
          protocolAllocation,
          universeAllocation,
          listerAllocation
        );
      });

      context("too small", () => {
        it("reverts", async () => {
          await expect(metahubSDK.rent({ ...rentingParams, rentalPeriod: 9 }))
            .to.be.reverted;
        });
      });

      context("too large", () => {
        it("reverts", async () => {
          await expect(metahubSDK.rent({ ...rentingParams, rentalPeriod: 101 }))
            .to.be.reverted;
        });
      });

      context("renting period not exceeded", () => {
        it("rents successfully", async () => {
          await expect(metahubSDK.rent({ ...rentingParams, rentalPeriod: 50 }))
            .to.not.be.reverted;
        });
      });
    });

    context("availability period", () => {
      let rentingParams: RentingParams;
      let end: number;
      let start: number;
      beforeEach(async () => {
        const tsNow = await latestBlockTimestamp();
        await warper.__setMinRentalPeriod(10);
        await warper.__setMaxRentalPeriod(100);

        end = tsNow + 1000000;
        start = tsNow + 100;
        await warper.__setAvailabilityPeriodStart(start);
        await warper.__setAvailabilityPeriodEnd(end);

        rentingParams = {
          listingId: 1,
          maxPaymentAmount: ethers.constants.MaxUint256,
          paymentToken: new AssetType({
            chainId,
            assetName: `erc20:${baseToken.address}`,
          }),
          rentalPeriod: 50,
          renter: new AccountId({ chainId, address: deployer.address }),
          warper: new AssetType({
            chainId,
            assetName: `erc20:${warper.address}`,
          }),
        };
        await mockAllocationResolver.setAllocations(
          rentalId,
          protocolAllocation,
          universeAllocation,
          listerAllocation
        );
      });

      context("availability period not exceeded", () => {
        it("rents successfully", async () => {
          const tsNow = await latestBlockTimestamp();
          await waitBlockchainTime(start - tsNow);

          await expect(metahubSDK.rent({ ...rentingParams, rentalPeriod: 50 }))
            .to.not.be.reverted;
        });
      });

      context("current time too small", () => {
        it("reverts", async () => {
          await expect(metahubSDK.rent({ ...rentingParams, rentalPeriod: 50 }))
            .to.be.reverted;
        });
      });

      context("current time too big", () => {
        it("reverts", async () => {
          const tsNow = await latestBlockTimestamp();
          await waitBlockchainTime(end - tsNow);

          await expect(metahubSDK.rent({ ...rentingParams, rentalPeriod: 50 }))
            .to.be.reverted;
        });
      });
    });
  });

  describe("__onJoinedTournament", () => {
    let rentingParams: RentingParams;
    let tournamentId: number;

    beforeEach(async () => {
      await mockAllocationResolver.setAllocations(
        rentalId,
        protocolAllocation,
        universeAllocation,
        listerAllocation
      );
      await trvTournament.createTournament();
      tournamentId = 1;
      await warper
        .connect(deployer)
        .setAuthorizationStatus(trvTournament.address, true);
      await trvTournament
        .connect(deployer)
        .setWarperStatus(warper.address, true);
      await baseToken.transfer(renter.address, parseEther("100000"));
      await baseToken.transfer(stranger.address, parseEther("100000"));
      await baseToken
        .connect(renter)
        .increaseAllowance(trvTournament.address, parseEther("100000"));
      await baseToken
        .connect(stranger)
        .increaseAllowance(trvTournament.address, parseEther("100000"));
      rentingParams = {
        listingId: 1,
        maxPaymentAmount: ethers.constants.MaxUint256,
        paymentToken: new AssetType({
          chainId,
          assetName: `erc20:${baseToken.address}`,
        }),
        rentalPeriod: 50,
        renter: new AccountId({ chainId, address: renter.address }),
        warper: new AssetType({
          chainId,
          assetName: `erc20:${warper.address}`,
        }),
      };
      await metahubSDK.rent(rentingParams);
    });

    context("joining tournament using ERC20RewardWarper", () => {
      context("when caller is not a authorized caller", () => {
        it("reverts", async () => {
          await expect(
            warper
              .connect(stranger.address)
              .__onJoinedTournament(tournamentId, renter.address, tokenId)
          ).to.be.reverted;
        });
      });

      context("when stranger becomes authorized caller", () => {
        it("allows call __onJoinedTournamentHook()", async () => {
          await warper
            .connect(deployer)
            .setAuthorizationStatus(stranger.address, true);
          await expect(
            warper
              .connect(stranger)
              .__onJoinedTournament(tournamentId, renter.address, tokenId)
          ).to.not.be.reverted;
        });
      });

      context("when renter does not exists", () => {
        it("reverts", async () => {
          await expect(
            warper
              .connect(trvTournament.address)
              .__onJoinedTournament(tournamentId, stranger.address, tokenId)
          ).to.be.reverted;
        });
      });

      context("when token id does not exists", () => {
        it("reverts", async () => {
          await expect(
            warper
              .connect(trvTournament.address)
              .__onJoinedTournament(tournamentId, renter.address, 100)
          ).to.be.reverted;
        });
      });
    });

    context("joining tournament using MockTRVTournament", () => {
      context("when not an nft owner is calling", () => {
        it("should revert", async () => {
          await waitBlockchainTime(51);
          // works within the mock, for the explanatory part of TRV Tournament contract flow
          await expect(
            trvTournament
              .connect(stranger)
              .joinTournament(tournamentId, warper.address, tokenId, 100)
          ).to.be.reverted;
        });
      });

      context("when renting expired", () => {
        it("should revert", async () => {
          await waitBlockchainTime(51);
          // works within the mock, for the explanatory part of TRV Tournament contract flow
          await expect(
            trvTournament
              .connect(renter)
              .joinTournament(tournamentId, warper.address, tokenId, 100)
          ).to.be.reverted;
        });
      });

      context("when renter and token are correct", () => {
        it("should register and return tournament registration", async () => {
          // works within the mock, for the explanatory part of TRV Tournament contract flow
          await expect(
            trvTournament
              .connect(renter)
              .joinTournament(tournamentId, warper.address, tokenId, 100)
          ).to.not.be.reverted;
          const tournamentRegistration = await warper.getTournamentRegistration(
            tournamentId,
            renter.address
          );
          expect(tournamentRegistration).to.be.eq(tokenId);
        });
      });
    });
  });

  // // TODO add tests for for winning tournament via MockTRVTournament

  describe("__onDistribution", () => {
    let rentingParams: RentingParams;
    let tournamentId: number;
    let reward: BigNumber;

    beforeEach(async () => {
      await mockAllocationResolver.setAllocations(
        rentalId,
        protocolAllocation,
        universeAllocation,
        listerAllocation
      );
      await mockAllocationResolver.setAllocations(
        2,
        protocolAllocation,
        universeAllocation,
        listerAllocation
      );
      await trvTournament.createTournament();
      tournamentId = 1;
      reward = parseEther("100");
      await warper
        .connect(deployer)
        .setAuthorizationStatus(trvTournament.address, true);
      await trvTournament
        .connect(deployer)
        .setWarperStatus(warper.address, true);
      await baseToken.transfer(renter.address, parseEther("100000"));
      await baseToken.transfer(stranger.address, parseEther("100000"));
      await baseToken.transfer(trvTournament.address, parseEther("100000"));
      await baseToken
        .connect(renter)
        .increaseAllowance(trvTournament.address, parseEther("100000"));
      await baseToken
        .connect(stranger)
        .increaseAllowance(trvTournament.address, parseEther("100000"));

      rentingParams = {
        listingId: 1,
        maxPaymentAmount: ethers.constants.MaxUint256,
        paymentToken: new AssetType({
          chainId,
          assetName: `erc20:${baseToken.address}`,
        }),
        rentalPeriod: 50,
        renter: new AccountId({ chainId, address: renter.address }),
        warper: new AssetType({
          chainId,
          assetName: `erc20:${warper.address}`,
        }),
      };

      const rentingParams2 = {
        listingId: 2,
        maxPaymentAmount: ethers.constants.MaxUint256,
        paymentToken: new AssetType({
          chainId,
          assetName: `erc20:${baseToken.address}`,
        }),
        rentalPeriod: 50,
        renter: new AccountId({ chainId, address: renter.address }),
        warper: new AssetType({
          chainId,
          assetName: `erc20:${warper.address}`,
        }),
      };
      await metahubSDK.rent(rentingParams);
      await metahubSDK.rent(rentingParams2);
      await trvTournament
        .connect(renter)
        .joinTournament(tournamentId, warper.address, tokenId, 100);
      await trvTournament
        .connect(renter)
        .joinTournament(tournamentId, warper.address, 2, 100);
    });

    context("distributing reward using ERC20RewardWarper", () => {
      context("when caller is not an authorized caller", () => {
        it("reverts", async () => {
          await expect(
            warper
              .connect(stranger)
              .__onDistribution(
                tournamentId,
                renter.address,
                reward,
                baseToken.address
              )
          ).to.be.reverted;
        });
      });

      context("when stranger becomes authorized caller", () => {
        it("allows call __onJoinedTournamentHook()", async () => {
          await warper
            .connect(deployer)
            .setAuthorizationStatus(stranger.address, true);
          await expect(
            warper
              .connect(stranger)
              .__onDistribution(
                tournamentId,
                renter.address,
                reward,
                baseToken.address
              )
          ).to.be.reverted;
        });
      });

      context("when renter does not exists", () => {
        it("reverts", async () => {
          await expect(
            warper
              .connect(stranger)
              .__onDistribution(
                tournamentId,
                stranger.address,
                reward,
                baseToken.address
              )
          ).to.be.reverted;
        });
      });

      context("when reward is zero", () => {
        it("reverts", async () => {
          const newReward = parseEther("0");
          await expect(
            warper
              .connect(trvTournament.address)
              .__onDistribution(
                tournamentId,
                renter.address,
                newReward,
                baseToken.address
              )
          ).to.be.reverted;
        });
      });

      context("when base is token is zero address", () => {
        it("reverts", async () => {
          const newReward = parseEther("0");
          await expect(
            warper
              .connect(trvTournament.address)
              .__onDistribution(
                tournamentId,
                renter.address,
                newReward,
                stranger.address
              )
          ).to.be.reverted;
        });
      });

      context("when token and renter are correct", () => {
        it("executes and distributes", async () => {
          await expect(
            warper
              .connect(trvTournament.address)
              .__onDistribution(
                tournamentId,
                renter.address,
                reward,
                baseToken.address
              )
          ).to.not.be.reverted;
        });
      });
    });

    context("distributing using MockTRVTournament", () => {
      context("when caller is not an authorized caller", () => {
        it("reverts", async () => {
          await expect(
            trvTournament.connect(stranger).setWinner(tournamentId, tokenId, 2)
          ).to.be.reverted;
        });
      });

      context("when token and renter are correct", () => {
        it("executes and distributes", async () => {
          await expect(
            trvTournament.connect(renter).setWinner(tournamentId, tokenId, 2)
          ).to.not.be.reverted;
        });
      });
    });
  });
});
