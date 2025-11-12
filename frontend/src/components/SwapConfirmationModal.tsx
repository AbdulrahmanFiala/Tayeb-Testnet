import { useState } from "react";
import type { SwapConfirmationData } from "../types";

interface SwapConfirmationModalProps {
	data: SwapConfirmationData;
	isOpen: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

export function SwapConfirmationModal({
	data,
	isOpen,
	onConfirm,
	onCancel,
}: SwapConfirmationModalProps) {
	const [showMore, setShowMore] = useState(false);

	if (!isOpen) return null;

	const {
		tokenIn,
		tokenOut,
		amountIn,
		amountOut,
		amountInUsd,
		amountOutUsd,
		exchangeRate,
		fee,
		feeUsd,
		slippageTolerance,
		minAmountOut,
	} = data;

	const formatUsd = (value?: number) => {
		if (value === undefined) return "";
		return `$${value.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})}`;
	};

	return (
		<>
			{/* Overlay */}
			<div
				className='modal-overlay'
				onClick={onCancel}
			/>

			{/* Modal */}
			<div className='modal-container'>
				<div className='modal-card'>
					{/* Header */}
					<div className='flex items-center justify-between mb-4'>
						<h2 className='text-white text-xl font-bold'>
							You're swapping
						</h2>
						<button
							onClick={onCancel}
							className='flex items-center justify-center size-8 rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white'
							aria-label='Close modal'
						>
							<span className='material-symbols-outlined'>close</span>
						</button>
					</div>

					{/* Token In */}
					<div className='flex items-center justify-between mb-2'>
						<div className='flex items-center gap-3'>
							<div className='size-10 rounded-full bg-primary/20 flex items-center justify-center'>
								<span className='text-lg font-bold text-primary'>
									{tokenIn.symbol.charAt(0)}
								</span>
							</div>
							<div>
								<div className='text-white text-2xl font-bold'>{amountIn}</div>
								<div className='text-white/60 text-sm'>{tokenIn.symbol}</div>
							</div>
						</div>
						{amountInUsd !== undefined && (
							<div className='text-white/80 text-base'>{formatUsd(amountInUsd)}</div>
						)}
					</div>

					{/* Arrow Down */}
					<div className='flex justify-center my-3'>
						<div className='flex items-center justify-center size-10 rounded-full bg-[#23483c]'>
							<span className='material-symbols-outlined text-primary'>
								arrow_downward
							</span>
						</div>
					</div>

					{/* Token Out */}
					<div className='flex items-center justify-between mb-6'>
						<div className='flex items-center gap-3'>
							<div className='size-10 rounded-full bg-primary/20 flex items-center justify-center'>
								<span className='text-lg font-bold text-primary'>
									{tokenOut.symbol.charAt(0)}
								</span>
							</div>
							<div>
								<div className='text-white text-2xl font-bold'>{amountOut}</div>
								<div className='text-white/60 text-sm'>{tokenOut.symbol}</div>
							</div>
						</div>
						{amountOutUsd !== undefined && (
							<div className='text-white/80 text-base'>{formatUsd(amountOutUsd)}</div>
						)}
					</div>

					{/* Divider */}
					<div className='border-t border-white/10 mb-4'></div>

					{/* Details */}
					<div className='space-y-3 mb-4'>
						{/* Exchange Rate */}
						<div className='flex items-center justify-between text-sm'>
							<span className='text-white/70'>Rate</span>
							<span className='text-white font-medium'>
								1 {tokenIn.symbol} = {exchangeRate} {tokenOut.symbol}
							</span>
						</div>

						{/* Fee */}
						<div className='flex items-center justify-between text-sm'>
							<div className='flex items-center gap-1'>
								<span className='text-white/70'>Fee (0.25%)</span>
								<span className='material-symbols-outlined text-white/50 text-base'>
									info
								</span>
							</div>
							<div className='text-right'>
								<div className='text-white font-medium'>{formatUsd(feeUsd)}</div>
							</div>
						</div>
					</div>

					{/* Show More */}
					<button
						onClick={() => setShowMore(!showMore)}
						className='flex items-center justify-center gap-1 w-full py-2 text-white/70 hover:text-white text-sm transition-colors'
					>
						<span>Show {showMore ? "less" : "more"}</span>
						<span
							className={`material-symbols-outlined text-base transition-transform ${
								showMore ? "rotate-180" : ""
							}`}
						>
							expand_more
						</span>
					</button>

					{/* Additional Details */}
					{showMore && (
						<div className='space-y-3 mt-3 pt-3 border-t border-white/10'>
							{/* Min Received */}
							<div className='flex items-center justify-between text-sm'>
								<div className='flex items-center gap-1'>
									<span className='text-white/70'>Minimum received</span>
									<span className='material-symbols-outlined text-white/50 text-base'>
										info
									</span>
								</div>
								<span className='text-white font-medium'>
									{minAmountOut} {tokenOut.symbol}
								</span>
							</div>

							{/* Slippage */}
							<div className='flex items-center justify-between text-sm'>
								<span className='text-white/70'>Slippage tolerance</span>
								<span className='text-white font-medium'>
									{slippageTolerance}%
								</span>
							</div>
						</div>
					)}

					{/* Confirm Button */}
					<button
						onClick={onConfirm}
						className='mt-6 w-full flex items-center justify-center gap-2 rounded-xl h-14 px-5 bg-primary text-background-dark text-lg font-bold leading-normal tracking-wide hover:opacity-90 transition-opacity'
					>
						<span>Swap</span>
					</button>
				</div>
			</div>
		</>
	);
}

