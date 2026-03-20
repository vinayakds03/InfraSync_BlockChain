# InfrSync: Ultimate Hybrid Blockchain Roadmap

This document serves as the final, comprehensive architectural roadmap for integrating an enterprise-grade blockchain ledger into the InfrSync bidding system. 

It is designed specifically for a **Final Year Project**, ensuring that the entire technology stack requires **$0** to run while demonstrating cutting-edge Web3 skills.

---

## 1. The "Zero-Cost" Enterprise Architecture

To achieve massive gas fee savings while maintaining 100% transparent auditability, InfrSync will utilize a **Hybrid Decentralized Storage Model**. We are splitting the bid data into *Cold Data* and *Hot Data*.

### A. Cold Data (IPFS via Pinata - FREE)
Blockchain storage is expensive. Instead of pushing 20 granular form fields (materials, labor, wages, road configurations) directly to the Ethereum network, the frontend will package this form data into a `JSON` object.
*   **Action:** This JSON is uploaded to the **InterPlanetary File System (IPFS)** using Pinata's free tier. 
*   **Result:** Pinata returns a single *CID (Content Identifier) Hash* (e.g., `QmYwAP...`). This hash is mathematically derived from the document's contents. If a single number in the JSON changes, the hash changes completely.

### B. Hot Data (Smart Contract on Sepolia - FREE)
The Smart Contract will only store the absolute bare minimum required for financial and authoritative tracking. It binds the contractor's identity and bid amount to the IPFS hash generated in the previous step.
*   **Action:** The user's MetaMask wallet signs a transaction paying a fake "gas fee" using free testnet tokens from an Alchemy Faucet. 
*   **Result:** The bid is eternally stored on the Sepolia Testnet. 

---

## 2. Smart Contract Design (TenderSystem.sol)

Here is the finalized Solidity struct design, optimized for minimal gas fees:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TenderSystem {
    // Highly Gas-Optimized Struct (4 variables instead of 20)
    struct BidTracker {
        address bidderWallet;    // The wallet that submitted the bid
        uint256 bidAmount;       // Financial total requested
        string ipfsDataHash;     // The IPFS Hash containing ALL exact road/labor parameters
        bool mlIsValid;          // Validated off-chain by the FastAPI Oracle
    }

    struct Tender {
        uint256 tenderId;
        address officialWallet;  // Gov Official in charge
        bool isOpen;
        address winningContractor; // Set ONLY if mlIsValid == true
    }

    // Mappings
    mapping(uint256 => Tender) public tenders;
    mapping(uint256 => BidTracker[]) public tenderBids;

    // Events for the frontend dashboard
    event BidSubmitted(uint256 indexed tenderId, address indexed bidderWallet, string ipfsDataHash);
    event MlValidityUpdated(uint256 indexed tenderId, address indexed bidderWallet, bool isValid);
    event TenderAwarded(uint256 indexed tenderId, address indexed winningContractor);
}
```

---

## 3. The 100% Free Technology Stack

| Component | Tool used | Cost | Purpose |
| :--- | :--- | :--- | :--- |
| **Blockchain** | Ethereum Sepolia Testnet | $0 (Free Faucet Gas) | The immutable ledger securing the system. |
| **User Wallet** | MetaMask | $0 | Browser extension for signing transactions. |
| **Smart Contracts**| Hardhat / Solidity | $0 (Local tool) | For writing, testing, and deploying contracts. |
| **Database** | MongoDB Atlas (M0 Tier)| $0 (500MB Free) | Stores PII (Phone numbers, Names, Passwords). |
| **Decent. Storage**| Pinata (IPFS) | $0 (1GB Free) | Stores the heavy JSON bid parameter models. |
| **Frontend** | Next.js / wagmi / viem| $0 (Vercel Hosting) | The UI. Read/Writes to blockchain via MetaMask. |
| **Backend Oracle** | FastAPI / web3.py | $0 (Custom Oracle)| Acts as a **Custom First-Party Oracle**. It runs the ML module and automatically signs transactions (pushes data) onto the blockchain. |

---

## 4. Implementation Work Plan (Step-by-Step)

Here is the exact battle plan to build this architecture from start to finish:

### Phase 1: Smart Contract Foundation (Blockchain Layer)
- [ ] Initialize a `Hardhat` development environment.
- [ ] Write `TenderSystem.sol` enforcing Role-Based Access Control (`onlyOfficial`, `onlyOracle`).
- [ ] Configure `hardhat.config.js` to deploy to the **Sepolia Testnet**.
- [ ] Deploy the contract using test ETH obtained from an Alchemy/Infura Faucet.

### Phase 2: Decentralized Storage Integration (Frontend Layer)
- [ ] Create a free Pinata IPFS account and obtain API Keys.
- [ ] Update the Next.js `FileUpload` or Bid Submission UI. 
- [ ] On Form Submit: Stop sending data to MongoDB immediately. Instead, hit the Pinata API to upload the JSON payload and return the `CID Hash`.

### Phase 3: Web3 Wallet Integration (Frontend Layer)
- [ ] Install `wagmi` and `viem` in the Next.js project.
- [ ] Add the **"Connect Wallet (MetaMask)"** button.
- [ ] Route the Pinata `CID Hash` and the `Bid Amount` into a `writeContract` wagmi hook. The user confirms the transaction in MetaMask to save the bid on-chain.

### Phase 4: The ML Oracle Bridge (Backend Layer)
*(Note: Instead of paying for a decentralized Oracle like Chainlink, we are building a free **Custom First-Party Oracle** using your FastAPI Python server.)*
- [ ] Update `api.py` to include the `web3.py` library.
- [ ] Securely add the "Oracle Wallet Private Key" to the `.env` file of the backend.
- [ ] Create a webhook/listener: The FastAPI Oracle sees a new `BidSubmitted` event on the blockchain, grabs the IPFS Hash, downloads the JSON from Pinata, runs it through the ML model, and then uses `web3.py` to automatically trigger the `updateValidity(false/true)` function on the Smart Contract.

### Phase 5: The Transparency Dashboard (Presentation Layer)
- [ ] Build a public UI page called "Audit Tenders".
- [ ] The user enters a Tender ID. The page pulls the data entirely from the blockchain (zero backend database required).
- [ ] It renders a list of wallet addresses that bid, whether the AI marked them valid, and provides a clickable link to their un-editable IPFS JSON document.
