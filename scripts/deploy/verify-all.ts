import { run } from "hardhat";
import hre from "hardhat";
import halaCoinsConfig from "../../config/halaCoins.json";
import deployedContractsConfig from "../../config/deployedContracts.json";
import chainConfig from "../../config/chainConfig.json";
import { HalaCoinsConfig, DeployedContracts } from "../../config/types";

/**
 * Verify all deployed contracts on Moonbase Alpha
 * 
 * This script verifies:
 * 1. All MockERC20 tokens
 * 2. AMM contracts (Factory, Router)
 * 3. Main contracts (ShariaCompliance, ShariaSwap, ShariaDCA)
 * 4. All liquidity pairs
 * 
 * Requires ETHERSCAN_API_KEY to be set in .env file.
 * Checks verification status before attempting to avoid unnecessary API calls.
 */
async function main() {
  const config = halaCoinsConfig as HalaCoinsConfig;
  const contractsConfig = deployedContractsConfig as DeployedContracts;

  console.log("🔍 Verifying all contracts on Moonbase Alpha...\n");

  if (!process.env.ETHERSCAN_API_KEY) {
    console.error("❌ Error: ETHERSCAN_API_KEY not found in environment variables!");
    console.log("\n📝 Please add ETHERSCAN_API_KEY to your .env file:");
    console.log("   Get API key from: https://moonscan.io/myapikey\n");
    process.exit(1);
  }

  // Compile contracts first to ensure artifacts are up to date
  console.log("🔨 Compiling contracts...");
  try {
    await run("compile");
    console.log("✅ Compilation complete\n");
  } catch (error) {
    console.error("⚠️  Compilation failed, but continuing with verification...");
    console.error("   Error:", error);
    console.log();
  }

  const results = {
    tokens: { verified: 0, failed: 0 },
    amm: { verified: 0, failed: 0 },
    main: { verified: 0, failed: 0 },
    pairs: { verified: 0, failed: 0 },
  };

  const failed: Array<{ type: string; name: string; address: string; error: string }> = [];

  // Helper to verify a contract
  async function verifyContract(
    type: string,
    name: string,
    address: string | null,
    constructorArgs: any[],
    contractName: string
  ) {
    if (!address || address === "null" || address === null) {
      console.log(`⏭️  ${name} - No address found, skipping`);
      return "failed";
    }

    console.log(`\n🔍 Verifying ${name}...`);
    console.log(`   Address: ${address}`);
    if (constructorArgs.length > 0) {
      console.log(`   Constructor args: ${JSON.stringify(constructorArgs)}`);
    }

    try {
      await run("verify:verify", {
        address: address,
        constructorArguments: constructorArgs.length > 0 ? constructorArgs : undefined,
        network: "moonbase",
      });
      console.log(`✅ ${name} verified successfully!`);
      return "verified";
    } catch (error: any) {
      // Extract error message from various possible error formats
      const errorMessage = error.message || error.reason || String(error);
      const errorString = String(error).toLowerCase();

      // If already verified, treat as verified (success)
      if (
        errorMessage.includes("Already Verified") ||
        errorMessage.includes("already verified") ||
        errorMessage.includes("Contract source code already verified") ||
        errorString.includes("has already been verified") ||
        errorString.includes("already verified on the block explorer") ||
        errorString.includes("contract already verified")
      ) {
        console.log(`✅ ${name} verified (already verified)`);
        return "verified";
      } else {
        console.error(`❌ Failed to verify ${name}:`, errorMessage);
        failed.push({
          type,
          name,
          address,
          error: errorMessage,
        });
        return "failed";
      }
    }
  }

  // ============================================================================
  // Verify Tokens
  // ============================================================================
  console.log("=".repeat(60));
  console.log("📦 VERIFYING TOKENS");
  console.log("=".repeat(60));

  const tokens = contractsConfig.tokens || {};
  const tokensToVerify = Object.keys(tokens).length > 0 
    ? Object.entries(tokens).map(([symbol, address]) => ({
        symbol,
        address: address!,
        coin: config.coins.find((c) => c.symbol === symbol),
      }))
    : config.coins
        .filter((coin) => coin.addresses.moonbase && coin.addresses.moonbase !== "null")
        .map((coin) => ({
          symbol: coin.symbol,
          address: coin.addresses.moonbase!,
          coin,
        }));

  for (const { symbol, address, coin } of tokensToVerify) {
    if (!coin) {
      console.warn(`⚠️  Coin ${symbol} not found in config, skipping`);
      continue;
    }

    const tokenName = `Mock ${coin.name}`;
    const constructorArgs = [tokenName, coin.symbol, coin.decimals];
    const result = await verifyContract("tokens", `${symbol} (${coin.name})`, address, constructorArgs, "MockERC20");
    
    if (result === "verified") results.tokens.verified++;
    else results.tokens.failed++;

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // ============================================================================
  // Verify AMM Contracts
  // ============================================================================
  console.log("\n" + "=".repeat(60));
  console.log("🏭 VERIFYING AMM CONTRACTS");
  console.log("=".repeat(60));

  // SimpleFactory (no constructor args)
  const factoryAddress = contractsConfig.amm?.factory;
  if (factoryAddress) {
    const result = await verifyContract("amm", "SimpleFactory", factoryAddress, [], "SimpleFactory");
    if (result === "verified") results.amm.verified++;
    else results.amm.failed++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // SimpleRouter (factory, weth)
  const routerAddress = contractsConfig.amm?.router;
  const wethAddress = contractsConfig.amm?.weth;
  if (routerAddress && factoryAddress && wethAddress) {
    const routerArgs = [factoryAddress, wethAddress];
    const result = await verifyContract("amm", "SimpleRouter", routerAddress, routerArgs, "SimpleRouter");
    if (result === "verified") results.amm.verified++;
    else results.amm.failed++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // ============================================================================
  // Verify Main Contracts
  // ============================================================================
  console.log("\n" + "=".repeat(60));
  console.log("🏛️  VERIFYING MAIN CONTRACTS");
  console.log("=".repeat(60));

  // ShariaCompliance (no constructor args)
  const shariaComplianceAddress = contractsConfig.main?.shariaCompliance;
  if (shariaComplianceAddress) {
    const result = await verifyContract("main", "ShariaCompliance", shariaComplianceAddress, [], "ShariaCompliance");
    if (result === "verified") results.main.verified++;
    else results.main.failed++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // ShariaSwap (shariaCompliance, router, weth, factory)
  const shariaSwapAddress = contractsConfig.main?.shariaSwap;
  if (shariaSwapAddress && shariaComplianceAddress && routerAddress && wethAddress && factoryAddress) {
    const swapArgs = [shariaComplianceAddress, routerAddress, wethAddress, factoryAddress];
    const result = await verifyContract("main", "ShariaSwap", shariaSwapAddress, swapArgs, "ShariaSwap");
    if (result === "verified") results.main.verified++;
    else results.main.failed++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // ShariaDCA (shariaCompliance, router, factory, weth, blockTime, blocksBeforeHour)
  const shariaDCAAddress = contractsConfig.main?.shariaDCA;
  if (shariaDCAAddress && shariaComplianceAddress && routerAddress && factoryAddress && wethAddress) {
    // Get block time configuration from chainConfig.json
    const networkName = hre.network.name;
    const networkConfig = (chainConfig as any)[networkName];
    const BLOCK_TIME = networkConfig?.blockTime || 6; // Default to 6 if not found
    const BLOCKS_BEFORE_HOUR = networkConfig?.blocksBeforeHour || 2; // Default to 2 if not found
    const dcaArgs = [shariaComplianceAddress, routerAddress, factoryAddress, wethAddress, BLOCK_TIME, BLOCKS_BEFORE_HOUR];
    const result = await verifyContract("main", "ShariaDCA", shariaDCAAddress, dcaArgs, "ShariaDCA");
    if (result === "verified") results.main.verified++;
    else results.main.failed++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // ============================================================================
  // Verify Pairs
  // ============================================================================
  console.log("\n" + "=".repeat(60));
  console.log("🔗 VERIFYING LIQUIDITY PAIRS");
  console.log("=".repeat(60));

  const pairs = contractsConfig.pairs || {};
  const pairEntries = Object.entries(pairs).filter(([_, address]) => address && address !== "null");

  console.log(`Found ${pairEntries.length} pairs to verify\n`);

  for (const [pairKey, pairAddress] of pairEntries) {
    // Pairs are created by factory and have no constructor args (SimplePair constructor is empty)
    const result = await verifyContract("pairs", pairKey, pairAddress as string, [], "SimplePair");
    if (result === "verified") results.pairs.verified++;
    else results.pairs.failed++;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log("\n" + "=".repeat(60));
  console.log("📋 VERIFICATION SUMMARY");
  console.log("=".repeat(60));

  const totalVerified =
    results.tokens.verified + results.amm.verified + results.main.verified + results.pairs.verified;
  const totalFailed =
    results.tokens.failed + results.amm.failed + results.main.failed + results.pairs.failed;

  console.log("\n📦 Tokens:");
  console.log(`   ✅ Verified: ${results.tokens.verified}`);
  console.log(`   ❌ Failed: ${results.tokens.failed}`);

  console.log("\n🏭 AMM Contracts:");
  console.log(`   ✅ Verified: ${results.amm.verified}`);
  console.log(`   ❌ Failed: ${results.amm.failed}`);

  console.log("\n🏛️  Main Contracts:");
  console.log(`   ✅ Verified: ${results.main.verified}`);
  console.log(`   ❌ Failed: ${results.main.failed}`);

  console.log("\n🔗 Pairs:");
  console.log(`   ✅ Verified: ${results.pairs.verified}`);
  console.log(`   ❌ Failed: ${results.pairs.failed}`);

  console.log("\n" + "=".repeat(60));
  console.log("📊 TOTALS");
  console.log("=".repeat(60));
  console.log(`✅ Verified: ${totalVerified}`);
  console.log(`❌ Failed: ${totalFailed}`);

  if (failed.length > 0) {
    console.log("\n⚠️  Failed verifications:");
    failed.forEach((item) => {
      console.log(`   - [${item.type}] ${item.name} (${item.address})`);
      console.log(`     Error: ${item.error}`);
    });
  }

  console.log("\n💡 View verified contracts on Moonscan:");
  console.log("   https://moonbase.moonscan.io");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

