import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import tayebCoinsConfig from "../../config/tayebCoins.json";
import deployedContractsConfig from "../../config/deployedContracts.json";
import { TayebCoinsConfig, DeployedContracts } from "../../config/types";
import { deployOrVerifyContract } from "../utils/deployHelpers";

/**
 * Deploy Mock Tokens - Initial Tayeb Coins
 * 
 * This script deploys MockERC20 tokens for all Initial Tayeb Coins.
 * 
 * Features:
 * - Idempotent: Skips tokens already deployed (checks JSON + on-chain)
 * - Incremental saves: Saves address immediately after each token deployment
 * - Safe to re-run: Won't redeploy existing tokens
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const config = tayebCoinsConfig as TayebCoinsConfig;

  console.log("📝 Deploying Mock Tokens (Initial Tayeb Coins)...\n");
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DEV\n");
  
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const deployedTokens: { [key: string]: string } = {};
  let existingCount = 0;
  let newCount = 0;

  // Deploy all coins from config (with idempotent check)
  for (const coin of config.coins) {
    const existingAddress = coin.addresses.moonbase;
    const tokenName = `Mock ${coin.name}`;
    
    // Deploy new token using utility function
    const address = await deployOrVerifyContract(
      `${coin.symbol} (${coin.name})`,
      existingAddress,
      async () => {
        return await MockERC20.deploy(tokenName, coin.symbol, coin.decimals);
      }
    );
    
    deployedTokens[coin.symbol] = address;
    
    // Track counts (if address matches existing, it was already deployed)
    if (existingAddress && existingAddress !== null && address === existingAddress) {
      existingCount++;
    } else {
      newCount++;
    }
    
      // Save address immediately after deployment (incremental save)
      try {
        // Save to tayebCoins.json
        const configPath = path.join(__dirname, "..", "..", "config", "tayebCoins.json");
        const currentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
        currentConfig.coins = currentConfig.coins.map((c: any) => 
          c.symbol === coin.symbol 
            ? { ...c, addresses: { ...c.addresses, moonbase: address } }
            : c
        );
        currentConfig.metadata.lastUpdated = new Date().toISOString();
        fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2) + "\n");
        
        // Also save to deployedContracts.json
        const contractsPath = path.join(__dirname, "..", "..", "config", "deployedContracts.json");
        const contractsConfig = JSON.parse(fs.readFileSync(contractsPath, "utf8")) as DeployedContracts;
        if (!contractsConfig.tokens) {
          contractsConfig.tokens = {};
        }
        contractsConfig.tokens[coin.symbol] = address;
        contractsConfig.lastDeployed = new Date().toISOString();
        fs.writeFileSync(contractsPath, JSON.stringify(contractsConfig, null, 2) + "\n");
      } catch (error) {
        console.warn(`⚠️  Failed to save ${coin.symbol} address incrementally, will save at end`);
      }
  }
  
  console.log(`\n📊 Token deployment summary: ${newCount} new, ${existingCount} already deployed\n`);

  // ============================================================================
  // Final sync - safety net to ensure consistency
  // ============================================================================
  console.log("📝 Performing final sync...");
  
  // Sync tayebCoins.json
  const configPath = path.join(__dirname, "..", "..", "config", "tayebCoins.json");
  const currentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  currentConfig.metadata = {
    ...currentConfig.metadata,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2) + "\n");
  
  // Sync deployedContracts.json with all tokens
  const contractsPath = path.join(__dirname, "..", "..", "config", "deployedContracts.json");
  const contractsConfig = JSON.parse(fs.readFileSync(contractsPath, "utf8")) as DeployedContracts;
  contractsConfig.tokens = deployedTokens;
  contractsConfig.lastDeployed = new Date().toISOString();
  fs.writeFileSync(contractsPath, JSON.stringify(contractsConfig, null, 2) + "\n");
  
  console.log("✅ Final sync complete (both tayebCoins.json and deployedContracts.json)");
  console.log();

  // ============================================================================
  // Summary
  // ============================================================================
  console.log("=".repeat(60));
  console.log("📋 TOKEN DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("\n📦 Deployed Tokens:", Object.keys(deployedTokens).length);
  console.log("   - New tokens:     ", newCount);
  console.log("   - Already existed:", existingCount);
  console.log("\n💾 All token addresses saved to tayebCoins.json");
  console.log("=".repeat(60));
  console.log();
  console.log("💡 Next Steps:");
  console.log("Deploy AMM core: npx hardhat run scripts/deploy/deploy-amm-core.ts --network moonbase");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


