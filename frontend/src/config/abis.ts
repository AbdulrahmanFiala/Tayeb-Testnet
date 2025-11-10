// Auto-generated contract ABIs for type-safe contract interactions

export const ShariaSwapABI = [
	// Errors
	{
		type: "error",
		name: "QuoteAmountTooSmall",
		inputs: [
			{ name: "tokenIn", type: "address" },
			{ name: "tokenOut", type: "address" },
			{ name: "amountIn", type: "uint256" },
		],
	},
	{
		type: "error",
		name: "InsufficientBalance",
	},
	{
		type: "error",
		name: "SlippageExceeded",
	},
	{
		type: "error",
		name: "InvalidAmount",
	},
	{
		type: "error",
		name: "InvalidPath",
	},
	{
		type: "error",
		name: "SwapFailed",
	},
	{
		type: "error",
		name: "AssetNotRegistered",
	},
	// Functions
	{
		type: "function",
		name: "getSwapQuote",
		inputs: [
			{ name: "tokenIn", type: "address" },
			{ name: "tokenOut", type: "address" },
			{ name: "amountIn", type: "uint256" },
		],
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "swapTokenForToken",
		inputs: [
			{ name: "tokenIn", type: "address" },
			{ name: "tokenOut", type: "address" },
			{ name: "amountIn", type: "uint256" },
			{ name: "minAmountOut", type: "uint256" },
			{ name: "deadline", type: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "swapGLMRForToken",
		inputs: [
			{ name: "tokenOut", type: "address" },
			{ name: "minAmountOut", type: "uint256" },
			{ name: "deadline", type: "uint256" },
		],
		outputs: [],
		stateMutability: "payable",
	},
	{
		type: "function",
		name: "swapShariaCompliant",
		inputs: [
			{ name: "tokenIn", type: "address" },
			{ name: "tokenOut", type: "address" },
			{ name: "amountIn", type: "uint256" },
			{ name: "minAmountOut", type: "uint256" },
			{ name: "deadline", type: "uint256" },
		],
		outputs: [],
		stateMutability: "nonpayable",
	},
] as const;

export const ShariaComplianceABI = [
	{
		type: "function",
		name: "getAllShariaCoins",
		inputs: [],
		outputs: [
			{
				name: "coins",
				type: "tuple[]",
				components: [
					{ name: "id", type: "uint256" },
					{ name: "name", type: "string" },
					{ name: "symbol", type: "string" },
					{ name: "tokenAddress", type: "address" },
					{ name: "verified", type: "bool" },
					{ name: "complianceReason", type: "string" },
					{ name: "exists", type: "bool" },
				],
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getCoinBySymbol",
		inputs: [{ name: "symbol", type: "string" }],
		outputs: [
			{
				name: "",
				type: "tuple",
				components: [
					{ name: "id", type: "uint256" },
					{ name: "name", type: "string" },
					{ name: "symbol", type: "string" },
					{ name: "tokenAddress", type: "address" },
					{ name: "verified", type: "bool" },
					{ name: "complianceReason", type: "string" },
					{ name: "exists", type: "bool" },
				],
			},
		],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "isShariaCompliant",
		inputs: [{ name: "symbol", type: "string" }],
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "getTotalCoins",
		inputs: [],
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
	},
] as const;

export const ERC20_ABI = [
	{
		type: "function",
		name: "approve",
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "allowance",
		inputs: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
		],
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "balanceOf",
		inputs: [{ name: "account", type: "address" }],
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
	},
	{
		type: "function",
		name: "transfer",
		inputs: [
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "transferFrom",
		inputs: [
			{ name: "from", type: "address" },
			{ name: "to", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
	},
	{
		type: "function",
		name: "decimals",
		inputs: [],
		outputs: [{ name: "", type: "uint8" }],
		stateMutability: "view",
	},
] as const;
