import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import deployedContracts from "../config/deployedContracts.json";

dotenv.config();

type DCAOrderState = {
  exists: boolean;
  isActive: boolean;
  intervalsCompleted: bigint;
  totalIntervals: bigint;
  nextExecutionTime: bigint;
};

async function getOrderState(
  shariaDCA: any,
  orderId: bigint
): Promise<DCAOrderState | null> {
  try {
    return await shariaDCA.getDCAOrder(orderId);
  } catch {
    return null;
  }
}

/**
 * One-time execution script for ready DCA orders
 * Useful for cron jobs, GitHub Actions, or manual execution
 */
async function main() {
  const startTime = Date.now();

  const shariaDCA = await ethers.getContractAt(
    "ShariaDCA",
    deployedContracts.main.shariaDCA
  );

  console.log("🔍 Checking for ready DCA orders...");
  console.log("Contract:", deployedContracts.main.shariaDCA);
  console.log();

  try {
    const [upkeepNeeded, performData] = await shariaDCA.checkUpkeep("0x");
    
    if (!upkeepNeeded) {
      console.log("✅ No orders ready for execution");
      process.exit(0);
    }

    const orderIds = ethers.AbiCoder.defaultAbiCoder().decode(
      ["uint256[]"],
      performData
    )[0];

    const ordersWithState: Array<{ id: bigint; state: DCAOrderState | null }> = await Promise.all(
      orderIds.map(async (id: bigint) => ({
        id,
        state: await getOrderState(shariaDCA, id)
      }))
    );

    console.log(`✅ Found ${ordersWithState.length} order(s) ready for execution:\n`);
    ordersWithState.forEach(({ id, state }) => {
      if (!state) {
        console.log(`  - Order #${id} (state unavailable)`);
        return;
      }

      const intervalsCompleted = Number(state.intervalsCompleted);
      const totalIntervals = Number(state.totalIntervals);
      console.log(`  - Order #${id} (Interval ${intervalsCompleted + 1}/${totalIntervals})`);
    });
    console.log();

    // Execute all ready orders
    const results = [];
    let totalIntervalsExecuted = 0;
    
    for (const { id: orderId, state } of ordersWithState) {
      let orderSuccess = true;
      let lastError = null;
      const orderStartTime = Date.now();
      
      console.log(`🔄 Processing Order #${orderId}...`);

      try {
        if (!state) {
          throw new Error("Unable to fetch order state");
        }
        if (!state.exists) {
          throw new Error("Order does not exist");
        }
        if (!state.isActive) {
          throw new Error("Order is not active");
        }

        const intervalsCompleted = Number(state.intervalsCompleted);
        const totalIntervals = Number(state.totalIntervals);

        if (intervalsCompleted >= totalIntervals) {
          throw new Error("Order already completed");
        }

        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime < Number(state.nextExecutionTime)) {
          throw new Error("Order not ready yet");
        }

        const intervalLabel = `${intervalsCompleted + 1}/${totalIntervals}`;
        console.log(`   🔄 Executing interval ${intervalLabel}...`);

        const tx = await shariaDCA.executeDCAOrder(orderId);
        console.log(`      Transaction sent: ${tx.hash}`);

        const receipt = await tx.wait();
        console.log(`   ✅ Order #${orderId} executed successfully! (Interval ${intervalLabel})`);
        console.log(`      Block: ${receipt.blockNumber}`);
        console.log(`      Gas used: ${receipt.gasUsed.toString()}\n`);

        totalIntervalsExecuted++;
      } catch (error: any) {
        orderSuccess = false;
        lastError = error.message ?? String(error);
        const intervalInfo =
          state && state.exists
            ? ` (Interval ${Number(state.intervalsCompleted) + 1}/${Number(state.totalIntervals)})`
            : "";
        console.error(`   ❌ Failed to execute Order #${orderId}${intervalInfo}: ${lastError}\n`);
      }

      const orderDuration = ((Date.now() - orderStartTime) / 1000).toFixed(1);
      
      // Log order completion
      results.push({
        orderId: orderId.toString(),
        success: orderSuccess,
        duration: orderDuration,
        error: lastError
      });
    }

    // Summary
    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log("=".repeat(60));
    console.log("📊 Execution Summary:");
    console.log(`   Orders processed: ${ordersWithState.length}`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Total intervals executed: ${totalIntervalsExecuted}`);
    console.log(`   Total duration: ${totalDuration}s`);
    console.log("=".repeat(60));

    // Detailed per-order results
    if (results.length > 1) {
      console.log("\n📋 Per-Order Details:");
      results.forEach(r => {
        const status = r.success ? "✅" : "❌";
        const errorSuffix = r.success ? "" : ` — ${r.error}`;
        console.log(`   ${status} Order #${r.orderId}: ${r.duration}s${errorSuffix}`);
      });
    }

    // Exit with error code if any failed (useful for CI/CD)
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error: any) {
    console.error("❌ Fatal error:", error.message);
    if (error.reason) {
      console.error("   Reason:", error.reason);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Unhandled error:", error);
  process.exit(1);
});

