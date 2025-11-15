# Configuration Files

This directory contains centralized configuration files for the Tayeb platform. These files are used by both backend deployment scripts and the frontend application.

## Files

### `tayebCoins.json`
Single source of truth for all coins configuration. Defines coins with metadata (symbol, name, decimals, compliance reason), stores token addresses, and includes `permissible` flag that syncs with contract's `verified` status.

### `deployedContracts.json`
Stores all deployed contract addresses (AMM + Main contracts). Contains Factory, Router, WETH, token addresses, pair addresses, and main contract addresses. Includes deployment metadata.

### `types.ts`
TypeScript type definitions. Defines interfaces for `TayebCoin`, `TayebCoinsConfig`, `DeployedContracts` and provides helper functions.

### `chainConfig.json`
Network-specific configuration. Contains block time settings for moonbase, moonbeam, and hardhat networks.

## Frontend Integration

The frontend automatically reads these config files. No manual configuration needed after deployment.

For code examples, see [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#post-deployment-setup).

## Coin Management Workflow

For detailed instructions on adding/removing coins, syncing JSON files, and managing the coin registry, see [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#coin-management-workflow).

## How Scripts Update Config Files

- **`deploy-tokens.ts`**: Deploys tokens, updates both JSON files with token addresses
- **`deploy-amm-core.ts`**: Deploys Factory/Router, updates `deployedContracts.json`
- **`create-pairs.ts`**: Creates pairs, updates `deployedContracts.json` with pair addresses
- **`deploy-core.ts`**: Deploys main contracts, registers coins, updates `deployedContracts.json`
- **`sync-coins-from-contract.ts`**: Syncs both JSON files from contract state (`npm run sync:coins`)
- **`listen-coin-events.ts`**: Auto-syncs JSON files when contract events occur

## Script Usage

**Sync coins from contract:**
```bash
npm run sync:coins
```

**Listen to coin events (auto-sync):**
```bash
npx hardhat run scripts/automation/listen-coin-events.ts --network moonbase
```

For detailed coin management workflow and usage, see [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md#coin-management-workflow).

## Important Notes

- **Contract is Source of Truth**: ShariaCompliance contract is authoritative. Sync JSON files from contract, don't edit manually.
- **Frontend Auto-Reads**: Frontend automatically imports JSON files - no manual configuration needed.
- **Type Safety**: Use `types.ts` for TypeScript type definitions.
- **Idempotent Scripts**: All scripts check for existing addresses before updating - safe to re-run.

