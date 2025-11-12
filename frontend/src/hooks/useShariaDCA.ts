import { useMemo } from "react";
import type { Address } from "viem";
import {
	useAccount,
	useReadContract,
	useReadContracts,
	useWriteContract,
} from "wagmi";
import { ERC20_ABI, ShariaDCAABI } from "../config/abis";
import deployedContracts from "../../../config/deployedContracts.json";

const SHARIA_DCA_ADDRESS = (
	deployedContracts as unknown as { main: { shariaDCA: string } }
).main.shariaDCA as Address;

/**
 * Type matching the smart contract's DCAOrder struct
 */
export interface DCAOrder {
	id: bigint;
	owner: Address;
	sourceToken: Address;
	targetToken: Address;
	amountPerInterval: bigint;
	interval: bigint;
	intervalsCompleted: bigint;
	totalIntervals: bigint;
	nextExecutionTime: bigint;
	startTime: bigint;
	isActive: boolean;
	exists: boolean;
}

/**
 * Hook for ShariaDCA contract interactions using Wagmi v2
 */
export function useShariaDCA() {
	const { address: userAddress } = useAccount();
	const { writeContract, isPending: isWriting } = useWriteContract();

	// Get user's order IDs
	const { data: userOrderIds, isLoading: loadingOrderIds } = useReadContract({
		address: SHARIA_DCA_ADDRESS,
		abi: ShariaDCAABI,
		functionName: "getUserOrders",
		args: userAddress ? [userAddress] : undefined,
		query: {
			enabled: !!userAddress,
		},
	});

	// Create DCA order with DEV (native token)
	const createDCAOrderWithDEV = (
		targetToken: Address,
		amountPerInterval: bigint,
		intervalSeconds: bigint,
		totalIntervals: bigint,
		totalValue: bigint
	) => {
		if (!userAddress) throw new Error("Wallet not connected");

		writeContract({
			address: SHARIA_DCA_ADDRESS,
			abi: ShariaDCAABI,
			functionName: "createDCAOrderWithDEV",
			args: [targetToken, amountPerInterval, intervalSeconds, totalIntervals],
			value: totalValue, // Total amount to be locked
		});
	};

	// Create DCA order with ERC20 token
	const createDCAOrderWithToken = (
		sourceToken: Address,
		targetToken: Address,
		amountPerInterval: bigint,
		intervalSeconds: bigint,
		totalIntervals: bigint
	) => {
		if (!userAddress) throw new Error("Wallet not connected");

		writeContract({
			address: SHARIA_DCA_ADDRESS,
			abi: ShariaDCAABI,
			functionName: "createDCAOrderWithToken",
			args: [
				sourceToken,
				targetToken,
				amountPerInterval,
				intervalSeconds,
				totalIntervals,
			],
		});
	};

	// Approve token for DCA contract
	const approveToken = (tokenAddress: Address, amount: bigint) => {
		if (!userAddress) throw new Error("Wallet not connected");

		writeContract({
			address: tokenAddress,
			abi: ERC20_ABI,
			functionName: "approve",
			args: [SHARIA_DCA_ADDRESS, amount],
		});
	};

	// Execute DCA order
	const executeDCAOrder = (orderId: bigint) => {
		writeContract({
			address: SHARIA_DCA_ADDRESS,
			abi: ShariaDCAABI,
			functionName: "executeDCAOrder",
			args: [orderId],
		});
	};

	// Cancel DCA order
	const cancelDCAOrder = (orderId: bigint) => {
		if (!userAddress) throw new Error("Wallet not connected");

		writeContract({
			address: SHARIA_DCA_ADDRESS,
			abi: ShariaDCAABI,
			functionName: "cancelDCAOrder",
			args: [orderId],
		});
	};

	return {
		createDCAOrderWithDEV,
		createDCAOrderWithToken,
		approveToken,
		executeDCAOrder,
		cancelDCAOrder,
		userOrderIds: (userOrderIds as bigint[]) || [],
		loadingOrderIds,
		isCreating: isWriting,
		isExecuting: isWriting,
		isCancelling: isWriting,
		SHARIA_DCA_ADDRESS,
	};
}

/**
 * Hook to get details for a specific DCA order
 */
export function useDCAOrder(orderId: bigint | undefined) {
	const { data: order, isLoading } = useReadContract({
		address: SHARIA_DCA_ADDRESS,
		abi: ShariaDCAABI,
		functionName: "getDCAOrder",
		args: orderId ? [orderId] : undefined,
		query: {
			enabled: orderId !== undefined,
		},
	});

	return {
		order: order as DCAOrder | undefined,
		isLoading,
	};
}

/**
 * Hook to get multiple DCA orders at once
 */
export function useDCAOrders(orderIds: bigint[] | undefined) {
	// Create contract calls for all order IDs
	const contracts = useMemo(() => {
		if (!orderIds || orderIds.length === 0) return [];

		return orderIds.map((id) => ({
			address: SHARIA_DCA_ADDRESS,
			abi: ShariaDCAABI,
			functionName: "getDCAOrder" as const,
			args: [id],
		}));
	}, [orderIds]);

	const { data: ordersData, isLoading } = useReadContracts({
		contracts,
		query: {
			enabled: !!orderIds && orderIds.length > 0,
		},
	});

	// Extract orders from results
	const orders = useMemo(() => {
		if (!ordersData) return [];

		return ordersData
			.map((result) => {
				if (result.status === "success" && result.result) {
					return result.result as DCAOrder;
				}
				return null;
			})
			.filter((order): order is DCAOrder => order !== null);
	}, [ordersData]);

	return {
		orders,
		isLoading,
	};
}

