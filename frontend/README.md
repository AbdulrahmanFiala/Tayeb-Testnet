# Tayeb Frontend - Sharia-Compliant DeFi Platform

A modern React + Vite + TypeScript frontend for the Tayeb DeFi platform with smart contract integration.

## 🎯 Features

- **Token Swap Interface** - Seamless token-to-token swaps integrated with ShariaSwap smart contracts
- **Token Listing** - Browse and search Sharia-compliant tokens with real-time data
- **Wallet Connection** - MetaMask and Web3 wallet integration
- **Real-time Quotes** - Dynamic swap price quotes from the smart contract
- **Responsive Design** - Mobile-friendly UI with Tailwind CSS
- **Dark Theme** - Modern dark interface with Sharia-compliant green accent colors

## 📦 Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **TypeScript** - Type-safe development
- **Ethers.js** - Web3 library for smart contract interaction
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - State management

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The dev server runs at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/           # React components
│   ├── TopNavBar.tsx    # Navigation bar with wallet connection
│   ├── SwapInterface.tsx # Token swap interface
│   └── TokenListing.tsx  # Token browser & listing
├── hooks/               # Custom React hooks
│   ├── useWallet.ts     # Wallet connection management
│   └── useShariaSwap.ts # Smart contract interaction
├── types/               # TypeScript type definitions
│   └── index.ts
├── config/              # Configuration files
│   ├── deployedContracts.json  # Contract addresses
│   └── halaCoins.json          # Token metadata
├── abis/                # Contract ABIs
│   └── ShariaSwap.json
└── utils/               # Utility functions
```

## 🔗 Smart Contract Integration

### Wallet Connection Hook

```typescript
import { useWallet } from "./hooks/useWallet";

function MyComponent() {
	const { account, signer, connectWallet, isConnected } = useWallet();

	return (
		<button onClick={connectWallet}>
			{isConnected ? `Connected: ${account}` : "Connect Wallet"}
		</button>
	);
}
```

### Swap Integration Hook

```typescript
import { useShariaSwap } from "./hooks/useShariaSwap";

function SwapComponent() {
	const { getSwapQuote, swapTokenForToken, loading } = useShariaSwap(signer);

	// Fetch quote
	const quote = await getSwapQuote(
		tokenInAddress,
		tokenOutAddress,
		amountInWei
	);

	// Execute swap
	await swapTokenForToken(
		tokenInAddress,
		tokenOutAddress,
		amountInWei,
		minAmountOutWei
	);
}
```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_RPC_URL=https://rpc.api.moonbase.moonbeam.network
VITE_NETWORK=moonbase
```

### Contract Addresses

Update `src/config/deployedContracts.json`:

```json
{
	"network": "moonbase",
	"main": {
		"shariaSwap": "0x...",
		"shariaCompliance": "0x...",
		"shariaDCA": "0x..."
	},
	"tokens": {
		"BTC": "0x...",
		"ETH": "0x..."
	}
}
```

### Token Metadata

Update `src/config/halaCoins.json` with token information including symbols, decimals, addresses, and Sharia compliance details.

## 🎨 Pages

### Home

- Welcome screen with quick action buttons
- Navigation to Swap and Token Listing

### Swap Interface

- Input amount to swap
- Select token pairs
- Real-time quote fetching
- Execute swap with gas estimation
- Transaction details and slippage tolerance

### Token Listing

- Browse all Sharia-compliant tokens
- Search by name or symbol
- Sort by name, price, or 24h change
- View token prices and compliance status
- Quick swap button for each token

### About

- Platform information
- Sharia-compliance details

## 🔐 Security Features

- Type-safe TypeScript throughout
- Ethers.js v6 for secure Web3 interaction
- Slippage protection on swaps
- Wallet connection validation
- Error handling and user feedback

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start dev server with HMR
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Type checking
npm run type-check   # Check TypeScript types
```

## 🌐 Network Configuration

Currently configured for **Moonbase Alpha** testnet:

- RPC: `https://rpc.api.moonbase.moonbeam.network`
- Chain ID: 1287
- Currency: DEV

Update `hardhat.config.ts` and environment variables for other networks.

## 📚 API Documentation

### Token Data Structure

```typescript
interface Token {
	symbol: string;
	name: string;
	decimals: number;
	description: string;
	complianceReason: string;
	addresses: {
		moonbase: string;
	};
	permissible: boolean;
}
```

### Smart Contract Methods

See `src/abis/ShariaSwap.json` for ABI and available contract methods:

- `swapTokenForToken()` - Swap between two tokens
- `swapGLMRForToken()` - Swap native gas token for a token
- `getSwapQuote()` - Get estimated output amount
- `isCompliant()` - Check if token is Sharia-compliant

## 🐛 Troubleshooting

### Wallet Not Connecting

- Ensure MetaMask is installed
- Check network is set to Moonbase Alpha
- Clear browser cache and reload

### Quote Fetch Errors

- Verify contract addresses in config
- Check if tokens are in the AMM pools
- Ensure sufficient liquidity

### Transaction Failures

- Check wallet balance
- Verify gas price and limits
- Ensure token approvals (for ERC20 swaps)

## 📖 Related Documentation

- [USAGE_EXAMPLES.md](../USAGE_EXAMPLES.md) - Smart contract usage examples
- [hardhat.config.ts](../hardhat.config.ts) - Network and contract configuration
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			// Other configs...

			// Remove tseslint.configs.recommended and replace with this
			tseslint.configs.recommendedTypeChecked,
			// Alternatively, use this for stricter rules
			tseslint.configs.strictTypeChecked,
			// Optionally, add this for stylistic rules
			tseslint.configs.stylisticTypeChecked,

			// Other configs...
		],
		languageOptions: {
			parserOptions: {
				project: ["./tsconfig.node.json", "./tsconfig.app.json"],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			// Other configs...
			// Enable lint rules for React
			reactX.configs["recommended-typescript"],
			// Enable lint rules for React DOM
			reactDom.configs.recommended,
		],
		languageOptions: {
			parserOptions: {
				project: ["./tsconfig.node.json", "./tsconfig.app.json"],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
]);
```
