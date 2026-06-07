import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config({ path: "../.env" });

const DEPLOYER_PRIVATE_KEY =
  process.env.BLOCKCHAIN_PRIVATE_KEY ||
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Local Hardhat node (run: npm run node)
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // In-process Hardhat network (for tests)
    hardhat: {
      chainId: 31337,
    },
    // Polygon Amoy testnet
    amoy: {
      url: process.env.BLOCKCHAIN_RPC_URL_AMOY || "",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 80002,
    },
    // Ethereum Sepolia testnet — use this for Vercel (free via Infura)
    sepolia: {
      url: process.env.BLOCKCHAIN_RPC_URL_SEPOLIA || "",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
