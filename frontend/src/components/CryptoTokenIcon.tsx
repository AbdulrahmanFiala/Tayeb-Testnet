interface CryptoTokenIconProps {
	symbol?: string;
	className?: string;
}

// Token logo URLs - using CoinGecko API for reliable token images
const TOKEN_LOGOS: Record<string, string> = {
	ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
	WETH: "https://assets.coingecko.com/coins/images/2518/small/weth.png",
	USDT: "https://assets.coingecko.com/coins/images/325/small/Tether.png",
	USDC: "https://assets.coingecko.com/coins/images/6319/small/usdc.png",
	WBTC: "https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png",
	BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
	DAI: "https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png",
	HDX: "https://assets.coingecko.com/coins/images/18185/small/hydradx.png",
	GLMR: "https://assets.coingecko.com/coins/images/22459/small/glmr.png",
	DEV: "https://assets.coingecko.com/coins/images/22459/small/glmr.png",
	XRP: "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png",
	BNB: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
	SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
	TRX: "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
	ADA: "https://assets.coingecko.com/coins/images/975/small/cardano.png",
	LINK: "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png",
	BCH: "https://assets.coingecko.com/coins/images/780/small/bitcoin-cash-circle.png",
	LEO: "https://assets.coingecko.com/coins/images/8418/small/leo-token.png",
	XLM: "https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png",
	SUI: "https://assets.coingecko.com/coins/images/26375/small/sui_asset.jpeg",
	HBAR: "https://assets.coingecko.com/coins/images/3688/small/hbar.png",
	AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
	HYPE: "https://coin-images.coingecko.com/coins/images/50882/small/hyperliquid.jpg?1729431300",
	// Fallback for custom tokens
	SHARIA: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
	TAYEB: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
};

// Fallback colors for tokens without images
const TOKEN_COLORS: Record<string, string> = {
	ETH: "#627EEA",
	WETH: "#627EEA",
	USDT: "#26A17B",
	USDC: "#2775CA",
	WBTC: "#F09242",
	BTC: "#F7931A",
	DAI: "#F4B731",
	HDX: "#FF4D88",
	GLMR: "#53CBC9",
	DEV: "#53CBC9",
	// Additional token colors
	XRP: "#23292F",
	BNB: "#F3BA2F",
	SOL: "#14F195",
	TRX: "#FF060A",
	ADA: "#0033AD",
	LINK: "#2A5ADA",
	BCH: "#8DC351",
	LEO: "#FF7917",
	XLM: "#14B6E7",
	SUI: "#6FBCF0",
	HBAR: "#000000",
	AVAX: "#E84142",
	HYPE: "#6366F1",
	// Custom tokens
	SHARIA: "#4ADE80",
	TAYEB: "#4ADE80",
};

export function CryptoTokenIcon({
	symbol = "ETH",
	className = "w-8 h-8",
}: CryptoTokenIconProps) {
	const upperSymbol = symbol.toUpperCase();
	const logoUrl = TOKEN_LOGOS[upperSymbol];
	const color = TOKEN_COLORS[upperSymbol] || "#4ADE80";

	// If we have a logo URL, use it as an image
	if (logoUrl) {
		return (
			<img
				src={logoUrl}
				alt={`${symbol} logo`}
				className={`${className} rounded-full`}
				onError={(e) => {
					// Fallback to colored circle if image fails to load
					const target = e.target as HTMLImageElement;
					target.style.display = "none";
				}}
			/>
		);
	}

	// Fallback to colored SVG circle
	const gradientId = `gradient-${symbol}`;
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 32 32"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
					<stop offset="100%" style={{ stopColor: color, stopOpacity: 0.7 }} />
				</linearGradient>
			</defs>
			<circle cx="16" cy="16" r="16" fill={`url(#${gradientId})`} />
			{/* Generic crypto icon pattern */}
			<g transform="translate(8, 8)">
				<path
					d="M8 2L10 6L8 8L6 6L8 2Z"
					fill="white"
					fillOpacity="0.9"
				/>
				<path
					d="M8 10L10 14L8 16L6 14L8 10Z"
					fill="white"
					fillOpacity="0.7"
				/>
			</g>
		</svg>
	);
}
