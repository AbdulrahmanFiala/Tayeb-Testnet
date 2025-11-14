import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import deployedContracts from "../../config/deployedContracts.json";
import {
  executeReadyOrders,
  logMetrics,
  getMetrics,
} from "../utils/dcaExecution";

dotenv.config();

/**
 * One-time execution script for ready DCA orders
 * Useful for cron jobs, GitHub Actions, or manual execution
 * 
 * This script trusts the contract's block time checking - it only executes
 * orders that the contract determines are ready based on block.timestamp
 * 
 * Features:
 * - Automatic retry logic with exponential backoff
 * - Execution metrics tracking
 * - Configurable retry attempts
 */
async function main() {
  const startTime = Date.now();

  const shariaDCA = await ethers.getContractAt(
    "ShariaDCA",
    deployedContracts.main.shariaDCA
  );

  console.log("🔍 Checking for ready DCA orders (block time based)...");
  console.log("Contract:", deployedContracts.main.shariaDCA);
  console.log();

  try {
    // Execute orders using shared utility (includes retry logic and metrics)
    const result = await executeReadyOrders(shariaDCA, {
      logOrderIds: true,
      maxRetries: 3, // Retry up to 3 times on failure
      retryDelayMs: 1000, // Start with 1 second delay
    });

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

    if (!result.executed) {
      if (result.error) {
        console.error("❌ Execution failed:", result.error);
        process.exit(1);
      } else {
        console.log("✅ No orders ready for execution");
        process.exit(0);
      }
    }

    // Log execution results
    console.log("=".repeat(60));
    console.log("✅ Execution Summary:");
    console.log(`   Orders executed: ${result.orderCount}`);
    if (result.receipt) {
      console.log(`   Block: ${result.receipt.blockNumber}`);
      console.log(`   Gas used: ${result.receipt.gasUsed.toString()}`);
    }
    if (result.txHash) {
      console.log(`   Transaction: ${result.txHash}`);
    }
    if (result.retries && result.retries > 0) {
      console.log(`   Retries used: ${result.retries}`);
    }
    console.log(`   Total duration: ${totalDuration}s`);
    console.log("=".repeat(60));
    console.log();

    // Log metrics
    logMetrics();

    console.log("ℹ️  Note: Contract uses block.timestamp to determine readiness.");
    console.log("   Individual order failures are handled silently by performUpkeep().");
  } catch (error: any) {
    console.error("❌ Fatal error:", error.message);
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    
    // Log metrics even on failure
    const metrics = getMetrics();
    if (metrics.totalExecutions > 0 || metrics.totalFailures > 0) {
      console.log();
      logMetrics();
    }
    
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

