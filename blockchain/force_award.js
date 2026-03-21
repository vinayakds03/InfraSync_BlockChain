const hre = require("hardhat");

async function main() {
    console.log("Starting forced E2E Award Flow...");
    const signers = await hre.ethers.getSigners();
    const oracle = signers[1];
    const govOfficial = signers[2];
    const contractor = signers[3]; // Account #3 (0x90F7...)

    let contractAddr = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const TenderSystem = await hre.ethers.getContractFactory("TenderSystem");
    let contract = TenderSystem.attach(contractAddr);

    const code = await hre.ethers.provider.getCode(contractAddr);
    if (code === "0x") {
        console.log("Contract NOT FOUND at 0xe7f1...! Deploying it for you right now...");
        contract = await TenderSystem.deploy(oracle.address, govOfficial.address);
        await contract.waitForDeployment();
        contractAddr = await contract.getAddress();
        console.log("Deployed New Contract to:", contractAddr);
    } else {
        console.log("Contract successfully found at:", contractAddr);
    }

    const tenderId = 999;
    const bidAmount = 5000000000n; // 5 gwei / random number that fits uint96

    console.log(`\nSubmitting bid as Contractor: ${contractor.address}`);
    const stateCode = hre.ethers.encodeBytes32String("MH");
    const tx1 = await contract.connect(contractor).submitBid(
        tenderId, bidAmount, stateCode, 0, 0, 0, 1000, 2, 50, 100, 800, 200, 5000, 2, 5
    );
    await tx1.wait();

    console.log("Oracle dynamically validating bid...");
    const tx2 = await contract.connect(oracle).updateValidity(tenderId, 0, true);
    await tx2.wait();

    console.log("Gov Official securely awarding contract to Contractor...");
    const tx3 = await contract.connect(govOfficial).awardContract(tenderId, 0);
    const receipt = await tx3.wait();
    
    const filter = contract.filters.ContractAwarded();
    const events = await contract.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
    
    if (events.length > 0) {
        console.log(`\n🎉 NATIVE BLOCKCHAIN AWARD SUCCESS!`);
        console.log(`Certificate Awarded to ${events[0].args.winningBidder}`);
        console.log(`Token ID: ${events[0].args.certificateTokenId}`);
        console.log(`\n👉 PLEASE REFRESH YOUR BROWSER NOW!`);
    } else {
        console.log("FAILED to emit ContractAwarded event.");
    }
}

main().catch(console.error);
