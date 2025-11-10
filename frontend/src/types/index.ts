export interface Token {
	symbol: string;
	name: string;
	decimals: number;
	description: string;
	complianceReason: string;
	addresses: {
		moonbase: string;
	};
	permissible: boolean;
}

export interface HalaCoin {
	coins: Token[];
}

export interface DeployedContracts {
	network: string;
	version: string;
	lastDeployed: string;
	amm: {
		factory: string;
		router: string;
		weth: string;
	};
	main: {
		shariaCompliance: string;
		shariaSwap: string;
		shariaDCA: string;
	};
	tokens: {
		[key: string]: string;
	};
}

export interface SwapState {
	tokenIn: Token | null;
	tokenOut: Token | null;
	amountIn: string;
	amountOut: string;
	loading: boolean;
	error: string | null;
}
