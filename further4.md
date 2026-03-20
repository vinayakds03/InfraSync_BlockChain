# InfrSync: The Ultimate Master Architecture (Final Blueprint)

This document is the absolute synthesis of our architectural planning. It defines the ultimate "Open Data" enterprise platform that is **100% free to develop and test**, combining granular on-chain transparency with a highly optimized Custom First-Party Oracle.

---

## 1. The Core Philosophy: "Ultimate Open Data"
Instead of hiding bid parameters off-chain, we will place every critical engineering metric (`Earthwork_Volume_m3`, `Culvert_Count`, `Num_Workers`) directly onto the immutable public ledger. 

This enables maximum accountability. Any journalist, citizen, or frontend dashboard can query the blockchain and see *exactly* why a bid was marked as valid or invalid by the AI.

To protect contractor privacy, only project-related metrics are put on the blockchain. Personally Identifiable Information (PII) like phone numbers and web passwords remain strictly in a traditional Web2 database (MongoDB).

---

## 2. The 100% Free Technology Stack
This architecture is designed for a final-year project, meaning no credit cards, no gas fees, and zero hosting costs.

| Component | Tool / Platform | Cost | Purpose |
| :--- | :--- | :--- | :--- |
| **Blockchain** | Ethereum Sepolia Testnet | $0 (Free Faucet) | The immutable public ledger securing the system. |
| **User Connect**| MetaMask / `wagmi` / `viem` | $0 | The frontend connection forcing users to cryptographically sign bids. |
| **Backend & ML** | FastAPI / Python | $0 (Render/Local) | Runs the XGBoost ML evaluation model. |
| **The Oracle** | Python `web3.py` Library | $0 (Custom Built)| Acts as a **Custom First-Party Oracle**. Takes the ML result and automatically pushes it to the Smart Contract. |
| **Web2 Database**| MongoDB Atlas (M0 Tier) | $0 (500MB Free) | Stores Web2 user profiles, hashed passwords, and contact info. |

---

## 3. The Smart Contract Design (Gas-Optimized On-Chain Data)

Since Solidity does not support decimals (`floats`) and storing strings is expensive, we use severe **Gas Optimization Engineering**. We scale floats by multiplying them (e.g., kilometers to meters) and use `enums` instead of strings.

### `TenderSystem.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Enums instead of Strings to save massive gas!
enum RoadType { Highway, ExpressWay, Rural, Urban }
enum TerrainType { Flat, Hilly, Mountainous }
enum SoilType { Clay, Sandy, Rocky }

contract TenderSystem {

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

        // Validation
        bool isMlValid;                  // Updated EXCLUSIVELY by the ML Oracle
    }

    // State Variables
    mapping(uint256 => OnChainBidDetails[]) public tenderBids; // tenderId => Bids
    address public oracleWallet; // The specific backend wallet allowed to set 'isMlValid'

    // Events
    event BidSubmitted(uint256 indexed tenderId, address indexed bidderAddress);
    event BidValidated(uint256 indexed tenderId, address indexed bidderAddress, bool isValid);
}
```

---

## 4. The Data Lifecycle (How It Works)

1.  **Submission (Frontend):** 
    - A Contractor fills out the complex `BidInput` engineering form on the Next.js React UI.
    - Instead of just saving to a database, MetaMask pops up. The React state converts the floats (like `12.5km` to `12500m`), maps "Mountainous" to `TerrainType.Mountainous` (`2`), and asks the user to sign the transaction paying fake Sepolia ETH.
2.  **The Trigger (Blockchain -> Backend):** 
    - The `BidSubmitted` event fires on the Sepolia Testnet.
    - The FastAPI server, running a webhook listener, instantly detects the new bid.
3.  **The Evaluation & Oracle Push (Backend -> Blockchain):** 
    - The FastAPI server runs the XGBoost Machine Learning model. 
    - It determines the bid is Valid (e.g., 98% accurate to the algorithmic baseline).
    - The backend uses `web3.py` and its deeply secured private key to sign a new transaction. It calls `updateValidity(tenderId, bidderAddress, true)` on the blockchain.
4.  **The Award (Gov Official):**
    - The Government Official logs in. They can only click the "Award Contract" button on bids where the blockchain firmly states `isMlValid == true`.

---

## 5. Implementation Roadmap

### Phase 1: Smart Contract Foundation
- [ ] Initialize `Hardhat` and write the highly optimized `TenderSystem.sol`.
- [ ] Write unit tests to prove scaling math works and access control restricts standard users from modifying `isMlValid`.
- [ ] Deploy to Sepolia Testnet.

### Phase 2: React Web3 Integration
- [ ] Install `wagmi` and configure RainbowKit/MetaMask.
- [ ] Rebuild the Bid Submission form to trigger `writeContract` instead of a standard `fetch` POST request.

### Phase 3: The Custom API Oracle Bridge
- [ ] Inject `web3.py` into `api.py`.
- [ ] Build the webhook listener.
- [ ] Code the automated transaction-signing function so the ML model acts as the Oracle.

### Phase 4: The Maximum Transparency Dashboard
- [ ] Create a page allowing anyone to enter a Tender ID.
- [ ] The Next.js frontend fetches the massive array of bids directly from the blockchain node, decodes the scaled numbers (e.g., `12500m / 1000 = 12.5km`), and renders them beautifully on-screen for complete public auditability.
