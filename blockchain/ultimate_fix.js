const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const signers = await hre.ethers.getSigners();
    const oracle = signers[1];
    const govOfficial = signers[2];
    const contractor = signers[3]; // Account #3 (0x90F7...)

    // 1. Force a final, fresh deployment
    const TenderSystem = await hre.ethers.getContractFactory("TenderSystem");
    const contract = await TenderSystem.deploy(oracle.address, govOfficial.address);
    await contract.waitForDeployment();
    const realAddress = await contract.getAddress();
    
    // Save to file safely preventing powershell mangling
    fs.writeFileSync("REAL_ADDRESS.txt", realAddress);
    console.log("DEPLOYED TO:", realAddress);

    // 2. Force an award on this definitive contract
    const tenderId = 100;
    const bidAmount = 5000000000n;
    const stateCode = hre.ethers.encodeBytes32String("MH");
    
    await contract.connect(contractor).submitBid(tenderId, bidAmount, stateCode, 0, 0, 0, 1000, 2, 50, 100, 800, 200, 5000, 2, 5);
    await contract.connect(oracle).updateValidity(tenderId, 0, true);
    await contract.connect(govOfficial).awardContract(tenderId, 0);

    console.log("SUCCESSFULLY MINTED END-TO-END ON:", realAddress);
}

main().catch(console.error);
