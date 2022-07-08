import { expect } from "chai";
import { ethers, run } from "hardhat";
import { MockTournament } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { token } from "@iqprotocol/solidity-contracts-nft/typechain/@openzeppelin/contracts";

describe("Tournament", function () {
  let tournament: MockTournament;
  let lister: SignerWithAddress;
  let renter: SignerWithAddress;
  let deployer: SignerWithAddress;
  let stranger: SignerWithAddress;

  const rentalId: number = 1;
  const tokenId: number = 5;
  const tournamentId: number = 10;
  const protocolAllocation: number = 500;
  const universeAllocation: number = 1000;
  const listerAllocation: number = 3500;

  before(async () => {
    deployer = await ethers.getNamedSigner("deployer");
    lister = await ethers.getNamedSigner("lister");
    renter = await ethers.getNamedSigner("renter");
    [stranger] = await ethers.getUnnamedSigners();
    tournament = (await run("deploy:mock-tournament", {})) as MockTournament;
  });

  describe("getAllocations", () => {
    context("When rental allocations are not registered", () => {
      it("reverts", async () => {
        await expect(tournament.getAllocations(rentalId)).to.be.revertedWith(
          "AllocationNotDefined"
        );
      });
    });

    context("When rental allocations are registered", () => {
      it("registers allocation", async () => {
        await tournament
          .connect(deployer)
          .setAllocations(
            rentalId,
            protocolAllocation,
            universeAllocation,
            listerAllocation,
            lister.address,
            renter.address
          );
        const allocations = await tournament.getAllocations(rentalId);
        expect(allocations.protocolAllocation).to.be.eq(protocolAllocation);
        expect(allocations.universeAllocation).to.be.eq(universeAllocation);
        expect(allocations.listerAllocation).to.be.eq(listerAllocation);
        expect(allocations.lister).to.be.eq(lister.address);
        expect(allocations.renter).to.be.eq(renter.address);
      });
    });
  });

  describe("getRentalForToken", () => {
    context("When rental was not registered for renter and token ID", () => {
      it("reverts", async () => {
        await expect(
          tournament.getRentalForToken(renter.address, tokenId)
        ).to.be.revertedWith("RentalDoesNotExists");
      });
    });

    context("When rental was registered for renter and token ID", () => {
      it("registers rental", async () => {
        await tournament
          .connect(deployer)
          .setRentalForToken(renter.address, tokenId, rentalId);
        const rentalForToken = await tournament.getRentalForToken(
          renter.address,
          tokenId
        );
        expect(rentalForToken.toNumber()).to.be.eq(rentalId);
      });
    });
  });

  describe("getTournamentRegistration", () => {
    context("When rental is not registered for tournament", () => {
      it("reverts", async () => {
        await expect(
          tournament.getTournamentRegistration(tournamentId, stranger.address)
        ).to.be.revertedWith("TokenIsNotRegisteredForTournament");
      });

      it("returns registration", async () => {
        await tournament
          .connect(deployer)
          .registerForTournament(tournamentId, renter.address, tokenId);
        const tournamentRegistration =
          await tournament.getTournamentRegistration(
            tournamentId,
            renter.address
          );
        expect(tournamentRegistration.toNumber()).to.be.eq(tokenId);
      });
    });
  });
});
