import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ERC20_ABI } from "../config/abis";
import { CONTRACTS } from "../config/contracts";
import type { Token } from "../types";

export function useTokenBalance(token: Token | null) {
	const { address } = useAccount();

	// Check if this is DEV/WETH (native token or wrapped native token)
	// DEV token uses the WETH contract address, so we check by address
	const isNativeToken = token?.addresses.moonbase?.toLowerCase() === CONTRACTS.WETH.toLowerCase();

	// Get native balance for DEV/WETH
	const { data: nativeBalance, refetch: refetchNative } = useBalance({
		address: address,
		query: {
			enabled: Boolean(isNativeToken && address),
			refetchOnWindowFocus: true,
		},
	});

	// Fetch wrapped balance from the ERC20 contract
	// For DEV/WETH, this gets the wrapped balance; for other tokens, this is the token balance
	const { data: wrappedBalance, refetch: refetchWrapped } = useReadContract({
		address: token?.addresses.moonbase as `0x${string}`,
		abi: ERC20_ABI,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		query: {
			enabled: Boolean(token && address),
			refetchOnWindowFocus: true,
		},
	});

	// Calculate total balance
	let totalBalance: bigint | undefined;
	let formattedBalance: string;

	if (isNativeToken) {
		// For DEV/WETH, combine native and wrapped balances
		// This shows the total DEV available (native + wrapped)
		const native = nativeBalance?.value || 0n;
		const wrapped = (wrappedBalance as bigint) || 0n;
		totalBalance = native + wrapped;
		formattedBalance = totalBalance > 0n
			? formatUnits(totalBalance, token.decimals)
			: "0";
	} else {
		// For other ERC20 tokens, use wrapped balance only
		totalBalance = wrappedBalance as bigint | undefined;
		formattedBalance = token && totalBalance
			? formatUnits(totalBalance, token.decimals)
			: "0";
	}

	// Refetch function that refetches both native and wrapped if needed
	const refetch = async () => {
		if (isNativeToken) {
			// For DEV/WETH, refetch both native and wrapped balances
			await Promise.all([
				refetchNative(),
				refetchWrapped(),
			]);
		} else {
			// For other ERC20 tokens, only refetch wrapped balance
			await refetchWrapped();
		}
	};

	return {
		balance: formattedBalance,
		balanceRaw: totalBalance,
		refetch,
	};
}

