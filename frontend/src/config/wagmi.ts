import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { moonbaseAlpha } from "wagmi/chains";

// CRITICAL: This app ONLY works on Moonbase Alpha Testnet (Chain ID: 1287)
// Chain ID 1284 is Moonbeam MAINNET - transactions there will FAIL and cost real GLMR!
export const wagmiConfig = getDefaultConfig({
	appName: "Tayeb Sharia DeFi",
	projectId: "your-walletconnect-project-id", // Get from WalletConnect Cloud
	chains: [moonbaseAlpha], // Chain ID: 1287 - TESTNET ONLY
	transports: {
		[moonbaseAlpha.id]: http("https://rpc.api.moonbase.moonbeam.network"),
	},
	ssr: false, // Ensure client-side only
});

// Export the testnet chain and chain ID for validation
export { moonbaseAlpha };
export const REQUIRED_CHAIN_ID = moonbaseAlpha.id; // 1287
export const REQUIRED_CHAIN_NAME = moonbaseAlpha.name; // "Moonbase Alpha"
