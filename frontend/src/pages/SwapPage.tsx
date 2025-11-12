import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { formatUnits, parseUnits } from "viem";
import halaCoinsData from "../../../config/halaCoins.json";
import { TokenInput } from "../components/TokenInput";
import { useShariaCompliance } from "../hooks/useShariaCompliance";
import { useManualSwapQuote, useShariaSwap } from "../hooks/useShariaSwap";
import { useWallet } from "../hooks/useWallet";
import type { Token } from "../types";

export function SwapPage() {
	const [searchParams] = useSearchParams();
	const tokenInParam = searchParams.get("tokenIn");
	const { isConnected } = useWallet();
	const { swapTokenForToken, isSwapping } = useShariaSwap();
	const { coins, coinsLoading, coinsError } = useShariaCompliance();
	const { isLoading: quoteLoading, fetchQuote } = useManualSwapQuote();

	const [tokenIn, setTokenIn] = useState<Token | null>(null);
	const [tokenOut, setTokenOut] = useState<Token | null>(null);
	const [amountIn, setAmountIn] = useState<string>("");
	const [amountOut, setAmountOut] = useState<number | null>(null);
	const [error, setError] = useState<string | null>(null);
	const slippageTolerance = useMemo(
		() => tokenOut?.avgSlippagePercent ?? 5,
		[tokenOut]
	);

	// Format tokens: merge smart contract data with halaCoins.json metadata
	const tokens: Token[] = (coins || []).map((coin) => {
		// Find matching coin metadata from halaCoins.json
		const halaCoins = (
			halaCoinsData as {
				coins: Array<{
					symbol: string;
					decimals: number;
					avgSlippagePercent: number;
				}>;
			}
		).coins;
		const coinMetadata = halaCoins.find(
			(c: { symbol: string; decimals: number; avgSlippagePercent: number }) =>
				c.symbol.toLowerCase() === coin.symbol.toLowerCase()
		);

		return {
			symbol: coin.symbol,
			name: coin.name,
			// Use decimals from halaCoins.json; default to 18
			decimals: coinMetadata?.decimals ?? 18,
			description: coin.complianceReason,
			complianceReason: coin.complianceReason,
			addresses: { moonbase: coin.tokenAddress },
			permissible: coin.verified,
			// Include avgSlippagePercent from halaCoins.json
			avgSlippagePercent: coinMetadata?.avgSlippagePercent,
		};
	});

	// Initialize token selections when tokens load
	useEffect(() => {
		if (tokens.length > 0 && !tokenIn) {
			// If tokenInParam is provided, try to find and select that token
			if (tokenInParam) {
				const selectedToken = tokens.find(
					(t) => t.symbol.toUpperCase() === tokenInParam.toUpperCase()
				);
				if (selectedToken) {
					setTokenIn(selectedToken);
					// Set tokenOut to the second token if available
					const secondToken = tokens.find(
						(t) => t.symbol.toUpperCase() !== tokenInParam.toUpperCase()
					);
					setTokenOut(secondToken || tokens[1] || null);
					return;
				}
			}
			// Default behavior: first two tokens
			setTokenIn(tokens[0]);
			setTokenOut(tokens.length > 1 ? tokens[1] : null);
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tokens.length, tokenInParam]);

	const handleTokenInChange = (selected: Token) => {
		if (!selected) return;
		if (
			tokenOut &&
			selected.addresses.moonbase === tokenOut.addresses.moonbase
		) {
			const tempToken = tokenIn;
			setTokenIn(selected);
			setTokenOut(tempToken);
			handleAmountChange(amountIn);
			return;
		}
		setTokenIn(selected);
	};

	const handleTokenOutChange = (selected: Token) => {
		if (!selected) return;
		if (tokenIn && selected.addresses.moonbase === tokenIn.addresses.moonbase) {
			const tempToken = tokenOut;
			setTokenOut(selected);
			setTokenIn(tempToken);
			handleAmountChange(amountIn);
			return;
		}
		setTokenOut(selected);
	};

	// Fetch quote on amount change
	const handleAmountChange = async (value: string) => {
		setAmountIn(value);

		// Clear output if input is empty or invalid
		if (!value || value === "" || isNaN(parseFloat(value))) {
			setAmountOut(null);
			return;
		}

		// Trigger quote fetch on amount change
		if (parseFloat(value) > 0 && tokenIn && tokenOut) {
			const decimalsIn = tokenIn.decimals ?? 18;
			const decimalsOut = tokenOut.decimals ?? 18;

			const amountInWei = parseUnits(value, decimalsIn);
			const quote = await fetchQuote(
				tokenIn.addresses.moonbase as `0x${string}`,
				tokenOut.addresses.moonbase as `0x${string}`,
				amountInWei,
				tokenIn.symbol,
				tokenOut.symbol
			);

			if (quote) {
				const formatted = Number(formatUnits(quote, decimalsOut));
				setAmountOut(formatted);
			}
		} else {
			setAmountOut(null);
		}
	};

	// ✅ NEW: Fetch quote on token swap
	// const swapTokens = async () => {
	// 	// capture current values to avoid relying on state updates
	// 	const currentIn = tokenIn;
	// 	const currentOut = tokenOut;
	// 	const currentAmountIn = amountIn;
	// 	const currentAmountOut = amountOut;

	// 	// swap UI state
	// 	setTokenIn(currentOut);
	// 	setTokenOut(currentIn);
	// 	setAmountIn(currentAmountOut);
	// 	setAmountOut(currentAmountIn);

	// 	// Refetch quote for swapped tokens using captured values
	// 	if ((currentAmountOut as number) > 0 && currentOut && currentIn) {
	// 		const decimalsIn = currentOut.decimals ?? 18;
	// 		const decimalsOut = currentIn.decimals ?? 18;

	// 		const amountInWei = parseUnits(
	// 			(currentAmountOut as number).toString(),
	// 			decimalsIn
	// 		);
	// 		const quote = await fetchQuote(
	// 			currentOut.addresses.moonbase as `0x${string}`,
	// 			currentIn.addresses.moonbase as `0x${string}`,
	// 			amountInWei,
	// 			currentOut.symbol,
	// 			currentIn.symbol
	// 		);

	// 		if (quote) {
	// 			const formatted = Number(formatUnits(quote, decimalsOut));
	// 			setAmountOut(formatted);
	// 		}
	// 	}
	// };

	const handleSwap = async () => {
		if (!amountIn || !tokenIn || !tokenOut || !isConnected) {
			setError("Please fill in all fields and connect wallet");
			return;
		}

		if (parseFloat(amountIn) <= 0 || isNaN(parseFloat(amountIn))) {
			setError("Please enter a valid amount");
			return;
		}

		try {
			setError(null);
			const amountInWei = parseUnits(amountIn, tokenIn.decimals);
			const amountOutWei = parseUnits(
				(amountOut as number)?.toString(),
				tokenOut.decimals
			);
			// Use avgSlippagePercent from token data; fallback to 5%
			const slippagePercent = tokenOut.avgSlippagePercent ?? 5;
			const minAmountOut =
				(amountOutWei * BigInt(100 - slippagePercent)) / 100n;

			await swapTokenForToken(
				tokenIn.addresses.moonbase as `0x${string}`,
				tokenOut.addresses.moonbase as `0x${string}`,
				amountInWei,
				minAmountOut
			);

			setAmountIn("");
			setAmountOut(null);
			alert("Swap successful!");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Swap failed";
			setError(message);
			console.error("Swap error:", err);
		}
	};

	const exchangeRate =
		amountIn && amountOut && parseFloat(amountIn) > 0
			? (amountOut / parseFloat(amountIn)).toFixed(6)
			: "0";
	// const estimatedGas = "0.0042"; // Placeholder

	return (
		<main className='flex flex-1 justify-center py-10 sm:py-16 px-4'>
				<div className='flex flex-col w-full max-w-lg'>
				<h1 className='text-white tracking-light text-[32px] font-bold leading-tight text-center pb-6'>
					Swap Tokens
				</h1>

				{/* Loading State */}
				{coinsLoading && (
					<div className='mb-4 p-4 bg-blue-500/10 border border-blue-500 rounded-lg text-blue-500 text-sm text-center'>
						Loading tokens from smart contract...
					</div>
				)}

				{/* Token Error State */}
				{coinsError && (
					<div className='mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm'>
						Error: {coinsError.message || "Failed to load tokens"}
					</div>
				)}

				{/* Swap Error State */}
				{error && (
					<div className='mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500 text-sm'>
						{error}
					</div>
				)}

				{/* Main Swap Card */}
				{!coinsLoading && !coinsError && tokens.length > 0 && (
					<div className='bg-[#1a3a2f] p-4 sm:p-6 rounded-xl border border-solid border-[#23483c] shadow-lg'>
						{/* From Token Section */}
						<TokenInput
							label='You Pay'
							value={amountIn}
							onChange={handleAmountChange}
							token={tokenIn}
							tokens={tokens}
							onTokenChange={handleTokenInChange}
						/>
						{/* Swap Direction Button */}
						{/* <div className='flex justify-center items-center h-0 z-10 relative'>
							<button
								onClick={swapTokens}
								className='flex items-center justify-center size-12 bg-[#23483c] border-4 border-solid border-[#1a3a2f] rounded-full text-primary hover:bg-[#2c5a4b] transition-colors'
							>
								<span className='material-symbols-outlined'>
									arrow_downward
								</span>
							</button>
						</div> */}
						{/* To Token Section */}
						<TokenInput
							label='You Receive'
							value={amountOut ? Number(amountOut).toFixed(5) : ""}
							readOnly
							token={tokenOut}
							tokens={tokens}
							onTokenChange={handleTokenOutChange}
						/>
						<div className='pt-4'>
							<button
								onClick={handleSwap}
								disabled={
									isSwapping ||
									quoteLoading ||
									!amountIn ||
									parseFloat(amountIn) <= 0 ||
									isNaN(parseFloat(amountIn))
								}
								className='flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-5 bg-primary text-background-dark text-lg font-bold leading-normal tracking-wide hover:opacity-90 transition-opacity disabled:opacity-20 disabled:cursor-not-allowed'
							>
								{isSwapping ? "..." : "Swap"}
							</button>
						</div>
					</div>
				)}

				{/* Details */}
				{!coinsLoading && !coinsError && tokens.length > 0 && (
					<div className='mt-4 p-4 text-sm text-white/70 space-y-2'>
						<div className='flex justify-between items-center'>
							<span>Exchange Rate</span>
							<span className='text-primary/80'>${exchangeRate}</span>
						</div>
						{/* <div className='flex justify-between items-center'>
							<span>Estimated Gas Fee</span>
							<span>${estimatedGas}</span>
						</div> */}
						<div className='flex justify-between items-center'>
							<span>Slippage Tolerance</span>
							<span className='text-primary/80'>{slippageTolerance}%</span>
						</div>
					</div>
				)}

				{/* No tokens error message */}
				{!coinsLoading && tokens.length === 0 && (
					<div className='mb-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg text-yellow-500 text-sm text-center'>
						No tokens available. Make sure you&apos;re connected to Moonbase
						Alpha.
					</div>
				)}
			</div>
		</main>
	);
}
