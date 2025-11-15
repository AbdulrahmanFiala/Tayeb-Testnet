# Deployment Workflow

> **Quick Start**: For a simple step-by-step setup guide, see [SETUP.md](./SETUP.md)

## Overview

Deployment is modular with focused scripts:
1. **Tokens** - Deploy MockERC20 tokens
2. **AMM Core** - Deploy Factory & Router
3. **Pairs** - Create liquidity pairs
4. **Minting** - Mint initial tokens
5. **Main Contracts** - Deploy ShariaCompliance, ShariaSwap, ShariaDCA

All scripts are idempotent and save addresses to `config/deployedContracts.json` and `config/tayebCoins.json`.

## Quick Start

### Option 1: Full Deployment (Recommended)
```bash
npm run deploy:testnet
```

Automatically runs all deployment scripts in order. All addresses are saved to JSON config files.

### Option 2: Manual Step-by-Step

**1. Deploy Tokens**
```bash
npm run deploy:tokens
```
Deploys all Initial Tayeb Coins (MockERC20) and saves addresses to JSON configs.

**2. Deploy AMM Core**
```bash
npm run deploy:amm-core
```
Deploys SimpleFactory, SimpleRouter, and WETH. Saves addresses to `deployedContracts.json`.

**3. Create Pairs**
```bash
npm run deploy:pairs
```
Creates liquidity pairs (each non-stablecoin with USDC, plus USDC/USDT pair).

**4. Mint Tokens**
```bash
npm run deploy:mint
```
Mints initial tokens to the deployer for testing.

**5. Deploy Main Contracts**
```bash
npm run deploy:core
```
Deploys ShariaCompliance, ShariaSwap, and ShariaDCA. Registers coins from JSON configs.

**6. Add Liquidity**
```bash
npx hardhat run scripts/liquidity/addLiquidity.ts --network moonbase
```
Adds liquidity to all pairs. Reads addresses from JSON configs automatically.

### Idempotent Deployment

All scripts are idempotent - they check for existing contracts and skip if already deployed. Safe to re-run.

### Coin Management

For detailed information on adding/removing coins and syncing JSON files, see [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#coin-management-workflow).

## Verification

```bash
npm run verify:all  # Requires ETHERSCAN_API_KEY in .env
```

Verifies all tokens, AMM contracts, main contracts, and liquidity pairs. Safe to run multiple times.
