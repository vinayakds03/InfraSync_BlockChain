// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// Enums instead of Strings to save massive gas!
enum RoadType { Highway, ExpressWay, Rural, Urban }
enum TerrainType { Flat, Hilly, Mountainous }
enum SoilType { Clay, Sandy, Rocky }

contract TenderSystem is ERC721 {
    uint256 private _nextTokenId;

    struct OnChainBidDetails {
        // Identity & Financials
        address bidderAddress;           // Wallet of the contractor
        uint256 bidAmount;               // Requested budget (in Wei)
        
        // Scaled Engineering Inputs (Translated from Python API Floats)
        bytes32 stateCode;               // e.g., "MH" (bytes32 is cheaper than string)
        RoadType roadType;
        TerrainType terrainType;
        SoilType soilType;
        
        uint256 roadLengthMeters;        // float km * 1000
        uint8 lanes;                     // Max 255 lanes
        uint256 numWorkers;
        uint256 durationDays;
        
        uint256 subgradeCBRValueX100;    // float * 100 (e.g., 5.5 = 550)
        uint256 pavementThicknessMm;     // integer mm
        uint256 earthworkVolumeM3;
        uint8 bridgeCount;
        uint8 culvertCount;

        // Validation & Award Status
        bool isMlValid;                  // Updated EXCLUSIVELY by the ML Oracle
        bool awarded;                    // True if this bid was selected as winner
    }

    // State Variables
    mapping(uint256 => OnChainBidDetails[]) public tenderBids; // tenderId => Bids array
    mapping(uint256 => bool) public tenderResolved; // true if a winner has been chosen for tenderId
    address public oracleWallet; // The specific backend wallet allowed to set 'isMlValid'
    address public govOfficialWallet; // Allowed to award contract

    // Events
    event BidSubmitted(uint256 indexed tenderId, address indexed bidderAddress, uint256 bidIndex);
    event BidValidated(uint256 indexed tenderId, address indexed bidderAddress, bool isValid);
    event ContractAwarded(uint256 indexed tenderId, address indexed winningBidder, uint256 certificateTokenId);

    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == oracleWallet, "Only ML Oracle can call this");
        _;
    }

    modifier onlyGovOfficial() {
        require(msg.sender == govOfficialWallet, "Only Government Official can award");
        _;
    }

    // Initialize ERC721 Token for Certificates
    constructor(address _oracleWallet, address _govOfficialWallet) ERC721("InfrSyncCertificate", "INFR-CERT") {
        oracleWallet = _oracleWallet;
        govOfficialWallet = _govOfficialWallet;
        _nextTokenId = 1; // Start token IDs at 1
    }

    // Submit a bid to a specific tender
    function submitBid(
        uint256 tenderId,
        uint256 bidAmount,
        bytes32 stateCode,
        RoadType roadType,
        TerrainType terrainType,
        SoilType soilType,
        uint256 roadLengthMeters,
        uint8 lanes,
        uint256 numWorkers,
        uint256 durationDays,
        uint256 subgradeCBRValueX100,
        uint256 pavementThicknessMm,
        uint256 earthworkVolumeM3,
        uint8 bridgeCount,
        uint8 culvertCount
    ) external {
        require(!tenderResolved[tenderId], "Tender already resolved");

        OnChainBidDetails memory newBid = OnChainBidDetails({
            bidderAddress: msg.sender,
            bidAmount: bidAmount,
            stateCode: stateCode,
            roadType: roadType,
            terrainType: terrainType,
            soilType: soilType,
            roadLengthMeters: roadLengthMeters,
            lanes: lanes,
            numWorkers: numWorkers,
            durationDays: durationDays,
            subgradeCBRValueX100: subgradeCBRValueX100,
            pavementThicknessMm: pavementThicknessMm,
            earthworkVolumeM3: earthworkVolumeM3,
            bridgeCount: bridgeCount,
            culvertCount: culvertCount,
            isMlValid: false,
            awarded: false
        });

        tenderBids[tenderId].push(newBid);
        uint256 bidIndex = tenderBids[tenderId].length - 1;
        emit BidSubmitted(tenderId, msg.sender, bidIndex);
    }

    function getBidsCount(uint256 tenderId) external view returns (uint256) {
        return tenderBids[tenderId].length;
    }

    function getBidDetails(uint256 tenderId, uint256 bidIndex) external view returns (OnChainBidDetails memory) {
        require(bidIndex < tenderBids[tenderId].length, "Bid index out of bounds");
        return tenderBids[tenderId][bidIndex];
    }

    // AI Oracle sets validity
    function updateValidity(uint256 tenderId, uint256 bidIndex, bool isValid) external onlyOracle {
        require(bidIndex < tenderBids[tenderId].length, "Bid index out of bounds");
        require(!tenderResolved[tenderId], "Tender already resolved");
        
        tenderBids[tenderId][bidIndex].isMlValid = isValid;
        emit BidValidated(tenderId, tenderBids[tenderId][bidIndex].bidderAddress, isValid);
    }

    // Government official awards the contract to a valid bid
    function awardContract(uint256 tenderId, uint256 bidIndex) external onlyGovOfficial {
        require(!tenderResolved[tenderId], "Tender already awarded");
        require(bidIndex < tenderBids[tenderId].length, "Bid index out of bounds");
        
        OnChainBidDetails storage winningBid = tenderBids[tenderId][bidIndex];
        require(winningBid.isMlValid == true, "Cannot award to an invalid bid");

        winningBid.awarded = true;
        tenderResolved[tenderId] = true;

        // Mint Soulbound Certificate NFT to the Winner
        uint256 tokenId = _nextTokenId++;
        _safeMint(winningBid.bidderAddress, tokenId);

        emit ContractAwarded(tenderId, winningBid.bidderAddress, tokenId);
    }

    // Override required for OpenZeppelin 5.0 to make NFT Soulbound (non-transferable)
    function _update(address to, uint256 tokenId, address auth) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        // Only allow minting (from == 0) and burning (to == 0), disallow regular transfers
        require(from == address(0) || to == address(0), "Certificates are Soulbound and cannot be transferred.");
        return super._update(to, tokenId, auth);
    }
}
