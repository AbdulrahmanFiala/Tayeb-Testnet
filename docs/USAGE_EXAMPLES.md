# Usage Examples

This document contains detailed code examples for integrating with the Tayeb platform.

## 📋 Table of Contents

- [Post-Deployment Setup](#post-deployment-setup)
- [Coin Management Workflow](#coin-management-workflow)
- [Executing Swaps](#executing-swaps)
- [Creating DCA Orders](#creating-dca-orders)
- [Setting Up Automation](#setting-up-automation)

## Post-Deployment Setup

After deployment, all token addresses are automatically registered. Access deployed addresses:

```typescript
// Frontend example using Wagmi v2 + Viem
import tayebCoins from './config/tayebCoins.json';
import deployedContracts from './config/deployedContracts.json';
import { useReadContract, useWriteContract } from 'wagmi';
import { ShariaSwapABI } from './config/abis';
import type { Address } from 'viem';

// Get token addresses from config
const btcCoin = tayebCoins.coins.find(c => c.symbol === "BTC");
const btcAddress = btcCoin?.addresses.moonbase as Address;

const ethCoin = tayebCoins.coins.find(c => c.symbol === "ETH");
const ethAddress = ethCoin?.addresses.moonbase as Address;

const usdtCoin = tayebCoins.coins.find(c => c.symbol === "USDT");
const usdtAddress = usdtCoin?.addresses.moonbase as Address;

const SHARIA_SWAP_ADDRESS = deployedContracts.main.shariaSwap as Address;
```

### React Hook Example (Wagmi v2)

```typescript
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ShariaSwapABI } from '../config/abis';
import deployedContracts from '../../config/deployedContracts.json';
import type { Address } from 'viem';
import { parseEther, parseUnits } from 'viem';

function useShariaSwap() {
  const { writeContract, data: txHash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash: txHash });

  const swapDEVForToken = async (
    tokenOut: Address,
    amountIn: bigint,
    minAmountOut: bigint
  ) => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 15); // 15 minutes
    
    await writeContract({
      address: deployedContracts.main.shariaSwap as Address,
      abi: ShariaSwapABI,
      functionName: 'swapGLMRForToken',
      args: [tokenOut, minAmountOut, deadline],
      value: amountIn, // Send native DEV with transaction
    });
  };

  return { swapDEVForToken, txHash, isPending, isConfirming, isConfirmed, error };
}
```

## Coin Management Workflow

### Contract is Source of Truth

The ShariaCompliance contract is the authoritative source for coin registrations. When you add/remove coins on-chain:

**1. Owner calls contract functions:**
```solidity
// Add coin
shariaCompliance.registerShariaCoin("NEW", "New Token", "NEW", "Compliance reason");

// Remove coin
shariaCompliance.removeShariaCoin("OLD");

// Update status
shariaCompliance.updateComplianceStatus("TOKEN", false, "Reason for removal");
```

**2. Sync JSON from contract:**

**Manual Sync:**
```bash
npm run sync:coins
```
- Reads all coins from contract
- Updates `tayebCoins.json` to match contract state
- Adds new coins, marks removed ones as `permissible: false`
- Updates token addresses in `deployedContracts.json`

**Auto Sync (Continuous):**
```bash
npm run listen:events
```
- Listens to `CoinRegistered`, `CoinRemoved`, `CoinUpdated` events
- Automatically updates JSON files when events occur
- Runs continuously (Press Ctrl+C to stop)

### Permissible Flag

- `permissible: true` - Coin is registered and verified in contract
- `permissible: false` - Coin removed from contract (kept in JSON for history)

### Adding New Coins

**Method 1: On-Chain (Recommended)**
1. Deploy token contract (if needed): `npm run deploy:tokens`
2. Owner calls `registerShariaCoin()` on contract
3. Run `npm run sync:coins` (or use listener)
4. JSON automatically updated

**Method 2: Via JSON First**
1. Add coin to `tayebCoins.json`
2. Deploy token: `npm run deploy:tokens` (deploys new token)
3. Create pairs: `npm run deploy:pairs` (creates pairs for new token)
4. Run `npm run deploy:core` (registers new coin in ShariaCompliance)
5. Add liquidity: `npx hardhat run scripts/liquidity/addLiquidity.ts --network moonbase` (if needed)

### Code Example: Register Coin from Frontend (Wagmi v2)

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ShariaComplianceABI } from '../config/abis';
import deployedContracts from '../../config/deployedContracts.json';
import type { Address } from 'viem';

function RegisterCoinComponent() {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = 
    useWaitForTransactionReceipt({ hash: txHash });

  const registerCoin = async () => {
    await writeContract({
      address: deployedContracts.main.shariaCompliance as Address,
      abi: ShariaComplianceABI,
      functionName: 'registerShariaCoin',
      args: [
        "NEW",           // coinId
        "New Token",     // name
        "NEW",           // symbol
        "Compliance reason" // complianceReason
      ],
    });
  };

  if (isSuccess) {
    // Coin registered! Run: npm run sync:coins
    console.log("Coin registered!");
  }

  return (
    <button onClick={registerCoin} disabled={isPending || isConfirming}>
      {isPending ? 'Registering...' : 'Register Coin'}
    </button>
  );
}
```

## Executing Swaps

> **💡 Automatic Routing**: ShariaSwap automatically routes swaps through USDC when a direct pair doesn't exist. For example, swapping ETH → BTC will automatically use the ETH/USDC and BTC/USDC pairs (ETH → USDC → BTC). You don't need to specify the path - the contract handles it automatically!

### Swap DEV for Token (Wagmi v2)

```typescript
// Swap DEV for USDT (Sharia-compliant)
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useReadContract } from 'wagmi';
import { ShariaSwapABI } from '../config/abis';
import tayebCoins from '../../config/tayebCoins.json';
import deployedContracts from '../../config/deployedContracts.json';
import { parseEther, parseUnits } from 'viem';
import type { Address } from 'viem';

function SwapComponent() {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = 
    useWaitForTransactionReceipt({ hash: txHash });

  const usdtCoin = tayebCoins.coins.find(c => c.symbol === "USDT");
  const USDT_ADDRESS = usdtCoin?.addresses.moonbase as Address;

  // Get quote first
  const { data: quote } = useReadContract({
    address: deployedContracts.main.shariaSwap as Address,
    abi: ShariaSwapABI,
    functionName: 'getSwapQuote',
    args: [
      '0x0000000000000000000000000000000000000000', // Native DEV (ZeroAddress)
      USDT_ADDRESS,
      parseEther("1.0") // 1 DEV
    ],
  });

  const swapDEVForUSDT = async () => {
    const amountIn = parseEther("1.0"); // 1 DEV
    const minAmountOut = quote ? (quote * BigInt(95)) / BigInt(100) : parseUnits("5", 6); // 5% slippage
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 15); // 15 minutes

    await writeContract({
      address: deployedContracts.main.shariaSwap as Address,
      abi: ShariaSwapABI,
      functionName: 'swapGLMRForToken',
      args: [USDT_ADDRESS, minAmountOut, deadline],
      value: amountIn, // Send native DEV with transaction
    });
  };

  if (isSuccess) {
    console.log("Swap completed!");
  }

  return (
    <button onClick={swapDEVForUSDT} disabled={isPending || isConfirming}>
      {isPending ? 'Swapping...' : 'Swap 1 DEV for USDT'}
    </button>
  );
}
```

### Swap Token for Token (Wagmi v2)

```typescript
// Swap BTC for ETH
// Note: If no direct BTC/ETH pair exists, this will automatically route through USDC (BTC → USDC → ETH)
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { ShariaSwapABI, ERC20_ABI } from '../config/abis';
import tayebCoins from '../../config/tayebCoins.json';
import deployedContracts from '../../config/deployedContracts.json';
import { parseUnits, formatEther, maxUint256 } from 'viem';
import type { Address } from 'viem';

function TokenSwapComponent() {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = 
    useWaitForTransactionReceipt({ hash: txHash });

  const btcCoin = tayebCoins.coins.find(c => c.symbol === "BTC");
  const ethCoin = tayebCoins.coins.find(c => c.symbol === "ETH");
  const BTC_ADDRESS = btcCoin?.addresses.moonbase as Address;
  const ETH_ADDRESS = ethCoin?.addresses.moonbase as Address;
  const SHARIA_SWAP_ADDRESS = deployedContracts.main.shariaSwap as Address;

  const amountIn = parseUnits("0.1", 8); // 0.1 BTC (8 decimals)

  // Get quote (automatically uses best path: direct or through USDC)
  const { data: quote } = useReadContract({
    address: SHARIA_SWAP_ADDRESS,
    abi: ShariaSwapABI,
    functionName: 'getSwapQuote',
    args: [BTC_ADDRESS, ETH_ADDRESS, amountIn],
  });

  if (quote) {
    console.log(`Expected output: ${formatEther(quote)} ETH`);
  }

  // Approve token first
  const approveToken = async () => {
    await writeContract({
      address: BTC_ADDRESS,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [SHARIA_SWAP_ADDRESS, maxUint256],
    });
  };

  // Execute swap (path is automatically determined)
  const swapBTCForETH = async () => {
    const minAmountOut = quote ? (quote * BigInt(95)) / BigInt(100) : 0n; // 5% slippage
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 15);

    await writeContract({
      address: SHARIA_SWAP_ADDRESS,
      abi: ShariaSwapABI,
      functionName: 'swapShariaCompliant',
      args: [BTC_ADDRESS, ETH_ADDRESS, amountIn, minAmountOut, deadline],
    });
  };

  return (
    <div>
      <button onClick={approveToken}>Approve BTC</button>
      <button onClick={swapBTCForETH} disabled={isPending || isConfirming}>
        {isPending ? 'Swapping...' : 'Swap 0.1 BTC for ETH'}
      </button>
      {isSuccess && <p>Swap completed!</p>}
    </div>
  );
}
```

### Get Swap Quote (Wagmi v2)

```typescript
// Get price estimate before swapping
import { useReadContract } from 'wagmi';
import { ShariaSwapABI } from '../config/abis';
import { parseEther, formatUnits } from 'viem';
import { zeroAddress } from 'viem';

function QuoteComponent() {
  const { data: quote } = useReadContract({
    address: deployedContracts.main.shariaSwap as Address,
    abi: ShariaSwapABI,
    functionName: 'getSwapQuote',
    args: [
      zeroAddress, // DEV (native token)
      USDT_ADDRESS,
      parseEther("1.0") // 1 DEV
    ],
  });

  if (quote) {
    console.log(`1 DEV = ${formatUnits(quote, 6)} USDT`);
  }

  return <div>Quote: {quote ? formatUnits(quote, 6) : '...'} USDT</div>;
}
```

### View Swap History (Wagmi v2)

```typescript
// Get user's swap history
import { useReadContract, useAccount } from 'wagmi';
import { ShariaSwapABI } from '../config/abis';

function SwapHistoryComponent() {
  const { address } = useAccount();
  
  const { data: history } = useReadContract({
    address: deployedContracts.main.shariaSwap as Address,
    abi: ShariaSwapABI,
    functionName: 'getUserSwapHistory',
    args: [address!],
    query: { enabled: !!address },
  });

  if (!history) return <div>Loading history...</div>;

  return (
    <div>
      {history.map((swap, index) => (
        <div key={index}>
          <p>Swap {index + 1}:</p>
          <p>Token In: {swap.tokenIn}</p>
          <p>Token Out: {swap.tokenOut}</p>
          <p>Amount In: {swap.amountIn.toString()}</p>
          <p>Amount Out: {swap.amountOut.toString()}</p>
          <p>Timestamp: {new Date(Number(swap.timestamp) * 1000).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}
```

## Creating DCA Orders

> **Note**: The contract uses two separate functions:
> - `createDCAOrderWithDEV()` - For native DEV deposits (no approval needed)
> - `createDCAOrderWithToken()` - For ERC20 token deposits (approval required)

### Basic DCA Order (DEV → Token) (Wagmi v2)

```typescript
// DCA: Invest 1 DEV into USDT every day for 30 days
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ShariaDCAABI } from '../config/abis';
import tayebCoins from '../../config/tayebCoins.json';
import deployedContracts from '../../config/deployedContracts.json';
import { parseEther } from 'viem';
import type { Address } from 'viem';

function DCACreateComponent() {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = 
    useWaitForTransactionReceipt({ hash: txHash });

  const usdtCoin = tayebCoins.coins.find(c => c.symbol === "USDT");
  const TARGET_TOKEN = usdtCoin?.addresses.moonbase as Address;
  const SHARIA_DCA_ADDRESS = deployedContracts.main.shariaDCA as Address;

  const createDCAOrder = async () => {
    const amountPerInterval = parseEther("1"); // 1 DEV per interval
    const intervalSeconds = BigInt(86400); // 1 day (24 hours)
    const totalIntervals = BigInt(30); // 30 days total
    const totalDeposit = amountPerInterval * totalIntervals; // 30 DEV total

    await writeContract({
      address: SHARIA_DCA_ADDRESS,
      abi: ShariaDCAABI,
      functionName: 'createDCAOrderWithDEV',
      args: [
        TARGET_TOKEN,      // targetToken
        amountPerInterval, // amountPerInterval
        intervalSeconds,   // intervalSeconds
        totalIntervals     // totalIntervals
      ],
      value: totalDeposit, // Send native DEV with transaction
    });
  };

  if (isSuccess) {
    console.log("DCA order created!");
    // Order ID is available in the transaction receipt events
  }

  return (
    <button onClick={createDCAOrder} disabled={isPending || isConfirming}>
      {isPending ? 'Creating...' : 'Create DCA Order'}
    </button>
  );
}
```

### DCA with Different Intervals (Wagmi v2)

```typescript
// Weekly DCA: Invest 5 DEV into BTC every week for 12 weeks
import { useWriteContract } from 'wagmi';
import { ShariaDCAABI } from '../config/abis';
import { parseEther } from 'viem';

function WeeklyDCAComponent() {
  const { writeContract } = useWriteContract();

  const createWeeklyDCA = async () => {
    const btcCoin = tayebCoins.coins.find(c => c.symbol === "BTC");
    const TARGET_TOKEN = btcCoin?.addresses.moonbase as Address;
    
    const amountPerInterval = parseEther("5"); // 5 DEV per week
    const intervalSeconds = BigInt(604800); // 1 week (7 days)
    const totalIntervals = BigInt(12); // 12 weeks
    const totalDeposit = amountPerInterval * totalIntervals; // 60 DEV total

    await writeContract({
      address: SHARIA_DCA_ADDRESS,
      abi: ShariaDCAABI,
      functionName: 'createDCAOrderWithDEV',
      args: [TARGET_TOKEN, amountPerInterval, intervalSeconds, totalIntervals],
      value: totalDeposit,
    });
  };

  return <button onClick={createWeeklyDCA}>Create Weekly DCA</button>;
}
```

### Token → Token DCA (Wagmi v2)

```typescript
// DCA: Invest 100 USDC into BTC every day for 30 days
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ShariaDCAABI, ERC20_ABI } from '../config/abis';
import tayebCoins from '../../config/tayebCoins.json';
import deployedContracts from '../../config/deployedContracts.json';
import { parseUnits } from 'viem';
import type { Address } from 'viem';

function TokenDCACreateComponent() {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = 
    useWaitForTransactionReceipt({ hash: txHash });

  const usdcCoin = tayebCoins.coins.find(c => c.symbol === "USDC");
  const btcCoin = tayebCoins.coins.find(c => c.symbol === "BTC");
  const SOURCE_TOKEN = usdcCoin?.addresses.moonbase as Address;
  const TARGET_TOKEN = btcCoin?.addresses.moonbase as Address;
  const SHARIA_DCA_ADDRESS = deployedContracts.main.shariaDCA as Address;

  // First, approve ShariaDCA to spend your USDC
  const approveToken = async () => {
    const amountPerInterval = parseUnits("100", 6); // 100 USDC (6 decimals)
    const totalIntervals = BigInt(30);
    const totalRequired = amountPerInterval * totalIntervals; // 3000 USDC

    await writeContract({
      address: SOURCE_TOKEN,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [SHARIA_DCA_ADDRESS, totalRequired],
    });
  };

  // Create DCA order (no value needed for ERC20)
  const createDCAOrder = async () => {
    const amountPerInterval = parseUnits("100", 6); // 100 USDC (6 decimals)
    const intervalSeconds = BigInt(86400); // Daily
    const totalIntervals = BigInt(30);

    await writeContract({
      address: SHARIA_DCA_ADDRESS,
      abi: ShariaDCAABI,
      functionName: 'createDCAOrderWithToken',
      args: [
        SOURCE_TOKEN,      // sourceToken
        TARGET_TOKEN,      // targetToken
        amountPerInterval,
        intervalSeconds,
        totalIntervals
      ],
    });
  };

  if (isSuccess) {
    console.log("USDC → BTC DCA order created!");
  }

  return (
    <div>
      <button onClick={approveToken}>Approve USDC</button>
      <button onClick={createDCAOrder} disabled={isPending || isConfirming}>
        {isPending ? 'Creating...' : 'Create DCA Order'}
      </button>
    </div>
  );
}
```

### More Token → Token Examples (Wagmi v2)

```typescript
// Example 1: ETH → USDT DCA
import { useWriteContract } from 'wagmi';
import { ShariaDCAABI, ERC20_ABI } from '../config/abis';
import { parseEther, parseUnits } from 'viem';

function MultiTokenDCAComponent() {
  const { writeContract } = useWriteContract();

  // Example 1: ETH → USDT DCA
  const createETHDCA = async () => {
    const ethCoin = tayebCoins.coins.find(c => c.symbol === "ETH");
    const usdtCoin = tayebCoins.coins.find(c => c.symbol === "USDT");
    const SOURCE_TOKEN = ethCoin?.addresses.moonbase as Address;
    const TARGET_TOKEN = usdtCoin?.addresses.moonbase as Address;

    const amountPerInterval = parseEther("0.1"); // 0.1 ETH
    const intervalSeconds = BigInt(86400); // Daily
    const totalIntervals = BigInt(30);

    // Approve ETH token first
    await writeContract({
      address: SOURCE_TOKEN,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [SHARIA_DCA_ADDRESS, amountPerInterval * totalIntervals],
    });

    // Create DCA order
    await writeContract({
      address: SHARIA_DCA_ADDRESS,
      abi: ShariaDCAABI,
      functionName: 'createDCAOrderWithToken',
      args: [SOURCE_TOKEN, TARGET_TOKEN, amountPerInterval, intervalSeconds, totalIntervals],
    });
  };

  // Example 2: BTC → SOL DCA
  // Automatically routes through USDC if no direct pair exists
  const createBTCDCA = async () => {
    const btcCoin = tayebCoins.coins.find(c => c.symbol === "BTC");
    const solCoin = tayebCoins.coins.find(c => c.symbol === "SOL");
    const SOURCE_TOKEN = btcCoin?.addresses.moonbase as Address;
    const TARGET_TOKEN = solCoin?.addresses.moonbase as Address;

    await writeContract({
      address: SHARIA_DCA_ADDRESS,
      abi: ShariaDCAABI,
      functionName: 'createDCAOrderWithToken',
      args: [
        SOURCE_TOKEN,
        TARGET_TOKEN,
        parseUnits("0.01", 8), // 0.01 BTC
        BigInt(604800),        // Weekly
        BigInt(12)             // 12 weeks
      ],
      // Note: Will route BTC → USDC → SOL if needed
    });
  };

  return (
    <div>
      <button onClick={createETHDCA}>Create ETH → USDT DCA</button>
      <button onClick={createBTCDCA}>Create BTC → SOL DCA</button>
    </div>
  );
}
```

### Get DCA Order Details (Wagmi v2)

```typescript
// Get order information
import { useReadContract } from 'wagmi';
import { ShariaDCAABI } from '../config/abis';
import { formatEther } from 'viem';
import type { Address } from 'viem';

function DCAOrderDetailsComponent({ orderId }: { orderId: bigint }) {
  const { data: order } = useReadContract({
    address: deployedContracts.main.shariaDCA as Address,
    abi: ShariaDCAABI,
    functionName: 'getDCAOrder',
    args: [orderId],
  });

  if (!order) return <div>Loading order...</div>;

  return (
    <div>
      <p>Order ID: {orderId.toString()}</p>
      <p>User: {order.owner}</p>
      <p>Source Token: {order.sourceToken}</p>
      <p>Target Token: {order.targetToken}</p>
      <p>Amount Per Interval: {formatEther(order.amountPerInterval)}</p>
      <p>Interval: {order.interval.toString()} seconds</p>
      <p>Total Intervals: {order.totalIntervals.toString()}</p>
      <p>Completed Intervals: {order.intervalsCompleted.toString()}</p>
      <p>Next Execution: {new Date(Number(order.nextExecutionTime) * 1000).toLocaleString()}</p>
      <p>Active: {order.isActive ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Get User's DCA Orders (Wagmi v2)

```typescript
// Get all orders for a user
import { useReadContract, useAccount } from 'wagmi';
import { ShariaDCAABI } from '../config/abis';

function UserDCAOrdersComponent() {
  const { address } = useAccount();
  
  const { data: orderIds } = useReadContract({
    address: deployedContracts.main.shariaDCA as Address,
    abi: ShariaDCAABI,
    functionName: 'getUserOrders',
    args: [address!],
    query: { enabled: !!address },
  });

  if (!orderIds) return <div>Loading orders...</div>;

  return (
    <div>
      {orderIds.map((orderId, index) => (
        <DCAOrderDetailsComponent key={index} orderId={orderId} />
      ))}
    </div>
  );
}
```

### Cancel DCA Order (Wagmi v2)

```typescript
// Cancel order and get refund for uncompleted intervals
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { ShariaDCAABI } from '../config/abis';
import { formatEther } from 'viem';

function CancelDCAComponent({ orderId }: { orderId: bigint }) {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = 
    useWaitForTransactionReceipt({ hash: txHash });

  // Get order details to calculate refund
  const { data: order } = useReadContract({
    address: deployedContracts.main.shariaDCA as Address,
    abi: ShariaDCAABI,
    functionName: 'getDCAOrder',
    args: [orderId],
  });

  const cancelOrder = async () => {
    await writeContract({
      address: deployedContracts.main.shariaDCA as Address,
      abi: ShariaDCAABI,
      functionName: 'cancelDCAOrder',
      args: [orderId],
    });
  };

  if (order) {
    const remainingIntervals = order.totalIntervals - order.intervalsCompleted;
    const refundAmount = order.amountPerInterval * BigInt(remainingIntervals);
    console.log(`Refund: ${formatEther(refundAmount)}`);
  }

  if (isSuccess) {
    console.log("Order canceled! Refund will be sent to your address.");
  }

  return (
    <button onClick={cancelOrder} disabled={isPending || isConfirming}>
      {isPending ? 'Canceling...' : 'Cancel Order'}
    </button>
  );
}
```

### Manual DCA Execution (Wagmi v2)

```typescript
// Execute DCA order manually
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ShariaDCAABI } from '../config/abis';

function ExecuteDCAComponent({ orderId }: { orderId: bigint }) {
  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = 
    useWaitForTransactionReceipt({ hash: txHash });

  const executeOrder = async () => {
    await writeContract({
      address: deployedContracts.main.shariaDCA as Address,
      abi: ShariaDCAABI,
      functionName: 'executeDCAOrder',
      args: [orderId],
    });
  };

  if (isSuccess) {
    console.log("DCA interval executed!", txHash);
  }

  return (
    <button onClick={executeOrder} disabled={isPending || isConfirming}>
      {isPending ? 'Executing...' : 'Execute Order'}
    </button>
  );
}
```

## Setting Up Automation

### Automatic DCA Execution

For automatic DCA execution, use the local automation script:

1. Ensure your `.env` file has `PRIVATE_KEY` set (executor wallet)
2. Ensure the executor wallet has DEV tokens for gas
3. Run the automation script:
   ```bash
   npx hardhat run scripts/automation/auto-execute-dca.ts --network moonbase
   ```
4. The script will check every 60 seconds and execute ready orders automatically
5. Keep the script running for continuous automation

### Manual Execution

You can also execute orders manually:

```typescript
// Check if order is ready for execution
const order = await shariaDCA.getDCAOrder(orderId);
const currentTime = Math.floor(Date.now() / 1000);

if (Number(order.nextExecutionTime) <= currentTime && order.isActive) {
  console.log("Order is ready for execution!");
  
  const tx = await shariaDCA.executeDCAOrder(orderId);
  const receipt = await tx.wait();
  console.log("DCA executed!", receipt.transactionHash);
} else {
  console.log("Order not ready yet. Next execution:", new Date(Number(order.nextExecutionTime) * 1000));
}
```

### Check Upkeep Status (Wagmi v2)

```typescript
// Check if upkeep is needed (for automation script)
import { useReadContract } from 'wagmi';
import { ShariaDCAABI } from '../config/abis';
import { decodeAbiParameters } from 'viem';

function UpkeepStatusComponent() {
  const { data: upkeepData } = useReadContract({
    address: deployedContracts.main.shariaDCA as Address,
    abi: ShariaDCAABI,
    functionName: 'checkUpkeep',
    args: ['0x'],
  });

  if (!upkeepData) return <div>Loading upkeep status...</div>;

  const [upkeepNeeded, performData] = upkeepData;

  if (upkeepNeeded) {
    // Decode performData to get order IDs
    const orderIds = decodeAbiParameters(
      [{ type: 'uint256[]' }],
      performData as `0x${string}`
    )[0];
    
    console.log("Upkeep needed! Orders ready for execution.");
    console.log("Ready orders:", orderIds);
    
    // Execute via automation script or manually call performUpkeep()
  } else {
    console.log("No upkeep needed at this time.");
  }

  return (
    <div>
      <p>Upkeep Needed: {upkeepNeeded ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### One-Time Execution Script

For cron jobs or scheduled tasks, use the one-time execution script:

```bash
npx hardhat run scripts/automation/execute-ready-orders.ts --network moonbase
```

This script executes all ready orders once and exits, perfect for GitHub Actions or cron jobs.

## Integration with ShariaCompliance

### Check Token Compliance (Wagmi v2)

```typescript
import { useReadContract } from 'wagmi';
import { ShariaComplianceABI } from '../config/abis';
import deployedContracts from '../../config/deployedContracts.json';

function ComplianceCheckComponent({ symbol }: { symbol: string }) {
  // Check if a token is Sharia-compliant
  const { data: isCompliant } = useReadContract({
    address: deployedContracts.main.shariaCompliance as Address,
    abi: ShariaComplianceABI,
    functionName: 'isShariaCompliant',
    args: [symbol],
  });

  // Get all compliant tokens
  const { data: allCoins } = useReadContract({
    address: deployedContracts.main.shariaCompliance as Address,
    abi: ShariaComplianceABI,
    functionName: 'getAllShariaCoins',
  });

  return (
    <div>
      <p>
        {symbol} is {isCompliant ? "compliant" : "not compliant"}
      </p>
      {allCoins && (
        <ul>
          {allCoins.map((coin, index) => (
            <li key={index}>
              {coin.symbol}: {coin.name} - {coin.complianceReason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Get Token Address from Contract (Wagmi v2)

```typescript
// Get token address from ShariaCompliance contract
import { useReadContract } from 'wagmi';
import { ShariaComplianceABI } from '../config/abis';

function TokenAddressComponent({ symbol }: { symbol: string }) {
  const { data: tokenAddress } = useReadContract({
    address: deployedContracts.main.shariaCompliance as Address,
    abi: ShariaComplianceABI,
    functionName: 'symbolToAddress',
    args: [symbol],
  });

  return <div>{symbol} address: {tokenAddress}</div>;
}
```

## Error Handling

### Example with Error Handling (Wagmi v2)

```typescript
import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { ShariaSwapABI, ShariaComplianceABI } from '../config/abis';
import deployedContracts from '../../config/deployedContracts.json';
import type { Address } from 'viem';

function SwapWithErrorHandling({ 
  tokenIn, 
  tokenOut, 
  amountIn 
}: { 
  tokenIn: Address; 
  tokenOut: Address; 
  amountIn: bigint;
}) {
  const { writeContract, data: txHash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, error: confirmError } = 
    useWaitForTransactionReceipt({ hash: txHash });

  // Check compliance first
  const { data: isCompliant } = useReadContract({
    address: deployedContracts.main.shariaCompliance as Address,
    abi: ShariaComplianceABI,
    functionName: 'isShariaCompliant',
    args: [tokenOut],
  });

  // Get quote
  const { data: quote } = useReadContract({
    address: deployedContracts.main.shariaSwap as Address,
    abi: ShariaSwapABI,
    functionName: 'getSwapQuote',
    args: [tokenIn, tokenOut, amountIn],
  });

  const swapTokens = async () => {
    try {
      if (!isCompliant) {
        throw new Error("Token is not Sharia-compliant");
      }

      if (!quote) {
        throw new Error("Failed to get quote");
      }

      const minAmountOut = (quote * BigInt(95)) / BigInt(100); // 5% slippage
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 15);

      await writeContract({
        address: deployedContracts.main.shariaSwap as Address,
        abi: ShariaSwapABI,
        functionName: 'swapShariaCompliant',
        args: [tokenIn, tokenOut, amountIn, minAmountOut, deadline],
      });
    } catch (error: any) {
      console.error("Swap failed:", error.message);
    }
  };

  if (isSuccess) {
    console.log("Swap successful!", txHash);
  }

  const error = writeError || confirmError;
  if (error) {
    console.error("Transaction error:", error.message);
  }

  return (
    <button onClick={swapTokens} disabled={isPending || isConfirming || !isCompliant}>
      {isPending ? 'Swapping...' : 'Swap Tokens'}
    </button>
  );
}
```

## Debugging Failed Transactions

### Decode Failed Transaction Script

If a transaction fails, use the decode script to understand what went wrong:

```bash
# Using environment variable
TX_HASH=0x773aac5810a73346407eccc695b23aa9197653b4d306effe58f2714683509a23 \
npx hardhat run scripts/diagnostics/decode-failed-tx.ts --network moonbase
```

## Frontend Integration (React + Wagmi v2 Example)

```typescript
import React, { useState } from 'react';
import { useWriteContract, useReadContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { ShariaSwapABI } from './config/abis';
import deployedContracts from './config/deployedContracts.json';
import { parseEther } from 'viem';
import type { Address } from 'viem';

function SwapInterface() {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const USDT_ADDRESS = '0x...' as Address; // Get from config

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = 
    useWaitForTransactionReceipt({ hash: txHash });

  // Get quote
  const { data: quote } = useReadContract({
    address: deployedContracts.main.shariaSwap as Address,
    abi: ShariaSwapABI,
    functionName: 'getSwapQuote',
    args: [
      '0x0000000000000000000000000000000000000000', // Native DEV
      USDT_ADDRESS,
      amount ? parseEther(amount) : 0n
    ],
    query: { enabled: !!amount && isConnected },
  });

  const handleSwap = async () => {
    if (!amount || !isConnected) return;
    
    try {
      const amountIn = parseEther(amount);
      const minAmountOut = quote ? (quote * BigInt(95)) / BigInt(100) : 0n; // 5% slippage
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 15);
      
      await writeContract({
        address: deployedContracts.main.shariaSwap as Address,
        abi: ShariaSwapABI,
        functionName: 'swapGLMRForToken',
        args: [USDT_ADDRESS, minAmountOut, deadline],
        value: amountIn,
      });
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  if (isSuccess) {
    alert('Swap successful!');
  }

  return (
    <div>
      {!isConnected && <p>Please connect your wallet</p>}
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in DEV"
        disabled={!isConnected}
      />
      {quote && (
        <p>Expected output: {quote.toString()} USDT</p>
      )}
      <button 
        onClick={handleSwap} 
        disabled={!isConnected || isPending || isConfirming || !amount}
      >
        {isPending ? 'Swapping...' : 'Swap'}
      </button>
    </div>
  );
}
```

---

For more information, see:
- [README.md](../README.md) - Main documentation
- [SETUP.md](./SETUP.md) - Setup and deployment guide
- [DEPLOYMENT_WORKFLOW.md](./DEPLOYMENT_WORKFLOW.md) - Deployment workflow details

