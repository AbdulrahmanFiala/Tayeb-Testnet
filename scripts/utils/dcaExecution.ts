import { ethers } from "ethers";

/**
 * Execution result from DCA order execution
 */
export interface ExecutionResult {
  executed: boolean;
  orderCount: number;
  receipt: ethers.ContractTransactionReceipt | null;
  txHash: string | null;
  error?: string;
  retries?: number;
}

/**
 * Metrics for tracking DCA execution performance
 */
export interface ExecutionMetrics {
  totalExecutions: number;
  totalOrdersExecuted: number;
  totalFailures: number;
  lastExecution: Date | null;
  lastSuccess: Date | null;
  lastFailure: Date | null;
  averageOrdersPerExecution: number;
}

/**
 * Global metrics tracker
 */
let metrics: ExecutionMetrics = {
  totalExecutions: 0,
  totalOrdersExecuted: 0,
  totalFailures: 0,
  lastExecution: null,
  lastSuccess: null,
  lastFailure: null,
  averageOrdersPerExecution: 0,
};

/**
 * Get current metrics
 */
export function getMetrics(): ExecutionMetrics {
  return { ...metrics };
}

/**
 * Reset metrics
 */
export function resetMetrics(): void {
  metrics = {
    totalExecutions: 0,
    totalOrdersExecuted: 0,
    totalFailures: 0,
    lastExecution: null,
    lastSuccess: null,
    lastFailure: null,
    averageOrdersPerExecution: 0,
  };
}

/**
 * Execute a function with exponential backoff retry logic
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<{ result: T; retries: number }> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return { result, retries: attempt };
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate exponential backoff delay: 1s, 2s, 4s, etc.
      const delay = baseDelayMs * Math.pow(2, attempt);
      console.log(`   ⚠️  Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  
  throw lastError || new Error("Unknown error in retry logic");
}

/**
 * Execute ready DCA orders with retry logic and metrics
 * 
 * @param shariaDCA Contract instance (any contract with checkUpkeep and performUpkeep methods)
 * @param options Configuration options
 * @returns Execution result
 */
export async function executeReadyOrders(
  shariaDCA: any, // Using any to support ethers contract types
  options: {
    logOrderIds?: boolean;
    maxRetries?: number;
    retryDelayMs?: number;
  } = {}
): Promise<ExecutionResult> {
  const {
    logOrderIds = true,
    maxRetries = 3,
    retryDelayMs = 1000,
  } = options;

  metrics.lastExecution = new Date();

  try {
    // Check if upkeep is needed (with retry)
    const { result: upkeepResult, retries } = await executeWithRetry(
      async () => {
        const result = await shariaDCA.checkUpkeep("0x");
        return result as [boolean, string];
      },
      maxRetries,
      retryDelayMs
    );

    const [upkeepNeeded, performData] = upkeepResult;

    if (!upkeepNeeded) {
      return {
        executed: false,
        orderCount: 0,
        receipt: null,
        txHash: null,
        retries: retries,
      };
    }

    // Decode order IDs if logging is enabled
    let orderIds: bigint[] = [];
    if (logOrderIds) {
      try {
        orderIds = ethers.AbiCoder.defaultAbiCoder().decode(
          ["uint256[]"],
          performData
        )[0] as bigint[];
      } catch (error) {
        console.warn("   ⚠️  Could not decode order IDs for logging");
      }
    }

    // Execute orders (with retry)
    const { result: tx, retries: executionRetries } = await executeWithRetry(
      async () => {
        return await shariaDCA.performUpkeep(performData);
      },
      maxRetries,
      retryDelayMs
    );

    const receipt = await tx.wait();
    const orderCount = orderIds.length || 0;

    // Update metrics on success
    metrics.totalExecutions++;
    metrics.totalOrdersExecuted += orderCount;
    metrics.lastSuccess = new Date();
    metrics.averageOrdersPerExecution =
      metrics.totalOrdersExecuted / metrics.totalExecutions;

    return {
      executed: true,
      orderCount,
      receipt: receipt as ethers.ContractTransactionReceipt,
      txHash: tx.hash,
      retries: Math.max(retries, executionRetries),
    };
  } catch (error: any) {
    // Update metrics on failure
    metrics.totalFailures++;
    metrics.lastFailure = new Date();

    return {
      executed: false,
      orderCount: 0,
      receipt: null,
      txHash: null,
      error: error.message || String(error),
    };
  }
}

/**
 * Log execution metrics
 */
export function logMetrics(): void {
  console.log("=".repeat(60));
  console.log("📊 Execution Metrics:");
  console.log(`   Total executions: ${metrics.totalExecutions}`);
  console.log(`   Total orders executed: ${metrics.totalOrdersExecuted}`);
  console.log(`   Total failures: ${metrics.totalFailures}`);
  console.log(
    `   Average orders per execution: ${metrics.averageOrdersPerExecution.toFixed(2)}`
  );
  if (metrics.lastExecution) {
    console.log(`   Last execution: ${metrics.lastExecution.toLocaleString()}`);
  }
  if (metrics.lastSuccess) {
    console.log(`   Last success: ${metrics.lastSuccess.toLocaleString()}`);
  }
  if (metrics.lastFailure) {
    console.log(`   Last failure: ${metrics.lastFailure.toLocaleString()}`);
  }
  console.log("=".repeat(60));
}

