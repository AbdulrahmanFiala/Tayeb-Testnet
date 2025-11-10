import {
	useAccount,
	useChainId,
	useConnect,
	useDisconnect,
	useSwitchChain,
} from "wagmi";
import { moonbaseAlpha } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * Refactored wallet hook using Wagmi v2
 * Replaces the old ethers-based useWallet hook
 */
export function useWalletViem() {
	const { address, isConnected, chain } = useAccount();
	const chainId = useChainId();
	const { switchChain } = useSwitchChain();
	const { connect } = useConnect();
	const { disconnect } = useDisconnect();

	// Check if on Moonbase Alpha testnet
	const isOnMoonbaseAlpha = chainId === moonbaseAlpha.id;

	// Connect wallet (MetaMask)
	const connectWallet = () => {
		connect({ connector: injected() });
	};

	// Switch to Moonbase Alpha if not already on it
	const switchToMoonbaseAlpha = () => {
		if (!isOnMoonbaseAlpha && switchChain) {
			switchChain({ chainId: moonbaseAlpha.id });
		}
	};

	// Disconnect wallet
	const disconnectWallet = () => {
		disconnect();
	};

	return {
		address,
		isConnected,
		chainId,
		chain,
		isOnMoonbaseAlpha,
		connectWallet,
		switchToMoonbaseAlpha,
		disconnectWallet,
	};
}
