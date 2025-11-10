# Frontend Setup Guide

This guide walks you through setting up and running the Tayeb DeFi frontend.

## Prerequisites

- Node.js 18+
- npm or yarn
- MetaMask or Web3 wallet browser extension
- Moonbase Alpha testnet tokens (DEV)

## Installation Steps

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env.local
```

The default configuration uses Moonbase Alpha testnet. For other networks, update:

- `VITE_RPC_URL` - RPC endpoint
- `VITE_NETWORK` - Network name
- `VITE_CHAIN_ID` - Chain ID

### 3. Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Connect Wallet

1. Install MetaMask browser extension
2. Add Moonbase Alpha network (if not already added):
   - Network Name: Moonbase Alpha
   - RPC URL: `https://rpc.api.moonbase.moonbeam.network`
   - Chain ID: 1287
   - Currency: DEV
3. Click "Connect Wallet" button in the app
4. Approve the connection in MetaMask

### 5. Get Testnet Tokens

Get free DEV tokens from the Moonbase Alpha faucet:
https://faucet.moonbeam.network

## Available Commands

### Development

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

### Type Checking

```bash
npm run type-check  # Check TypeScript types
```

## Project Structure

```
src/
├── App.tsx                 # Main app component with routing
├── App.css                 # App styles
├── main.tsx                # Entry point
├── index.css               # Global styles
├── components/             # React components
│   ├── TopNavBar.tsx       # Navigation & wallet connection
│   ├── SwapInterface.tsx   # Token swap UI
│   └── TokenListing.tsx    # Token browser
├── hooks/                  # Custom hooks
│   ├── useWallet.ts        # Wallet management
│   └── useShariaSwap.ts    # Contract interaction
├── types/                  # TypeScript types
├── config/                 # Configuration
│   ├── deployedContracts.json
│   └── halaCoins.json
└── abis/                   # Contract ABIs
    └── ShariaSwap.json
```

## Features

### Home Page

- Welcome screen
- Quick links to Swap and Token Listing
- Platform introduction

### Swap Interface

- Input and output token selection
- Real-time price quotes from smart contract
- Swap execution with MetaMask
- Gas estimation and transaction details
- Slippage tolerance settings

### Token Listing

- Browse all Sharia-compliant tokens
- Search by name or symbol
- Sort by name, price, or 24-hour change
- Individual token statistics
- Quick swap access for each token

### Wallet Integration

- MetaMask connection
- Automatic wallet detection
- Account display in nav bar
- Disconnect functionality

## Smart Contract Integration

The frontend is fully integrated with the Tayeb smart contracts:

### ShariaSwap Contract

- Token-to-token swaps
- Native gas token (GLMR) swaps
- Real-time quote generation
- Compliance checking

### Supported Tokens

Tokens from `halaCoins.json`:

- BTC, ETH, USDT, XRP, BNB, SOL
- USDC, TRX, ADA, LINK, HBAR
- And more Sharia-compliant tokens

## Configuration Files

### deployedContracts.json

Contract addresses on Moonbase Alpha:

```json
{
  "main": {
    "shariaSwap": "0x4CCdF1d72d4a44dE8978b82C8F496432cFb6c86a",
    "shariaCompliance": "0xA8e77D21C8145730Aadfc5cc1bfedF94F1ba2099",
    "shariaDCA": "0x0102A82d11BA01811D851a5e8A2E94F561Cb8329"
  },
  "tokens": { ... },
  "pairs": { ... }
}
```

### halaCoins.json

Token metadata including:

- Symbol, name, decimals
- Addresses by network
- Compliance reason
- Permissible flag

## Troubleshooting

### Wallet Connection Issues

**Problem**: MetaMask window doesn't appear

**Solution**:

1. Ensure MetaMask extension is installed
2. Check browser console for errors
3. Try in incognito mode
4. Clear browser cache

### Network Configuration

**Problem**: Wrong network error

**Solution**:

1. Make sure MetaMask is set to Moonbase Alpha
2. Add network if it's not in MetaMask:
   - Open MetaMask → Settings → Networks
   - Click "Add Network"
   - Fill in Moonbase details (see Installation Step 4)
3. Switch to Moonbase Alpha network

### Quote Fetch Errors

**Problem**: "Failed to fetch quote"

**Solution**:

1. Check contract addresses in `deployedContracts.json`
2. Verify tokens exist in the liquidity pool
3. Check console for detailed error messages
4. Ensure sufficient token liquidity

### Transaction Failures

**Problem**: Swap transaction fails

**Solution**:

1. Verify wallet balance is sufficient
2. Check gas price settings
3. Ensure token approvals (for ERC20 → ERC20 swaps)
4. Check slippage tolerance is reasonable
5. Review contract compliance requirements

## Development Tips

### Hot Reload

Changes to React components automatically reload in the browser thanks to Vite's HMR.

### Type Safety

Use TypeScript for type checking:

```bash
npm run type-check
```

### Environment Variables

Access with `import.meta.env.VITE_*`:

```typescript
const rpcUrl = import.meta.env.VITE_RPC_URL;
```

### Component Reusability

Key reusable components:

- `<TopNavBar>` - Navigation and wallet
- `<SwapInterface>` - Swap functionality
- `<TokenListing>` - Token browser

## Deployment

### Build for Production

```bash
npm run build
```

This creates optimized files in the `dist/` directory.

### Deployment Platforms

- **Vercel**: `vercel deploy`
- **Netlify**: Connect GitHub repository
- **IPFS**: Upload `dist/` folder
- **Traditional Server**: Serve `dist/` folder via HTTP server

### Environment for Production

Update for your production network:

```env
VITE_RPC_URL=https://your-mainnet-rpc
VITE_NETWORK=mainnet
VITE_CHAIN_ID=1287
```

## Next Steps

1. ✅ Install and run locally
2. ✅ Connect MetaMask wallet
3. ✅ Explore Token Listing page
4. ✅ Try a test swap
5. 📖 Read USAGE_EXAMPLES.md for advanced integration
6. 🚀 Deploy to production

## Support & Documentation

- **Main README**: `../README.md`
- **Usage Examples**: `../USAGE_EXAMPLES.md`
- **Smart Contracts**: `../contracts/`
- **Ethers.js Docs**: https://docs.ethers.org/
- **React Docs**: https://react.dev/

## License

See LICENSE file in the root directory.
