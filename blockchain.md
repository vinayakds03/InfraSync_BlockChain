# Connecting MetaMask to InfrSync Smart Contracts

This guide provides detailed, step-by-step instructions on how to use MetaMask to interact with the InfrSync platform, whether you are running a completely offline local test network (Hardhat) or deploying to the live global Sepolia testnet.

## Scenario A: Testing on Localhost (Recommended for Fast Testing)

When you run `npx hardhat node` in the `blockchain/` folder, it creates a fast, completely offline blockchain on your computer and generates 20 fake accounts loaded with 10,000 ETH.

### Step 1: Add Localhost to MetaMask
1. Open your **MetaMask** browser extension.
2. Click the **Network Selector** dropdown in the top-left corner (it usually says "Ethereum Mainnet").
3. If "Localhost 8545" is not listed, click **"Add network"**.
4. Scroll down and click **"Add a network manually"**.
5. Enter the precise details below:
   - **Network Name:** Hardhat Localhost
   - **New RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
6. Click **Save** and switch to this newly created network.

### Step 2: Import Hardhat Fake Accounts
To pay for gas or submit bids locally, you must use one of the fake test accounts generated exclusively by your running Hardhat node.
1. Look at the terminal running `npx hardhat node`. You will see a list of exactly 20 Accounts (Account #0 to Account #19) and their **Private Keys**.
2. Copy the **Private Key** of `Account #0` or `Account #2`. 
   > **⚠️ CRITICAL:** Do NOT use Account #1! The Python ML Oracle (`api.py`) is currently hardcoded to securely use Account #1's private key to automatically publish ML validation AI results. If you use it manually in MetaMask, the transaction counts (nonces) will aggressively collide and crash.
3. Open **MetaMask**.
4. Click the **Account** dropdown (the circle at the top middle/right).
5. Click **"Add account or hardware wallet"** -> **"Import account"**.
6. Paste the copied Private Key into the field and click **Import**.
7. You should immediately see an unspendable **10,000 ETH** balance inside MetaMask. You are perfectly connected and ready to bid on the local Next.js frontend!


---


## Scenario B: Deploying to Google/Ethereum Sepolia Testnet

If you want to deploy the contract to the live internet so anyone across the world can interact with your frontend directly without running Hardhat, you must use the Sepolia Testnet.

### Step 1: Enable Sepolia in MetaMask
1. Open **MetaMask**.
2. Click the **Network Selector** dropdown in the top left.
3. Toggle the **"Show test networks"** switch to ON.
4. Select **"Sepolia"** natively from the list.

### Step 2: Get Free Sepolia ETH (Faucet)
You physically need real-world test ETH to pay to deploy your contract to the live testnet blockchain.
1. Visit the [Google Web3 Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Alchemy Faucet](https://sepoliafaucet.com/).
2. Copy your MetaMask Account Address (the `0x...` string displayed at the very top inside MetaMask).
3. Paste it into the Faucet website and dynamically request free Sepolia ETH. Wait roughly 10-30 seconds for the transaction to arrive in your wallet.

### Step 3: Export Your MetaMask Private Key
Hardhat securely needs your MetaMask Private Key exactly to deploy the Smart Contract natively on your behalf.
1. Open **MetaMask**.
2. Click the **Three Dots (⋮)** icon in the top right -> navigate into **Account details**.
3. Click **"Show private key"**.
4. Type in your MetaMask password to unlock it.
5. Copy the exposed Private Key string. 
   > **⚠️ MASSIVE SECURITY WARNING:** Never output or share your real Mainnet Private Key that contains actual wealth. Ensure you strictly only use a web3 development account with absolutely zero real money!

### Step 4: Configure Hardhat `.env`
1. Navigate directly to your `blockchain/` folder.
2. Duplicate the `.env.example` file and instantly rename the copy to strictly `.env`.
3. Open your newly created `.env` file and securely paste your private key:
   ```env
   SEPOLIA_URL=https://ethereum-sepolia-rpc.publicnode.com
   PRIVATE_KEY=paste_your_meta_mask_private_key_exactly_here
   ```

### Step 5: Deploy!
1. Open a new terminal specifically in the `blockchain/` folder.
2. Run the deployment sequence explicitly targeting Sepolia:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
3. Once the terminal prints `TenderSystem deployed successfully to: 0x...`, explicitly copy that entire `0x...` address!
4. **Final Step:** Swap out the old `CONTRACT_ADDRESS` found inside your system architecture:
    - Python Backend (`api.py`)
    - Transparency Hub (`web/src/app/public/page.tsx`)
    - Contractor Module (`web/src/app/contractor/page.tsx`)
    - Gov Interface (`web/src/app/gov/page.tsx`)
5. Your entire blockchain infrastructure is now live natively across the globe!
