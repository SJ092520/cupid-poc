const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  const Registry = await hre.ethers.getContractFactory("CupidIDRegistry");
  const registry = await Registry.deploy();
  await registry.deployed();
  console.log("Registry deployed to:", registry.address);

  const Payment = await hre.ethers.getContractFactory("CupidPayment");
  const payment = await Payment.deploy(registry.address);
  await payment.deployed();
  console.log("Payment deployed to:", payment.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});