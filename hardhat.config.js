require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

// helper to ensure private keys are passed with a 0x prefix
function pk(key) {
  const v = process.env[key];
  if (!v) return [];
  return [v.startsWith("0x") ? v : `0x${v}`];
}

module.exports = {
  solidity: "0.8.20",
  networks: {
    amoy: {
      url: process.env.POLYGON_RPC,
      accounts: pk("POLYGON_PRIVATE_KEY"),
      chainId: 375
    },
    sepolia: {
      url: process.env.ETH_RPC,
      // the .env in this repo uses ETH_PRIVATE_KEY -> use that name
      accounts: pk("ETH_PRIVATE_KEY")
    }
  }
};