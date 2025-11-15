# Tayeb Setup Guide - Moonbase Alpha Testnet

## 🚀 Get Started in 5 Minutes

Deploy the Sharia-compliant DeFi platform on Moonbase Alpha testnet with custom AMM.

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and add your private key. To get your private key from MetaMask:
1. Open MetaMask → Account details → Export Private Key
2. Enter password and copy the key (starts with `0x`)

⚠️ **IMPORTANT**: Never commit your `.env` file or share your private key!

### 3. Get Testnet Tokens

Get free DEV tokens from https://faucet.moonbeam.network/

### 4. Compile Contracts

```bash
npm run compile
```

### 5. Run Tests

```bash
npm test
```

For detailed testing information, see [TESTING.md](./TESTING.md).

### 6. Deploy to Testnet

```bash
npm run deploy:testnet
```

This automatically deploys all contracts (AMM, tokens, main contracts) and saves addresses to JSON configs.

For detailed deployment workflow, see [DEPLOYMENT_WORKFLOW.md](./DEPLOYMENT_WORKFLOW.md).

### 7. Add Liquidity (Required)

```bash
npx hardhat run scripts/liquidity/addLiquidity.ts --network moonbase
```

Adds liquidity to all pairs. Reads addresses from JSON configs automatically.

## 🔍 Verify Contracts (Optional)

For detailed verification instructions, see [DEPLOYMENT_WORKFLOW.md](./DEPLOYMENT_WORKFLOW.md#verification).

Quick command:
```bash
npm run verify:all  # Requires ETHERSCAN_API_KEY in .env
```

## 🖥️ Frontend Setup

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Moonbase Alpha testnet tokens (DEV)

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Frontend Environment

Frontend automatically reads contract addresses from `config/deployedContracts.json` and `config/tayebCoins.json`. No configuration needed after deployment.

For custom environment variables, copy `.env.example` to `.env.local`.

### 3. Start Development Server

```bash
npm run dev
```

Opens at http://localhost:5173

### 4. Connect Wallet

1. Install MetaMask extension
2. Add Moonbase Alpha network (RPC: `https://rpc.api.moonbase.moonbeam.network`, Chain ID: 1287)
3. Connect wallet in app
4. Get testnet tokens from https://faucet.moonbeam.network/ if needed

### Available Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run type-check  # Check TypeScript types
```

### Frontend Troubleshooting

**Common Issues:**
- **MetaMask not appearing**: Ensure extension is installed, check browser console
- **Wrong network**: Switch MetaMask to Moonbase Alpha (Chain ID: 1287)
- **Quote fetch errors**: Check contract addresses in `deployedContracts.json`, verify liquidity exists
- **Transaction failures**: Verify wallet balance, check gas settings, ensure token approvals

### Frontend Development Tips

- **Hot Reload**: Vite's HMR automatically reloads changes
- **Type Checking**: `npm run type-check` (in frontend directory)
- **Environment Variables**: Access with `import.meta.env.VITE_*`

### Frontend Deployment

Build for production:
```bash
cd frontend
npm run build
```

Deploy to Vercel, Netlify, IPFS, or any static hosting service.

For advanced frontend integration examples, see [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md).

## 🧪 Testing

For detailed testing information, see [TESTING.md](./TESTING.md).

Quick start:
```bash
npm test
```