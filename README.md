# InfrSync — Blockchain-Backed Road Tender Platform

InfrSync is a full-stack platform for **government road infrastructure tenders**. Contractors submit engineering bids, an **XGBoost** model estimates fair project cost, a **Python oracle** records ML validation on Ethereum, and the government awards contracts with **verifiable soulbound NFT certificates**. A public transparency dashboard lets anyone audit on-chain bid status.

---

## Features

- **Government portal** — Create tenders, run ML evaluation, award contracts on-chain
- **Contractor portal** — Submit bids (API + MetaMask), view soulbound award certificates
- **Public transparency hub** — Read bid amounts and validation status from the blockchain
- **ML cost prediction** — 18 engineering features → predicted total project cost (INR)
- **Automated bid validation** — Accept bids between **97% and 100%** of predicted cost
- **Custom oracle** — Backend signs `updateValidity` on the smart contract after evaluation
- **Gas-optimized contract** — Minimal on-chain storage; engineering params in `BidSubmitted` events
- **Soulbound ERC-721 certificates** — Non-transferable proof of contract award

---

## Architecture

```
┌─────────────────┐     REST (8000)      ┌──────────────────┐
│  Next.js Web    │ ◄──────────────────► │  FastAPI + ML    │
│  (port 3000)    │                      │  (api.py)        │
└────────┬────────┘                      └────────┬─────────┘
         │ MetaMask / wagmi                         │ Web3.py
         ▼                                          ▼
┌─────────────────────────────────────────────────────────────┐
│           TenderSystem.sol  (Hardhat / Sepolia)             │
└─────────────────────────────────────────────────────────────┘
```

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, wagmi, viem |
| Backend | FastAPI, Uvicorn, Pydantic, Web3.py |
| ML | XGBoost, scikit-learn, pandas (`roadDataset.py`) |
| Blockchain | Solidity 0.8.24, Hardhat 2, OpenZeppelin ERC721 |

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Python** 3.10+
- **MetaMask** browser extension
- Python packages: `fastapi`, `uvicorn`, `pandas`, `xgboost`, `scikit-learn`, `joblib`, `web3`
- Trained model artifacts: `road_model.xgb`, `encoders.joblib` (generate via `roadDataset.py` if missing)

---

## Project structure

```
InfraSync_BlockChain/
├── api.py                          # FastAPI server + ML oracle
├── roadDataset.py                  # XGBoost training & prediction
├── road_model.xgb                    # Trained model (after training)
├── encoders.joblib                   # Label encoders (after training)
├── indian_road_tender_dataset_*.csv  # Training dataset
├── blockchain/
│   ├── contracts/TenderSystem.sol  # Smart contract
│   ├── scripts/deploy.js           # Deploy script
│   ├── test/TenderSystem.js        # Hardhat tests
│   └── hardhat.config.js
├── web/                            # Next.js frontend
│   └── src/app/
│       ├── gov/                    # Government dashboard
│       ├── contractor/             # Bid submission
│       ├── contractor/profile/     # NFT certificates
│       └── public/                 # Transparency hub
├── s.md                            # Local run guide (detailed)
├── blockchain.md                   # MetaMask & network setup
└── finDraft.md                     # Architecture blueprint
```

---

## Quick start (local development)

Run **four terminals** in this order.

### 1. Blockchain node

```bash
cd blockchain
npm install
npx hardhat node
```

Leave running. Restarting wipes chain state — redeploy and reset MetaMask (see below).

### 2. Deploy contract

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

Default local address: `0x5FbDB2315678afecb367f032d93F642f64180aa3`  
Update this in `api.py` and all `web/src/app/**` files if deploy prints a different address.

### 3. Backend API + ML oracle

From project root:

```bash
pip install fastapi uvicorn pandas xgboost scikit-learn joblib web3 pydantic matplotlib
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### 4. Frontend

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:3000**

---

## MetaMask (local Hardhat)

| Setting | Value |
|---------|--------|
| Network name | Hardhat Localhost |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Symbol | ETH |

**Wallet roles (Hardhat default accounts):**

| Account | Role | Usage |
|---------|------|--------|
| #0 | Deployer | Contract deployment only |
| #1 | ML Oracle | Used by `api.py` — **do not import into MetaMask** |
| #2 | Government | `/gov` — evaluate & award |
| #3+ | Contractor | `/contractor` — submit bids |

After restarting `hardhat node`, clear MetaMask **activity/nonce data** for gov and contractor wallets.  
See [blockchain.md](./blockchain.md) for full MetaMask and Sepolia instructions.

---

## Typical workflow

1. **Gov** → `http://localhost:3000/gov` → create tender
2. **Contractor** → `http://localhost:3000/contractor` → submit bid (API + MetaMask `submitBid`)
3. **Gov** → **Evaluate & Award** → ML runs, oracle writes `isMlValid` on-chain
4. **Gov** → **Award on Blockchain** → `awardContract` mints soulbound NFT
5. **Contractor** → `http://localhost:3000/contractor/profile` → view certificate
6. **Public** → `http://localhost:3000/public` → audit bids by tender ID

---

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tenders` | List tenders |
| `POST` | `/api/tenders` | Create tender |
| `POST` | `/api/tenders/{id}/bids` | Submit bid (full engineering form) |
| `GET` | `/api/tenders/{id}/bids` | List bids (limited fields) |
| `POST` | `/api/tenders/{id}/evaluate` | ML evaluation + oracle `updateValidity` |

Interactive docs: **http://localhost:8000/docs**

---

## Machine learning

- **Model:** XGBoost regressor (`road_model.xgb`)
- **Target:** `Total_Project_Cost_INR`
- **Features:** 18 inputs (state, road type, terrain, dimensions, labor, earthwork, etc.)
- **Training:** `python roadDataset.py` (uses `indian_road_tender_dataset_1000_records_v4_final.csv`)
- **Validation rule:** `0.97 × predicted ≤ bid_amount ≤ predicted` → valid

Outputs: `top_15_features.png`, `accuracy_graph.png`

---

## Smart contract (`TenderSystem.sol`)

| Function | Caller | Purpose |
|----------|--------|---------|
| `submitBid` | Contractor | Register bid on-chain |
| `updateValidity` | Oracle only | Set ML valid/invalid flag |
| `awardContract` | Gov official only | Award winner; mint soulbound NFT |
| `getBidDetails` | Anyone (view) | Read bid state |

---

## Testing

```bash
cd blockchain
npm install
npx hardhat test
```

---

## Deploy to Sepolia (optional)

1. Copy `blockchain/.env.example` → `blockchain/.env` with `SEPOLIA_URL` and `PRIVATE_KEY`
2. `npx hardhat run scripts/deploy.js --network sepolia`
3. Update contract address in `api.py` and frontend pages

---

## Known limitations

- Tender/bid data stored **in memory** (lost on API restart)
- Oracle private key is **hardcoded** for local demo — not production-safe
- Evaluation is triggered manually from the gov UI (no on-chain event webhook)
- On-chain `bidIndex` must match backend bid order during evaluation

---

## Documentation

| File | Contents |
|------|----------|
| [s.md](./s.md) | Step-by-step local execution |
| [blockchain.md](./blockchain.md) | MetaMask local & Sepolia setup |
| [finDraft.md](./finDraft.md) | System architecture & design goals |
| [gasss.md](./gasss.md) | Hybrid on-chain / off-chain gas strategy |

---

## License

See repository license. Smart contracts use SPDX `MIT` in `TenderSystem.sol`.

---

## Contributors

Developed as a blockchain + ML infrastructure tender transparency project.  
Repository: [InfraSync_BlockChain](https://github.com/vinayakds03/InfraSync_BlockChain)
