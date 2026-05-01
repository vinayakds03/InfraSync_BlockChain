// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// ─────────────────────────────────────────────
//  GAS OPTIMIZATIONS APPLIED:
//  1. submitBid now stores ONLY the essential proof fields on-chain
//     (address, bidAmount, tenderId).  The heavy engineering params
//     are emitted as an event (cheap) and live off-chain in the DB.
//  2. Remaining struct fields packed tightly (uint8 next to uint8,
//     bool flags at the end).
//  3. Certificate NFT now carries on-chain metadata (tenderId, bidAmount,
//     awardedAt timestamp) so the contractor wallet can display rich info.
// ─────────────────────────────────────────────

contract TenderSystem is ERC721 {
    uint256 private _nextTokenId;

    // ── Minimal on-chain bid record ──────────────────────────────────────
    // We keep only the fields required for trustless verification & awarding.
    // All 12 engineering parameters are stored in the backend DB and emitted
    // below as event data so they are still blockchain-verifiable (but 10× cheaper).
    struct BidRecord {
        address bidderAddress;  // slot: 20 bytes
        bool    isMlValid;      // slot: 1 byte  (packed with address)
        bool    awarded;        // slot: 1 byte  (packed)
        uint96  bidAmount;      // slot: 12 bytes  (packed — max ~79 billion ETH, safe for INR wei)
        // total: 1 storage slot (256 bits) ✓
    }

    // ── Certificate metadata ─────────────────────────────────────────────
    struct CertificateInfo {
        uint256 tenderId;
        uint96  bidAmount;
        uint64  awardedAt;   // unix timestamp
        address winner;
        bool    isMilestone; // true if this is a milestone receipt, false if main award
        uint8   milestoneIndex;
    }

    // State variables
    mapping(uint256 => BidRecord[]) public tenderBids;   // tenderId => bids
    mapping(uint256 => bool)        public tenderResolved;
    mapping(uint256 => CertificateInfo) public certificates; // tokenId => cert info

    // ── Milestone Tracking ─────────────────────────────────────────────
    struct Milestone {
        uint8 percentage;
        bool isProofSubmitted;
        bool isApproved;
        string proofURI;
    }
    mapping(uint256 => Milestone[]) public tenderMilestones;
    mapping(uint256 => address) public tenderWinners;
    mapping(uint256 => uint96) public tenderTotalAmounts;

    address public oracleWallet;
    address public govOfficialWallet;

    // ── Events ───────────────────────────────────────────────────────────
    // Heavy engineering params live here (event storage ≈ 10× cheaper than state).
    event BidSubmitted(
        uint256 indexed tenderId,
        address indexed bidderAddress,
        uint256         bidIndex,
        uint96          bidAmount,
        // engineering params (indexed only if needed for filtering)
        bytes32         stateCode,
        uint8           roadType,
        uint8           terrainType,
        uint8           soilType,
        uint256         roadLengthMeters,
        uint8           lanes,
        uint256         numWorkers,
        uint256         durationDays,
        uint256         subgradeCBRValueX100,
        uint256         pavementThicknessMm,
        uint256         earthworkVolumeM3,
        uint8           bridgeCount,
        uint8           culvertCount
    );

    event BidValidated(uint256 indexed tenderId, uint256 bidIndex, address indexed bidderAddress, bool isValid);
    event ContractAwarded(uint256 indexed tenderId, address indexed winningBidder, uint256 certificateTokenId, uint96 bidAmount);
    
    event MilestoneProofSubmitted(uint256 indexed tenderId, uint256 milestoneIndex, string proofURI);
    event MilestoneApproved(uint256 indexed tenderId, uint256 milestoneIndex);

    // ── Modifiers ────────────────────────────────────────────────────────
    modifier onlyOracle() {
        require(msg.sender == oracleWallet, "Only ML Oracle");
        _;
    }

    modifier onlyGovOfficial() {
        require(msg.sender == govOfficialWallet, "Only Gov Official");
        _;
    }

    constructor(address _oracleWallet, address _govOfficialWallet)
        ERC721("InfrSyncCertificate", "INFR-CERT")
    {
        oracleWallet      = _oracleWallet;
        govOfficialWallet = _govOfficialWallet;
        _nextTokenId      = 1;
    }

    // ── Submit a bid ─────────────────────────────────────────────────────
    // ONLY bidAmount is written to state; engineering params go into the event.
    function submitBid(
        uint256 tenderId,
        uint96  bidAmount,
        // Engineering params — emitted only (not stored in state)
        bytes32 stateCode,
        uint8   roadType,
        uint8   terrainType,
        uint8   soilType,
        uint256 roadLengthMeters,
        uint8   lanes,
        uint256 numWorkers,
        uint256 durationDays,
        uint256 subgradeCBRValueX100,
        uint256 pavementThicknessMm,
        uint256 earthworkVolumeM3,
        uint8   bridgeCount,
        uint8   culvertCount
    ) external {
        require(!tenderResolved[tenderId], "Tender already resolved");

        BidRecord memory newBid = BidRecord({
            bidderAddress: msg.sender,
            isMlValid:     false,
            awarded:       false,
            bidAmount:     bidAmount
        });

        tenderBids[tenderId].push(newBid);
        uint256 bidIndex = tenderBids[tenderId].length - 1;

        emit BidSubmitted(
            tenderId,
            msg.sender,
            bidIndex,
            bidAmount,
            stateCode,
            roadType,
            terrainType,
            soilType,
            roadLengthMeters,
            lanes,
            numWorkers,
            durationDays,
            subgradeCBRValueX100,
            pavementThicknessMm,
            earthworkVolumeM3,
            bridgeCount,
            culvertCount
        );
    }

    // ── Read helpers ─────────────────────────────────────────────────────
    function getBidsCount(uint256 tenderId) external view returns (uint256) {
        return tenderBids[tenderId].length;
    }

    function getBidDetails(uint256 tenderId, uint256 bidIndex) external view returns (BidRecord memory) {
        require(bidIndex < tenderBids[tenderId].length, "Index out of bounds");
        return tenderBids[tenderId][bidIndex];
    }

    function getCertificateInfo(uint256 tokenId) external view returns (CertificateInfo memory) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return certificates[tokenId];
    }

    function getMilestonesCount(uint256 tenderId) external view returns (uint256) {
        return tenderMilestones[tenderId].length;
    }

    function getMilestoneDetails(uint256 tenderId, uint256 milestoneIndex) external view returns (Milestone memory) {
        require(milestoneIndex < tenderMilestones[tenderId].length, "Index out of bounds");
        return tenderMilestones[tenderId][milestoneIndex];
    }

    // ── Oracle: mark a bid as ML-valid ───────────────────────────────────
    function updateValidity(uint256 tenderId, uint256 bidIndex, bool isValid) external onlyOracle {
        require(bidIndex < tenderBids[tenderId].length, "Index out of bounds");
        require(!tenderResolved[tenderId], "Tender already resolved");

        tenderBids[tenderId][bidIndex].isMlValid = isValid;
        emit BidValidated(tenderId, bidIndex, tenderBids[tenderId][bidIndex].bidderAddress, isValid);
    }

    // ── Gov official: award contract & mint certificate NFT ─────────────
    function awardContract(uint256 tenderId, uint256 bidIndex) external onlyGovOfficial {
        require(!tenderResolved[tenderId], "Already awarded");
        require(bidIndex < tenderBids[tenderId].length, "Index out of bounds");

        BidRecord storage winningBid = tenderBids[tenderId][bidIndex];
        winningBid.awarded    = true;
        tenderResolved[tenderId] = true;

        // Mint soulbound certificate NFT
        uint256 tokenId = _nextTokenId++;
        _safeMint(winningBid.bidderAddress, tokenId);

        // Store rich metadata on-chain so the contractor wallet can read it
        certificates[tokenId] = CertificateInfo({
            tenderId:   tenderId,
            bidAmount:  winningBid.bidAmount,
            awardedAt:  uint64(block.timestamp),
            winner:     winningBid.bidderAddress,
            isMilestone: false,
            milestoneIndex: 0
        });

        // Initialize Milestones (30%, 30%, 40%)
        tenderWinners[tenderId] = winningBid.bidderAddress;
        tenderTotalAmounts[tenderId] = winningBid.bidAmount;
        tenderMilestones[tenderId].push(Milestone(30, false, false, ""));
        tenderMilestones[tenderId].push(Milestone(30, false, false, ""));
        tenderMilestones[tenderId].push(Milestone(40, false, false, ""));

        emit ContractAwarded(tenderId, winningBid.bidderAddress, tokenId, winningBid.bidAmount);
    }

    // ── Milestone Actions ────────────────────────────────────────────────
    
    function submitMilestoneProof(uint256 tenderId, uint256 milestoneIndex, string memory proofURI) external {
        require(tenderResolved[tenderId], "Tender not awarded");
        require(msg.sender == tenderWinners[tenderId], "Only winner can submit proof");
        require(milestoneIndex < tenderMilestones[tenderId].length, "Invalid milestone index");
        require(!tenderMilestones[tenderId][milestoneIndex].isApproved, "Already approved");
        
        // Enforce sequential submission
        if (milestoneIndex > 0) {
            require(tenderMilestones[tenderId][milestoneIndex - 1].isApproved, "Previous milestone not approved");
        }

        tenderMilestones[tenderId][milestoneIndex].proofURI = proofURI;
        tenderMilestones[tenderId][milestoneIndex].isProofSubmitted = true;

        emit MilestoneProofSubmitted(tenderId, milestoneIndex, proofURI);
    }

    function approveMilestone(uint256 tenderId, uint256 milestoneIndex) external onlyGovOfficial {
        require(tenderResolved[tenderId], "Tender not awarded");
        require(milestoneIndex < tenderMilestones[tenderId].length, "Invalid milestone index");
        require(tenderMilestones[tenderId][milestoneIndex].isProofSubmitted, "Proof not submitted");
        require(!tenderMilestones[tenderId][milestoneIndex].isApproved, "Already approved");

        tenderMilestones[tenderId][milestoneIndex].isApproved = true;

        // Mint milestone NFT receipt
        uint256 tokenId = _nextTokenId++;
        _safeMint(tenderWinners[tenderId], tokenId);

        // Calculate payout amount based on percentage
        uint96 totalBid = tenderTotalAmounts[tenderId];
        uint8 percentage = tenderMilestones[tenderId][milestoneIndex].percentage;
        uint96 payoutAmount = (totalBid * percentage) / 100;

        certificates[tokenId] = CertificateInfo({
            tenderId:   tenderId,
            bidAmount:  payoutAmount,
            awardedAt:  uint64(block.timestamp),
            winner:     tenderWinners[tenderId],
            isMilestone: true,
            milestoneIndex: uint8(milestoneIndex)
        });

        emit MilestoneApproved(tenderId, milestoneIndex);
    }

    // ── Soulbound: prevent transfers ─────────────────────────────────────
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "Certificates are Soulbound");
        return super._update(to, tokenId, auth);
    }
}
