// Token decimals configuration
// Maps token symbols to their decimal places

import tayebCoinsData from "../../../config/tayebCoins.json";

type TokenDecimalsMap = { [symbol: string]: number };

// Build decimals map from tayebCoins.json
const tokenDecimalsMap: TokenDecimalsMap = {};
(tayebCoinsData as { coins: Array<{ symbol: string; decimals: number }> }).coins.forEach(
	(coin) => {
		tokenDecimalsMap[coin.symbol.toUpperCase()] = coin.decimals;
	}
);

/**
 * Get decimals for a token symbol
 * @param symbol Token symbol (e.g. "BTC", "ETH", "USDC")
 * @returns Number of decimals (defaults to 18 if not found)
 */
export function getTokenDecimals(symbol: string): number {
	const decimals = tokenDecimalsMap[symbol.toUpperCase()];
	if (decimals === undefined) {
		console.warn(`⚠️ Decimals not found for ${symbol}, defaulting to 18`);
		return 18;
	}
	return decimals;
}

/**
 * Get all token decimals
 */
export function getAllTokenDecimals(): TokenDecimalsMap {
	return { ...tokenDecimalsMap };
}

