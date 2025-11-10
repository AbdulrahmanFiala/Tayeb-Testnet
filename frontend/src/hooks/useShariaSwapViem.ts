import { useState } from "react";
import type { Address } from "viem";
import {
	useAccount,
	usePublicClient,
	useReadContract,
	useWriteContract,
} from "wagmi";
import { ERC20_ABI, ShariaSwapABI } from "../config/abis";
import deployedContracts from "../config/deployedContracts.json";

const SHARIA_SWAP_ADDRESS = (
	deployedContracts as unknown as { main: { shariaSwap: string } }
).main.shariaSwap as Address;

/**
 * Refactored swap hook using Wagmi v2 + Viem
 * Replaces the old useShariaSwap hook
 */
export function useShariaSwapViem() {
	const { address: userAddress } = useAccount();
	const { writeContract, isPending: isWriting } = useWriteContract();

	// Approve token spending
	const approveToken = (tokenAddress: Address, amount: bigint) => {
		if (!userAddress) throw new Error("Wallet not connected");

		writeContract({
			address: tokenAddress,
			abi: ERC20_ABI,
			functionName: "approve",
			args: [SHARIA_SWAP_ADDRESS, amount],
		});
	};

	// Execute swap token for token
	const swapTokenForToken = (
		tokenIn: Address,
		tokenOut: Address,
		amountIn: bigint,
		minAmountOut: bigint
	) => {
		const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 15);

		writeContract({
			address: SHARIA_SWAP_ADDRESS,
			abi: ShariaSwapABI,
			functionName: "swapTokenForToken",
			args: [tokenIn, tokenOut, amountIn, minAmountOut, deadline],
		});
	};

	// Swap GLMR for token
	const swapGLMRForToken = (
		tokenOut: Address,
		minAmountOut: bigint,
		amountIn: bigint
	) => {
		const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 15);

		writeContract({
			address: SHARIA_SWAP_ADDRESS,
			abi: ShariaSwapABI,
			functionName: "swapGLMRForToken",
			args: [tokenOut, minAmountOut, deadline],
			value: amountIn,
		});
	};

	return {
		approveToken,
		swapTokenForToken,
		swapGLMRForToken,
		isApproving: isWriting,
		isSwapping: isWriting,
		isSwappingGLMR: isWriting,
		SHARIA_SWAP_ADDRESS,
	};
}

/**
 * Custom hook for reading swap quote (Wagmi v2)
 */
export function useSwapQuote(
	tokenIn: Address | `0x${string}` | undefined,
	tokenOut: Address | `0x${string}` | undefined,
	amountIn: bigint | undefined
) {
	const { data: quote, isLoading } = useReadContract({
		address: SHARIA_SWAP_ADDRESS,
		abi: ShariaSwapABI,
		functionName: "getSwapQuote",
		args:
			tokenIn && tokenOut && amountIn
				? [tokenIn as Address, tokenOut as Address, amountIn]
				: undefined,
		query: {
			enabled: !!(tokenIn && tokenOut && amountIn),
		},
	});

	return { quote: quote as bigint | undefined, isLoading };
}

/**
 * Manual quote fetching hook - Fixed version
 */
export function useManualSwapQuote() {
	const publicClient = usePublicClient();
	const [isLoading, setIsLoading] = useState(false);

	const fetchQuote = async (
		tokenIn: Address | `0x${string}`,
		tokenOut: Address | `0x${string}`,
		amountIn: bigint
	): Promise<bigint | null> => {
		if (!publicClient) {
			console.error("❌ Public client not available");
			return null;
		}

		if (!tokenIn || !tokenOut || !amountIn || amountIn === 0n) {
			console.warn("⚠️ Invalid quote parameters", {
				tokenIn,
				tokenOut,
				amountIn: amountIn?.toString(),
			});
			return null;
		}

		// ✅ Validate addresses are proper format
		const isValidAddress = (addr: string): boolean => {
			return /^0x[0-9a-fA-F]{40}$/.test(addr);
		};

		if (!isValidAddress(tokenIn) || !isValidAddress(tokenOut)) {
			console.error("❌ Invalid token addresses", { tokenIn, tokenOut });
			return null;
		}

		// ✅ Check if tokenIn and tokenOut are the same
		if (tokenIn.toLowerCase() === tokenOut.toLowerCase()) {
			console.error("❌ tokenIn and tokenOut cannot be the same");
			return null;
		}

		try {
			setIsLoading(true);

			console.log("📝 Fetching quote with params:", {
				contract: SHARIA_SWAP_ADDRESS,
				tokenIn,
				tokenOut,
				amountIn,
			});

			// ✅ Direct contract read call
			const quote = (await publicClient.readContract({
				address: SHARIA_SWAP_ADDRESS,
				abi: ShariaSwapABI,
				functionName: "getSwapQuote",
				args: [tokenIn as Address, tokenOut as Address, amountIn],
			})) as bigint;

			console.log("✅ Quote fetched successfully:", quote.toString());
			return quote;
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : String(err);
			console.error("❌ Quote fetch error:", {
				error: errorMsg,
				errorCode: err instanceof Error && "code" in err ? err.code : "unknown",
				details: err,
			});

			// ✅ More helpful error messages
			if (errorMsg.includes("QuoteAmountTooSmall")) {
				console.error(
					"💡 QuoteAmountTooSmall: No liquidity for this token pair. Try swapping through USDC instead."
				);
			} else if (errorMsg.includes("0xbb55fd27")) {
				console.error(
					"💡 Error 0xbb55fd27: Usually indicates insufficient liquidity or invalid token pair"
				);
			} else if (errorMsg.includes("reverted")) {
				console.error(
					"💡 Contract reverted. Check if tokens are listed and have liquidity pools"
				);
			}

			return null;
		} finally {
			setIsLoading(false);
		}
	};

	return { isLoading, fetchQuote };
}
