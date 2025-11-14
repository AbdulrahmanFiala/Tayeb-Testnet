import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import deployedContracts from "../../config/deployedContracts.json";
import {
  executeReadyOrders,
  logMetrics,
  getMetrics,
  resetMetrics,
} from "../utils/dcaExecution";

dotenv.config();

/**
 * Continuous DCA Auto-Executor
 * 
 * Monitors and executes ready DCA orders continuously
 * 
 * Features:
 * - Automatic retry logic with exponential backoff
 * - Execution metrics tracking
 * - Periodic metrics reporting
 * - Graceful shutdown handling
 */
async function main() {
  const shariaDCA = await ethers.getContractAt(
    "ShariaDCA",
    deployedContracts.main.shariaDCA
  );

  console.log("🤖 DCA Auto-Executor Started");
  console.log("Contract:", deployedContracts.main.shariaDCA);
  console.log("Network: Moonbase Alpha");
  console.log("Mode: Local Automation Script");
  console.log();

  const checkInterval = 60000; // Check every 60 seconds
  const metricsReportInterval = 300000; // Report metrics every 5 minutes
  
  let isProcessing = false;
  let lastMetricsReport = Date.now();

  // Reset metrics on startup
  resetMetrics();

  const checkAndExecute = async () => {
    // Prevent overlapping executions
    if (isProcessing) {
      return;
    }
    
    isProcessing = true;
    
    try {
      // Execute orders using shared utility (includes retry logic and metrics)
      const result = await executeReadyOrders(shariaDCA, {
        logOrderIds: true,
        maxRetries: 3,
        retryDelayMs: 1000,
      });

      const timestamp = new Date().toLocaleTimeString();

      if (result.executed) {
        console.log(`[${timestamp}] ✅ Executed ${result.orderCount} order(s) successfully!`);
        if (result.receipt) {
          console.log(`   Block: ${result.receipt.blockNumber}`);
          console.log(`   Gas used: ${result.receipt.gasUsed.toString()}`);
        }
        if (result.retries && result.retries > 0) {
          console.log(`   Retries used: ${result.retries}`);
        }
        console.log();
      } else if (result.error) {
        console.error(`[${timestamp}] ❌ Execution failed:`, result.error);
        console.log();
      }
      // If no orders ready, silently continue

      // Periodic metrics reporting
      const now = Date.now();
      if (now - lastMetricsReport >= metricsReportInterval) {
        console.log(`[${timestamp}] 📊 Metrics Report:`);
        logMetrics();
        console.log();
        lastMetricsReport = now;
      }
    } catch (error: any) {
      const timestamp = new Date().toLocaleTimeString();
      console.error(`[${timestamp}] ❌ Error checking/executing upkeep:`, error.message);
      
      // Continue running even if there's an error
      if (error.reason) {
        console.error(`   Reason: ${error.reason}`);
      }
      console.log();
    } finally {
      isProcessing = false;
    }
  };

  // Initial check
  console.log("🔍 Performing initial check...\n");
  await checkAndExecute();

  // Set up periodic checking
  console.log(`⏰ Will check every ${checkInterval / 1000} seconds`);
  console.log("Press Ctrl+C to stop\n");
  console.log("=".repeat(60));
  console.log();

  setInterval(checkAndExecute, checkInterval);

  // Keep process alive
  process.on('SIGINT', () => {
    console.log("\n\n👋 Shutting down DCA Auto-Executor...");
    console.log();
    
    // Log final metrics before shutdown
    const metrics = getMetrics();
    if (metrics.totalExecutions > 0 || metrics.totalFailures > 0) {
      console.log("📊 Final Metrics:");
      logMetrics();
      console.log();
    }
    
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

