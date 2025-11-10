import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { TokenInput } from "../components/TokenInput";
import { useShariaComplianceViem } from "../hooks/useShariaComplianceViem";
import {
	useManualSwapQuote,
	useShariaSwapViem,
} from "../hooks/useShariaSwapViem";
import { useWalletViem } from "../hooks/useWalletViem";
import type { Token } from "../types";

export function SwapPage() {
	const { isConnected } = useWalletViem();
	const { swapTokenForToken, isSwapping } = useShariaSwapViem();
	const { coins, coinsLoading, coinsError } = useShariaComplianceViem();
	const { isLoading: quoteLoading, fetchQuote } = useManualSwapQuote(); // ✅ NEW

	const [tokenIn, setTokenIn] = useState<Token | null>(null);
	const [tokenOut, setTokenOut] = useState<Token | null>(null);
	const [amountIn, setAmountIn] = useState<number>(0);
	const [amountOut, setAmountOut] = useState<number>(0);
	const [error, setError] = useState<string | null>(null);

	// Format tokens from smart contract data
	const tokens: Token[] = (coins || []).map((coin) => ({
		symbol: coin.symbol,
		name: coin.name,
		decimals: 18,
		description: coin.complianceReason,
		complianceReason: coin.complianceReason,
		addresses: { moonbase: coin.tokenAddress },
		permissible: coin.verified,
	}));

	// Initialize token selections when tokens load
	useEffect(() => {
		if (tokens.length > 0 && !tokenIn) {
			setTokenIn(tokens[0]);
			setTokenOut(tokens.length > 1 ? tokens[1] : null);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tokens.length]);

	// ✅ NEW: Fetch quote on specific event (amount input change)
	const handleAmountChange = async (value: number) => {
		setAmountIn(value);

		// Trigger quote fetch on amount change
		if (value > 0 && tokenIn && tokenOut) {
			const amountInWei = parseUnits(value.toString(), 18);
			const quote = await fetchQuote(
				tokenIn.addresses.moonbase as `0x${string}`,
				tokenOut.addresses.moonbase as `0x${string}`,
				amountInWei
			);

			if (quote) {
				const formatted = Number(formatUnits(quote, 18));
				setAmountOut(formatted);
			}
		} else {
			setAmountOut(0);
		}
	};

	// ✅ NEW: Fetch quote on token swap
	const swapTokens = async () => {
		const temp = tokenIn;
		setTokenIn(tokenOut);
		setTokenOut(temp);
		const tempAmount = amountIn;
		setAmountIn(amountOut);
		setAmountOut(tempAmount);

		// Refetch quote with swapped tokens
		if (amountOut > 0 && tokenOut && tokenIn) {
			const amountInWei = parseUnits(amountOut.toString(), 18);
			const quote = await fetchQuote(
				tokenOut.addresses.moonbase as `0x${string}`,
				tokenIn.addresses.moonbase as `0x${string}`,
				amountInWei
			);

			if (quote) {
				const formatted = Number(formatUnits(quote, 18));
				setAmountOut(formatted);
			}
		}
	};

	const handleSwap = async () => {
		if (!amountIn || !tokenIn || !tokenOut || !isConnected) {
			setError("Please fill in all fields and connect wallet");
			return;
		}

		try {
			setError(null);
			const amountInWei = parseUnits(amountIn.toString(), tokenIn.decimals);
			const amountOutWei = parseUnits(amountOut.toString(), tokenOut.decimals);
			const minAmountOut = (amountOutWei * 95n) / 100n; // 5% slippage

			await swapTokenForToken(
				tokenIn.addresses.moonbase as `0x${string}`,
				tokenOut.addresses.moonbase as `0x${string}`,
				amountInWei,
				minAmountOut
			);

			setAmountIn(0);
			setAmountOut(0);
			alert("Swap successful!");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Swap failed";
			setError(message);
			console.error("Swap error:", err);
		}
	};

	const exchangeRate =
		amountIn && amountOut ? (amountOut / amountIn).toFixed(2) : "0";
	const estimatedGas = "0.0042"; // Placeholder

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
							value={amountIn.toString()}
							onChange={(value) => handleAmountChange(Number(value))}
							token={tokenIn}
							tokens={tokens}
							onTokenChange={setTokenIn}
							balance='0.00'
						/>
						{/* Swap Direction Button */}
						<div className='flex justify-center items-center h-1 z-10 relative'>
							<button
								onClick={swapTokens}
								className='flex items-center justify-center size-12 bg-[#23483c] border-4 border-solid border-[#1a3a2f] rounded-full text-primary hover:bg-[#2c5a4b] transition-colors'
							>
								<span className='material-symbols-outlined'>
									arrow_downward
								</span>
							</button>
						</div>
						{/* To Token Section */}
						<TokenInput
							label='You Receive'
							value={amountOut.toString()}
							readOnly
							token={tokenOut}
							tokens={tokens}
							onTokenChange={setTokenOut}
							balance='0.00'
						/>
						{/* Swap Button */}
						<div className='pt-4'>
							<button
								onClick={handleSwap}
								disabled={isSwapping || quoteLoading || !amountIn}
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
						<div className='flex justify-between items-center'>
							<span>Estimated Gas Fee</span>
							<span>${estimatedGas}</span>
						</div>
						<div className='flex justify-between items-center'>
							<span>Slippage Tolerance</span>
							<span className='text-primary/80'>5%</span>
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
