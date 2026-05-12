import hre from "hardhat";

// Main deployment script for the ChipVault smart contract.
async function main() {
  // Retrieve the contract factory for ChipVault
  const ChipVault = await hre.ethers.getContractFactory("ChipVault");
  
  // Deploy the contract to the blockchain
  const chipVault = await ChipVault.deploy();

  // Wait for the deployment transaction to be confirmed (Ethers v6 syntax)
  await chipVault.waitForDeployment();

  // Get the deployed contract address (Ethers v6 syntax)
  const address = await chipVault.getAddress();

  // Log the deployed contract address for use in the frontend and backend
  console.log("ChipVault deployed to:", address);
}

// Execute the main deployment function and handle any process errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });