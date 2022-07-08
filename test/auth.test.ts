import { expect } from "chai";
import { ethers, run } from "hardhat";
import { Auth } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { token } from "@iqprotocol/solidity-contracts-nft/typechain/@openzeppelin/contracts";

describe("Auth", function () {
  let auth: Auth;
  let deployer: SignerWithAddress;
  let authorizedCaller: SignerWithAddress;
  let authorizedCaller2: SignerWithAddress;
  let stranger: SignerWithAddress;

  before(async () => {
    deployer = await ethers.getNamedSigner("deployer");
    authorizedCaller = await ethers.getNamedSigner("lister");
    authorizedCaller2 = await ethers.getNamedSigner("renter");
    [stranger] = await ethers.getUnnamedSigners();
    auth = (await run("deploy:auth", {})) as Auth;
    await auth
      .connect(deployer)
      .setAuthorizationStatus(authorizedCaller.address, true);
  });

  describe("isAuthorizedCaller", () => {
    context("When caller is not authorized", () => {
      it("returns false", async () => {
        await expect(
          auth.isAuthorizedCaller(stranger.address)
        ).to.eventually.eq(false);
      });
    });

    context("When caller is authorized", () => {
      it("returns true", async () => {
        await expect(
          auth.isAuthorizedCaller(authorizedCaller.address)
        ).to.eventually.eq(true);
      });
    });
  });

  describe("setAuthorizationStatus", () => {
    context("When msg.sender is not an owner", () => {
      it("reverts", async () => {
        await expect(
          auth
            .connect(stranger)
            .setAuthorizationStatus(authorizedCaller2.address, true)
        ).to.be.reverted;
      });
    });

    context("When msg.sender is an owner", () => {
      it("updates status", async () => {
        await auth
          .connect(deployer)
          .setAuthorizationStatus(authorizedCaller2.address, true);
        await expect(
          auth.isAuthorizedCaller(authorizedCaller2.address)
        ).to.eventually.eq(true);
      });
    });
  });
});
