const hre = require("hardhat");

async function main() {
  const TenderSystem = await hre.ethers.getContractFactory("TenderSystem");
  const contract = TenderSystem.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  
  try {
    console.log("--- CHECKING BIDS ON SMART CONTRACT ---");
    for(let i=1; i<=3; i++) {
        const count = await contract.getBidsCount(i);
        console.log(`Tender ID ${i} has EXACTLY ${count} bids stored.`);
    }
  } catch (err) {
    console.log("ERROR QUERYING BLOCKCHAIN:", err.message);
  }
}

main().catch(console.error);
