import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import tayebCoinsConfig from "../../config/tayebCoins.json";
import deployedContractsConfig from "../../config/deployedContracts.json";
import { TayebCoinsConfig, getNonStablecoins, DeployedContracts } from "../../config/types";
import { createOrVerifyPair } from "../utils/deployHelpers";

/**
 * Create Liquidity Pairs
 * 
 * This script creates liquidity pairs for all non-stablecoins against USDC.
 * 
 * Features:
 * - Idempotent: Skips pairs already created (checks JSON + on-chain)
 * - Safe to re-run: Won't recreate existing pairs
 * - Requires: Tokens must be deployed and Factory must be deployed
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const config = tayebCoinsConfig as TayebCoinsConfig;

  console.log("🔗 Creating liquidity pairs...\n");
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DEV\n");

  // Load deployed contracts
  const existingPairsConfig = deployedContractsConfig as DeployedContracts;
  const existingPairs = existingPairsConfig.pairs || {};
  const factoryAddress = existingPairsConfig.amm?.factory;

  if (!factoryAddress || factoryAddress === "null") {
    console.error("❌ Factory not found. Please run deploy-amm-core.ts first.");
    process.exit(1);
  }

  const factory = await ethers.getContractAt("SimpleFactory", factoryAddress);

  // Get all deployed token addresses from tayebCoins.json
  const deployedTokens: { [key: string]: string } = {};
  for (const coin of config.coins) {
    const address = coin.addresses.moonbase;
    if (address && address !== "null") {
      deployedTokens[coin.symbol] = address;
    } else {
      console.error(`❌ Token ${coin.symbol} not deployed. Please run deploy-tokens.ts first.`);
      process.exit(1);
    }
  }

  // Get stablecoin addresses
  const mockUSDC = deployedTokens["USDC"];

  if (!mockUSDC) {
    console.error("❌ USDC not found. Please ensure tokens are deployed.");
    process.exit(1);
  }

  // Create pairs for each non-stablecoin with USDC only
  const nonStablecoins = getNonStablecoins(config);
  const pairs: { [key: string]: string } = {};
  let existingPairsCount = 0;
  let newPairsCount = 0;
  
  const contractsPath = path.join(__dirname, "..", "..", "config", "deployedContracts.json");
  
  // Helper to create a pair and track counts
  async function createPairAndTrack(
    tokenASymbol: string,
    tokenBSymbol: string,
    tokenAAddress: string,
    tokenBAddress: string
  ) {
    // Use the original order for the pair key to match config
    const pairKey = `${tokenASymbol}_${tokenBSymbol}`;
    const existingPairAddress = existingPairs[pairKey];
    
    try {
      const pairAddress = await createOrVerifyPair(
        `${tokenASymbol}/${tokenBSymbol}`,
        existingPairAddress,
        factory,
        tokenAAddress,
        tokenBAddress
      );
      pairs[pairKey] = pairAddress;
      
      // Track counts (if address matches existing, it was already created)
      if (existingPairAddress && existingPairAddress !== null && existingPairAddress !== "null" && pairAddress === existingPairAddress) {
        existingPairsCount++;
      } else {
        newPairsCount++;
      }
      
      // Save address immediately after creation (incremental save)
      try {
        const currentConfig = JSON.parse(fs.readFileSync(contractsPath, "utf8"));
        const updatedPairs = {
          ...(currentConfig.pairs || {}),
          [pairKey]: pairAddress,
        };
        
        currentConfig.pairs = updatedPairs;
        currentConfig.lastDeployed = new Date().toISOString();
        currentConfig.metadata = {
          ...currentConfig.metadata,
          deployer: deployer.address,
        };
        
        fs.writeFileSync(contractsPath, JSON.stringify(currentConfig, null, 2) + "\n");
        // Update existingPairs to reflect the new pair for subsequent iterations
        existingPairs[pairKey] = pairAddress;
      } catch (error) {
        console.warn(`⚠️  Failed to save ${pairKey} address incrementally, will save at end`);
      }
    } catch (error) {
      console.error(`❌ Failed to create ${tokenASymbol}/${tokenBSymbol} pair:`, error);
    }
  }
  
  // First, create USDC/USDT pair (stablecoin pair)
  const mockUSDT = deployedTokens["USDT"];
  if (mockUSDT) {
    await createPairAndTrack("USDC", "USDT", mockUSDC, mockUSDT);
  }
  
  // Then create pairs for each non-stablecoin with USDC
  for (const coin of nonStablecoins) {
    const tokenAddress = deployedTokens[coin.symbol];
    
    // Create pairs with USDC only
    await createPairAndTrack(coin.symbol, "USDC", tokenAddress, mockUSDC);
  }
  
  console.log(`\n📊 Pair creation summary: ${newPairsCount} new, ${existingPairsCount} already existed\n`);

  // ============================================================================
  // Final sync - safety net to ensure consistency
  // ============================================================================
  console.log("📝 Performing final sync...");
  const currentConfig = JSON.parse(fs.readFileSync(contractsPath, "utf8"));

  // Only update metadata (addresses should already be saved incrementally)
  currentConfig.metadata = {
    ...currentConfig.metadata,
    deployer: deployer.address,
  };
  currentConfig.lastDeployed = new Date().toISOString();

  fs.writeFileSync(contractsPath, JSON.stringify(currentConfig, null, 2) + "\n");
  console.log("✅ Final sync complete");
  console.log();

  // ============================================================================
  // Summary
  // ============================================================================
  // Merge existing pairs with new ones for summary
  const allPairs = {
    ...existingPairs,
    ...pairs,
  };

  console.log("=".repeat(60));
  console.log("📋 PAIR CREATION SUMMARY");
  console.log("=".repeat(60));
  console.log("🔗 Total Pairs:     ", Object.keys(allPairs).length);
  console.log("   - New pairs:     ", newPairsCount);
  console.log("   - Existing:      ", existingPairsCount);
  console.log("\n💾 All pair addresses saved to deployedContracts.json");
  console.log("=".repeat(60));
  console.log();
  console.log("💡 Next Steps:");
  console.log("Mint tokens: npx hardhat run scripts/deploy/mint-tokens.ts --network moonbase");
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });


