import { useAccount, useBalance, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { ERC20_ABI } from "../config/abis";
import type { Token } from "../types";

export function useTokenBalance(token: Token | null) {
	const { address } = useAccount();

	// Fetch balance from the ERC20 contract
	const { data: balance, refetch } = useReadContract({
		address: token?.addresses.moonbase as `0x${string}`,
		abi: ERC20_ABI,
		functionName: "balanceOf",
		args: address ? [address] : undefined,
		query: {
			enabled: Boolean(token && address),
			refetchOnWindowFocus: true,
		},
	});

	const formattedBalance = token && balance
		? formatUnits(balance as bigint, token.decimals)
		: "0";

	return {
		balance: formattedBalance,
		balanceRaw: balance as bigint | undefined,
		refetch,
	};
}

