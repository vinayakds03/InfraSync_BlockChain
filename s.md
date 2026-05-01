# InfrSync: Complete Execution Guide

Follow these steps EXACTLY in order every time you want to run the platform locally or after you restart your computer.

## Phase 1: Start the Engines
You need separate terminal windows running simultaneously.

### Terminal 1: The Blockchain Node (Localhost)
```bash
cd blockchain
npx hardhat node
```
*(Leave this terminal running forever. If you close it, the blockchain is completely wiped and you must start over from Phase 1).*

### Terminal 2: Deploy the Smart Contract
*Wait for Terminal 1 to be fully running before doing this.*
```bash
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```
*(⚠️ **CRITICAL:** Every time you restart Terminal 1, you MUST run this command to re-deploy the contract back onto the fresh blockchain!)*

### Terminal 3: Start the Python ML Oracle & API
```bash
uvicorn api:app --reload --host 0.0.0.0 --port 8000
```
*(⚠️ **CRITICAL:** If you ever restart Terminal 1, you MUST also restart Terminal 3 so it clears its old memory of dead bids from the previous session).*

### Terminal 4: Start the React Web App
```bash
cd web
npm run dev
```
*(The website will be available at `http://localhost:3000`)*

---

## Phase 2: Reset MetaMask (The Golden Rule)
Whenever you restart your local Hardhat node (Terminal 1), MetaMask's internal history gets corrupted because the blockchain went back in time to Block 0. If you do not clear the history, all your transactions will silently fail!

1. Open your **MetaMask Extension**.
2. Switch to your **Contractor Wallet** (e.g. Account 3 or whichever account you use as Contractor).
3. Click the three dots `⋮` > **Settings > Advanced > Clear activity tab data** (or "Clear activity and nonce data").
4. Switch to your **Government Official Wallet** (e.g. Account 2) and do the exact same thing to clear it.

---

## Phase 3: The Complete Full-Lifecycle Flow

1. **Release the Tender:**
   - Go to `http://localhost:3000/gov`.
   - Formally connect MetaMask using the **Government Official Wallet** (Account #2).
   - Fill out the form and click **Publish Contract**.

2. **Submit a Realistic Bid:**
   - Go to `http://localhost:3000/contractor`.
   - Switch your MetaMask extension to the **Contractor Wallet** (Account #3).
   - Click "Prepare Bid" on the new tender, fill the form, and click **Submit Bid**.
   - MetaMask will pop up. Click **Confirm**. Wait for the success alert! *(If MetaMask doesn't pop up, you forgot Phase 2).*

3. **AI Evaluation & Blockchain Awarding:**
   - Go back to `http://localhost:3000/gov`.
   - Switch your MetaMask extension back to the **Government Official Wallet** (Account #2).
   - Click **Evaluate & Award**. The Python AI ML model will automatically evaluate it and push the verdict to the chain.
   - Click **Award on Blockchain**. MetaMask will pop up. Click **Confirm**.

4. **View your Reputational NFT Certificate:**
   - Go to `http://localhost:3000/contractor/profile`.
   - Switch MetaMask back to the **Contractor Wallet**.
   - Your permanent, beautiful Holographic Soulbound Certificate will instantly load and render directly from the blockchain!



-- milestone completion 
The underlying smart contract logic still correctly pays out the 30/30/40 splits for each individual milestone, but the UI now reflects the overall project progress exactly like you asked! Refresh your page to see the updated labels.