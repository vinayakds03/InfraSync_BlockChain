# InfrSync - Quick Start Guide

Welcome to the InfrSync platform repository. This system utilizes a Next.js (React) frontend, a Python FastAPI backend acting as an ML Oracle, and an Ethereum Smart Contract deployed natively via Hardhat.

If you have just cloned this repository from GitHub, please follow the steps exactly below to configure and run the entire environment locally.

## Prerequisites
- **Node.js**: v18+ 
- **Python**: 3.9+
- **MetaMask**: Browser extension installed

---

## 1. Blockchain Environment (Hardhat)
The smart contracts store the bid details entirely on-chain utilizing supreme gas-optimization.

### Installation
```bash
cd blockchain
npm install
```

### Running the Local Blockchain
Start a local Hardhat node. This will instantly generate 20 test accounts with 10k fake ETH.
```bash
npx hardhat node
```
*Note: Keep this terminal window open. In your MetaMask, configure a new Localhost network (`http://127.0.0.1:8545`) and import one of the fake private keys generated in the terminal so you can interact with the app seamlessly.*

### Deploying the Smart Contract
Open a *new* terminal window while the node runs:
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
👉 *Copy the deployed contract address and ensure it strictly matches the `CONTRACT_ADDRESS` found in `api.py` and `web/src/app/contractor/page.tsx`.*

---

## 2. Python Backend (ML Oracle & API Bridge)
The backend receives validated bids and computationally determines their realistic material cost natively using XGBoost, then securely signs the algorithmic verification perfectly back onto the blockchain using `web3.py`.

### Installation
Open a terminal in the root directory:
```bash
pip install fastapi uvicorn pandas xgboost scikit-learn web3 pydantic
```

### Running the Oracle Server
Ensure your Hardhat node is running first (so `web3.py` can bridge with it).
```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```
*Your ML Oracle validator is now listening actively on port 8000.*

---

## 3. React Frontend (Next.js & Web3 Wagmi)
This allows both the Government Officials and the Contractors to login cleanly using MetaMask to interact with the platform natively.

### Installation
```bash
cd web
npm install
```

### Running the Web Server
```bash
npm run dev
```

You can now visit exactly: `http://localhost:3000` to interact with InfrSync!
