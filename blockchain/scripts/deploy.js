const hre = require("hardhat");

async function main() {
  const [deployer, oracle, govOfficial] = await hre.ethers.getSigners();

  console.log("Deploying TenderSystem...");
  console.log("  Deployer:    ", deployer.address);
  console.log("  Oracle:      ", oracle.address);
  console.log("  Gov Official:", govOfficial.address);

  const TenderSystem = await hre.ethers.getContractFactory("TenderSystem");
  const instance = await TenderSystem.deploy(oracle.address, govOfficial.address);
  await instance.waitForDeployment();

  const address = await instance.getAddress();
  console.log("\n🎉 TenderSystem deployed to:", address);
  console.log("\n📋 Update CONTRACT_ADDRESS in:");
  console.log("   - api.py");
  console.log("   - web/src/app/contractor/page.tsx");
  console.log("   - web/src/app/gov/page.tsx");
  console.log("   - web/src/app/public/page.tsx");
  console.log("   - web/src/app/contractor/profile/page.tsx");
  console.log("\n🔐 Oracle Private Key (Hardhat Account #1):");
  console.log("   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
  console.log("\n🏛️ Gov Official Wallet (Hardhat Account #2):", govOfficial.address);
  console.log("   Use this wallet in MetaMask when logging in as Government Official!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
