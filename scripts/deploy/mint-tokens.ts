import { ethers } from "hardhat";
import tayebCoinsConfig from "../../config/tayebCoins.json";
import { TayebCoinsConfig } from "../../config/types";

/**
 * Mint Initial Tokens
 * 
 * This script mints initial tokens to the deployer address for liquidity provision.
 * 
 * Features:
 * - Mints tokens for all coins in config
 * - Stablecoins get 10M tokens, others get 1M tokens
 * - Requires: Tokens must be deployed
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  const config = tayebCoinsConfig as TayebCoinsConfig;

  console.log("💰 Minting tokens to deployer for liquidity...\n");
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DEV\n");
  
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

  // Mint all tokens based on config
  for (const coin of config.coins) {
    const token = await ethers.getContractAt("MockERC20", deployedTokens[coin.symbol]);
    
    // Mint more for stablecoins (used in many pairs)
    const isStablecoin = config.stablecoins.includes(coin.symbol);
    const mintAmount = isStablecoin 
      ? ethers.parseUnits("10000000", coin.decimals) // 10M for stablecoins
      : ethers.parseUnits("1000000", coin.decimals);  // 1M for others
    
    await token.mint(deployer.address, mintAmount);
    const formattedAmount = isStablecoin ? "10M" : "1M";
    console.log(`✅ Minted ${formattedAmount} ${coin.symbol} to deployer`);
  }
  console.log();

  // ============================================================================
  // Summary
  // ============================================================================
  console.log("=".repeat(60));
  console.log("📋 MINTING SUMMARY");
  console.log("=".repeat(60));
  console.log("\n📦 Minted tokens for:", Object.keys(deployedTokens).length, "coins");
  console.log("   - Stablecoins: 10M each");
  console.log("   - Other coins: 1M each");
  console.log("   - Recipient:   ", deployer.address);
  console.log("\n💡 Next Steps:");
  console.log("Add liquidity: npx hardhat run scripts/liquidity/addLiquidity.ts --network moonbase");
  console.log("=".repeat(60));
  console.log();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

