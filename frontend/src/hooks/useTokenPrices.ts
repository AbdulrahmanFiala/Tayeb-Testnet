import { useEffect, useState } from "react";
import type { TokenPrice } from "../types";

// Mock price data for common tokens (fallback when API is unavailable)
const MOCK_PRICES: Record<string, number> = {
	ETH: 3500,
	WETH: 3500,
	BTC: 65000,
	WBTC: 65000,
	USDT: 1,
	USDC: 1,
	DAI: 1,
	LINK: 15,
	UNI: 8,
	AAVE: 100,
	MATIC: 0.8,
	DEV: 0.5, // Moonbase native token
	GLMR: 0.5,
};

interface PriceCache {
	[symbol: string]: TokenPrice;
}

// Cache with 5 minute expiry
const CACHE_DURATION = 5 * 60 * 1000;
const priceCache: PriceCache = {};

/**
 * Hook to fetch and manage token prices in USD
 * Uses CoinGecko API with fallback to mock prices
 */
export function useTokenPrices(symbols: string[]) {
	const [prices, setPrices] = useState<PriceCache>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (symbols.length === 0) return;

		const fetchPrices = async () => {
			setLoading(true);
			setError(null);

			const now = Date.now();
			const newPrices: PriceCache = { ...prices };
			const symbolsToFetch: string[] = [];

			// Check cache first
			for (const symbol of symbols) {
				const cached = priceCache[symbol.toUpperCase()];
				if (cached && now - cached.lastUpdated < CACHE_DURATION) {
					newPrices[symbol.toUpperCase()] = cached;
				} else {
					symbolsToFetch.push(symbol);
				}
			}

			// If all prices are cached, use them
			if (symbolsToFetch.length === 0) {
				setPrices(newPrices);
				setLoading(false);
				return;
			}

			// Try to fetch from CoinGecko (or use mock prices)
			try {
				// For now, use mock prices (in production, you'd call CoinGecko API here)
				// const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
				
				for (const symbol of symbolsToFetch) {
					const symbolUpper = symbol.toUpperCase();
					const mockPrice = MOCK_PRICES[symbolUpper] || 1;
					
					const priceData: TokenPrice = {
						symbol: symbolUpper,
						usd: mockPrice,
						lastUpdated: now,
					};

					newPrices[symbolUpper] = priceData;
					priceCache[symbolUpper] = priceData;
				}

				setPrices(newPrices);
			} catch (err) {
				console.error("Error fetching prices:", err);
				setError("Failed to fetch token prices");
				
				// Use mock prices as fallback
				for (const symbol of symbolsToFetch) {
					const symbolUpper = symbol.toUpperCase();
					const mockPrice = MOCK_PRICES[symbolUpper] || 1;
					
					const priceData: TokenPrice = {
						symbol: symbolUpper,
						usd: mockPrice,
						lastUpdated: now,
					};

					newPrices[symbolUpper] = priceData;
				}
				
				setPrices(newPrices);
			} finally {
				setLoading(false);
			}
		};

		fetchPrices();
	}, [symbols.join(",")]);

	return {
		prices,
		loading,
		error,
		getPrice: (symbol: string) => prices[symbol.toUpperCase()]?.usd || 0,
		calculateUsdValue: (symbol: string, amount: number) => {
			const price = prices[symbol.toUpperCase()]?.usd || 0;
			return price * amount;
		},
	};
}

/**
 * Hook to get a single token price
 */
export function useTokenPrice(symbol: string) {
	const { prices, loading, error, getPrice } = useTokenPrices([symbol]);
	
	return {
		price: getPrice(symbol),
		loading,
		error,
	};
}

