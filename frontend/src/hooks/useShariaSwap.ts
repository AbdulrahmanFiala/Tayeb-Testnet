import { useState } from "react";
import type { Address } from "viem";
import {
	useAccount,
	usePublicClient,
	useReadContract,
	useWriteContract,
	useWaitForTransactionReceipt,
} from "wagmi";
import { ERC20_ABI, ShariaSwapABI } from "../config/abis";
import deployedContracts from "../../../config/deployedContracts.json";
import { getTokenDecimals } from "../config/tokenDecimals";
import type { TransactionStatus } from "../types";

const SHARIA_SWAP_ADDRESS = (
	deployedContracts as unknown as { main: { shariaSwap: string } }
).main.shariaSwap as Address;

/**
 * Refactored swap hook using Wagmi v2 + Viem with transaction tracking
 */
export function useShariaSwap() {
	const { address: userAddress } = useAccount();
	const publicClient = usePublicClient();
	const { 
		writeContract, 
		isPending: isWriting,
		data: txHash,
		error: writeError,
		reset: resetWrite,
	} = useWriteContract();

	// Wait for transaction confirmation
	const {
		isLoading: isConfirming,
		isSuccess: isConfirmed,
		isError: isConfirmError,
		error: confirmError,
	} = useWaitForTransactionReceipt({
		hash: txHash,
	});

	// Calculate transaction status
	const getTransactionStatus = (): TransactionStatus => {
		if (isWriting || isConfirming) return "pending";
		if (isConfirmed) return "success";
		if (writeError || isConfirmError) return "error";
		return "idle";
	};

	// Estimate gas for transaction
	const estimateSwapGas = async (
		tokenIn: Address,
		tokenOut: Address,
		amountIn: bigint,
		minAmountOut: bigint
	): Promise<bigint | null> => {
		if (!publicClient || !userAddress) return null;

		try {
			const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 15);
			
			const gasEstimate = await publicClient.estimateContractGas({
				address: SHARIA_SWAP_ADDRESS,
				abi: ShariaSwapABI,
				functionName: "swapShariaCompliant",
				args: [tokenIn, tokenOut, amountIn, minAmountOut, deadline],
				account: userAddress,
			});

			return gasEstimate;
		} catch (err) {
			console.error("Failed to estimate gas:", err);
			return null;
		}
	};

	// Approve token spending
	const approveToken = async (tokenAddress: Address, amount: bigint) => {
		if (!userAddress) throw new Error("Wallet not connected");

		return writeContract({
			address: tokenAddress,
			abi: ERC20_ABI,
			functionName: "approve",
			args: [SHARIA_SWAP_ADDRESS, amount],
		});
	};

	// Execute swap token for token
	const swapTokenForToken = async (
		tokenIn: Address,
		tokenOut: Address,
		amountIn: bigint,
		minAmountOut: bigint
	) => {
		const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 15);

		return writeContract({
			address: SHARIA_SWAP_ADDRESS,
			abi: ShariaSwapABI,
			functionName: "swapShariaCompliant",
			args: [tokenIn, tokenOut, amountIn, minAmountOut, deadline],
		});
	};

	// Swap GLMR for token
	const swapGLMRForToken = async (
		tokenOut: Address,
		minAmountOut: bigint,
		amountIn: bigint
	) => {
		const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 15);

		return writeContract({
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
		estimateSwapGas,
		isApproving: isWriting,
		isSwapping: isWriting,
		isSwappingGLMR: isWriting,
		isConfirming,
		isConfirmed,
		txHash,
		transactionStatus: getTransactionStatus(),
		error: writeError || confirmError,
		reset: resetWrite,
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
		amountIn: bigint,
		tokenInSymbol?: string,
		tokenOutSymbol?: string
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

			// ✅ Log decimals if symbols are provided
			const decimalsIn = tokenInSymbol ? getTokenDecimals(tokenInSymbol) : 18;
			const decimalsOut = tokenOutSymbol
				? getTokenDecimals(tokenOutSymbol)
				: 18;

			console.log("📝 Fetching quote with params:", {
				contract: SHARIA_SWAP_ADDRESS,
				tokenIn,
				tokenOut,
				amountIn,
				tokenInSymbol,
				decimalsIn,
				tokenOutSymbol,
				decimalsOut,
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
