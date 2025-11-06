import { ethers } from "hardhat";

/**
 * Remove liquidity from AMM pairs
 * Usage: npx hardhat run scripts/removeLiquidity.ts --network moonbase
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("💧 Removing Liquidity from AMM Pairs\n");
  console.log("Account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "DEV\n");

  // ============================================================================
  // CONFIGURATION - Update these addresses
  // ============================================================================
  
  const ROUTER_ADDRESS = "YOUR_ROUTER_ADDRESS";
  const FACTORY_ADDRESS = "YOUR_FACTORY_ADDRESS";
  const TOKEN_A = "YOUR_TOKEN_A_ADDRESS"; // e.g., WETH
  const TOKEN_B = "YOUR_TOKEN_B_ADDRESS"; // e.g., USDC
  
  // Check if addresses are configured
  if (ROUTER_ADDRESS === "YOUR_ROUTER_ADDRESS") {
    console.error("❌ Error: Please update the contract addresses in this script first!");
    console.log("\n📝 Required addresses:");
    console.log("   - ROUTER_ADDRESS: SimpleRouter address");
    console.log("   - FACTORY_ADDRESS: SimpleFactory address");
    console.log("   - TOKEN_A: First token address (e.g., WETH)");
    console.log("   - TOKEN_B: Second token address (e.g., USDC)");
    return;
  }

  // Liquidity amount to remove (as a percentage of your LP balance)
  const PERCENTAGE_TO_REMOVE = 100; // Remove 100% of liquidity

  const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

  // ============================================================================
  // GET CONTRACT INSTANCES
  // ============================================================================
  
  const router = await ethers.getContractAt("SimpleRouter", ROUTER_ADDRESS);
  const factory = await ethers.getContractAt("SimpleFactory", FACTORY_ADDRESS);
  
  // Get pair address
  const pairAddress = await factory.getPair(TOKEN_A, TOKEN_B);
  if (pairAddress === ethers.ZeroAddress) {
    console.error("❌ Error: Pair does not exist");
    return;
  }

  const pair = await ethers.getContractAt("SimplePair", pairAddress);
  
  console.log("Router:", ROUTER_ADDRESS);
  console.log("Factory:", FACTORY_ADDRESS);
  console.log("Pair:", pairAddress);
  console.log("Token A:", TOKEN_A);
  console.log("Token B:", TOKEN_B);
  console.log();

  // ============================================================================
  // CHECK LP BALANCE
  // ============================================================================
  
  const lpBalance = await pair.balanceOf(deployer.address);
  console.log("Your LP tokens:", ethers.formatEther(lpBalance));
  
  if (lpBalance === 0n) {
    console.log("❌ No LP tokens to remove");
    return;
  }

  const liquidityToRemove = (lpBalance * BigInt(PERCENTAGE_TO_REMOVE)) / 100n;
  console.log(`Removing ${PERCENTAGE_TO_REMOVE}% (${ethers.formatEther(liquidityToRemove)} LP tokens)`);
  console.log();

  // ============================================================================
  // APPROVE LP TOKENS
  // ============================================================================
  
  console.log("✅ Approving LP tokens...");
  await pair.approve(ROUTER_ADDRESS, liquidityToRemove);
  console.log("✅ Approved LP tokens");
  console.log();

  // ============================================================================
  // REMOVE LIQUIDITY
  // ============================================================================
  
  console.log("💧 Removing liquidity...");
  try {
    const tx = await router.removeLiquidity(
      TOKEN_A,
      TOKEN_B,
      liquidityToRemove,
      0, // Accept any amount (adjust for slippage protection)
      0,
      deployer.address,
      deadline
    );
    const receipt = await tx.wait();
    console.log("✅ Liquidity removed successfully!");
    console.log("Transaction hash:", receipt?.hash);
  } catch (error: any) {
    console.error("❌ Failed to remove liquidity:", error.message);
  }

  // ============================================================================
  // CHECK NEW BALANCES
  // ============================================================================
  
  console.log("\n📊 New balances:");
  const newLpBalance = await pair.balanceOf(deployer.address);
  console.log("LP tokens remaining:", ethers.formatEther(newLpBalance));
  
  const tokenA = await ethers.getContractAt("MockERC20", TOKEN_A);
  const tokenB = await ethers.getContractAt("MockERC20", TOKEN_B);
  
  const balanceA = await tokenA.balanceOf(deployer.address);
  const balanceB = await tokenB.balanceOf(deployer.address);
  
  const decimalsA = await tokenA.decimals();
  const decimalsB = await tokenB.decimals();
  
  console.log(`Token A balance: ${ethers.formatUnits(balanceA, decimalsA)}`);
  console.log(`Token B balance: ${ethers.formatUnits(balanceB, decimalsB)}`);

  console.log();
  console.log("=".repeat(60));
  console.log("🎉 LIQUIDITY REMOVAL COMPLETE!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

