import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import deployedContractsConfig from "../../config/deployedContracts.json";
import { DeployedContracts } from "../../config/types";
import { deployOrVerifyContract } from "../utils/deployHelpers";

/**
 * Deploy AMM Core Infrastructure (Factory and Router)
 * 
 * This script deploys:
 * 1. SimpleFactory (creates pairs)
 * 2. SimpleRouter (routes swaps)
 * 
 * Features:
 * - Idempotent: Skips deployment if already exists (checks JSON + on-chain)
 * - Safe to re-run: Won't redeploy existing contracts
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🏗️  Deploying AMM Core Infrastructure...\n");
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DEV\n");

  const WETH_ADDRESS = ethers.getAddress("0xD909178CC99d318e4D46e7E66a972955859670E1".toLowerCase());

  // ============================================================================
  // Deploy Factory
  // ============================================================================
  console.log("🏭 Deploying SimpleFactory...");
  const factoryAddress = await deployOrVerifyContract(
    "SimpleFactory",
    deployedContractsConfig.amm?.factory,
    async () => {
      const SimpleFactory = await ethers.getContractFactory("SimpleFactory");
      return await SimpleFactory.deploy();
    }
  );
  console.log();

  // ============================================================================
  // Deploy Router
  // ============================================================================
  console.log("🔀 Deploying SimpleRouter...");
  const routerAddress = await deployOrVerifyContract(
    "SimpleRouter",
    deployedContractsConfig.amm?.router,
    async () => {
      const SimpleRouter = await ethers.getContractFactory("SimpleRouter");
      return await SimpleRouter.deploy(factoryAddress, WETH_ADDRESS);
    }
  );
  console.log();

  // ============================================================================
  // Update deployedContracts.json with AMM addresses
  // ============================================================================
  console.log("📝 Updating deployedContracts.json with AMM addresses...");
  const contractsPath = path.join(__dirname, "..", "..", "config", "deployedContracts.json");
  const existingPairsConfig = deployedContractsConfig as DeployedContracts;

  const updatedContracts = {
    ...existingPairsConfig,
    network: "moonbase",
    lastDeployed: new Date().toISOString(),
    amm: {
      factory: factoryAddress,
      router: routerAddress,
      weth: WETH_ADDRESS,
    },
    metadata: {
      ...existingPairsConfig.metadata,
      deployer: deployer.address,
    },
  };

  fs.writeFileSync(contractsPath, JSON.stringify(updatedContracts, null, 2) + "\n");
  console.log("✅ Updated deployedContracts.json with AMM addresses");
  console.log();

  // ============================================================================
  // Summary
  // ============================================================================
  console.log("=".repeat(60));
  console.log("📋 AMM CORE DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("SimpleFactory:      ", factoryAddress);
  console.log("SimpleRouter:        ", routerAddress);
  console.log("WETH Address:        ", WETH_ADDRESS);
  console.log("\n💾 AMM addresses saved to deployedContracts.json");
  console.log("=".repeat(60));
  console.log();
  console.log("💡 Next Steps:");
  console.log("Create pairs: npx hardhat run scripts/deploy/create-pairs.ts --network moonbase");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

