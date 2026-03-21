const hre = require("hardhat");

async function main() {
  const TenderSystem = await hre.ethers.getContractFactory("TenderSystem");
  const contract = TenderSystem.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
  
  try {
    const filter = contract.filters.ContractAwarded();
    const events = await contract.queryFilter(filter, 0, "latest");
    
    console.log("TOTAL AWARDS FOUND:", events.length);
    events.forEach(e => {
        console.log(` - TokenID: ${e.args.certificateTokenId}, Winner: ${e.args.winningBidder}`);
    });
  } catch (err) {
    console.log("ERROR QUERYING BLOCKCHAIN:", err.message);
  }
}

main().catch(console.error);
