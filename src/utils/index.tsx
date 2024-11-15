export const clipDecimals = (value: string, decimals: number = 2): string => {
	const parts = value.split(".");
	if (parts.length === 1) return value;
	return `${parts[0]}.${parts[1].slice(0, decimals)}`;
};

import * as chains from "viem/chains";

/**
 * Gets the chain object for the given chain id.
 * @param chainId - Chain id of the target EVM chain.
 * @returns Viem's chain object.
 */
export const getChain = (chainId: number) => {
	for (const chain of Object.values(chains)) {
		if ("id" in chain) {
			if (chain.id === chainId) {
				return chain;
			}
		}
	}

	throw new Error(`Chain with id ${chainId} not found`);
};

export const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
