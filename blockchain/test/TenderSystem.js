const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TenderSystem", function () {
  let TenderSystem;
  let tenderSystem;
  let owner;
  let oracle;
  let govOfficial;
  let contractor1;
  let contractor2;

  beforeEach(async function () {
    [owner, oracle, govOfficial, contractor1, contractor2] = await ethers.getSigners();
    TenderSystem = await ethers.getContractFactory("TenderSystem");
    tenderSystem = await TenderSystem.deploy(oracle.address, govOfficial.address);
  });

  describe("Deployment", function () {
    it("Should set the right roles", async function () {
      expect(await tenderSystem.oracleWallet()).to.equal(oracle.address);
      expect(await tenderSystem.govOfficialWallet()).to.equal(govOfficial.address);
    });
  });

  describe("Bidding Process", function () {
    it("Should allow a contractor to submit a bid", async function () {
      const tenderId = 1;
      const bidAmount = ethers.parseEther("10"); // 10 ETH
      const stateCode = ethers.encodeBytes32String("MH");
      
      await expect(tenderSystem.connect(contractor1).submitBid(
        tenderId, bidAmount, stateCode,
        0, 1, 0, // RoadType.Highway, TerrainType.Hilly, SoilType.Clay
        12500, 4, 150, 365, 
        550, 200, 50000, 2, 5
      )).to.emit(tenderSystem, "BidSubmitted")
        .withArgs(tenderId, contractor1.address, 0);

      const bidCount = await tenderSystem.getBidsCount(tenderId);
      expect(bidCount).to.equal(1n);
    });
  });

  describe("Oracle & Validation", function () {
    let tenderId = 1;
    beforeEach(async function () {
      await tenderSystem.connect(contractor1).submitBid(
        tenderId, ethers.parseEther("10"), ethers.encodeBytes32String("MH"),
        0, 1, 0, 12500, 4, 150, 365, 550, 200, 50000, 2, 5
      );
    });

    it("Should allow the Oracle to validate a bid", async function () {
      await expect(tenderSystem.connect(oracle).updateValidity(tenderId, 0, true))
        .to.emit(tenderSystem, "BidValidated")
        .withArgs(tenderId, contractor1.address, true);

      const bid = await tenderSystem.getBidDetails(tenderId, 0);
      expect(bid.isMlValid).to.be.true;
    });

    it("Should reject validation from unauthorized users", async function () {
      await expect(tenderSystem.connect(contractor2).updateValidity(tenderId, 0, true))
        .to.be.revertedWith("Only ML Oracle can call this");
    });
  });

  describe("Awarding & Certification", function () {
    let tenderId = 1;
    beforeEach(async function () {
      await tenderSystem.connect(contractor1).submitBid(
        tenderId, ethers.parseEther("10"), ethers.encodeBytes32String("MH"),
        0, 1, 0, 12500, 4, 150, 365, 550, 200, 50000, 2, 5
      );
    });

    it("Should allow Gov Official to award contract to valid bid and mint NFT", async function () {
      // Validate first
      await tenderSystem.connect(oracle).updateValidity(tenderId, 0, true);

      // Award Contract
      await expect(tenderSystem.connect(govOfficial).awardContract(tenderId, 0))
        .to.emit(tenderSystem, "ContractAwarded")
        .withArgs(tenderId, contractor1.address, 1);

      // Check NFT ownership
      expect(await tenderSystem.ownerOf(1)).to.equal(contractor1.address);
      
      // Check Tender is resolved
      expect(await tenderSystem.tenderResolved(tenderId)).to.be.true;
    });

    it("Should prevent trading the Soulbound certificate", async function () {
      await tenderSystem.connect(oracle).updateValidity(tenderId, 0, true);
      await tenderSystem.connect(govOfficial).awardContract(tenderId, 0);

      // Attempt to transfer NFT
      await expect(tenderSystem.connect(contractor1).transferFrom(contractor1.address, contractor2.address, 1))
        .to.be.revertedWith("Certificates are Soulbound and cannot be transferred.");
    });

    it("Should not allow awarding an invalid bid", async function () {
      // Not validated by Oracle
      await expect(tenderSystem.connect(govOfficial).awardContract(tenderId, 0))
        .to.be.revertedWith("Cannot award to an invalid bid");
    });
  });
});
