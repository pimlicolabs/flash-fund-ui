import type { Chain } from "viem";
import { baseSepolia, sepolia, arbitrumSepolia, base } from "viem/chains";
import { useChainId, useSwitchChain } from "wagmi";

export const ENABLED_CHAINS = [baseSepolia, sepolia, arbitrumSepolia, base];

export default function NetworkSelector({
	chains = ENABLED_CHAINS,
	disabled = false,
	onChange,
}: {
	chains?: Chain[];
	disabled?: boolean;
	onChange?: (chain: Chain) => void;
}) {
	const chainId = useChainId();
	const { switchChain } = useSwitchChain();

	return (
		<div>
			<label htmlFor="network-select" className="block text-sm font-medium mb-2">
				Select Network
			</label>
			<select
				id="network-select"
				value={chainId}
				onChange={(e) => {
					const newChainId = Number(e.target.value);
					const chain = chains.find((c) => c.id === newChainId);
					console.log("chains", chains);
					console.log("newChainId", newChainId);
					console.log("chain", chain);

					if (chain) {
						switchChain(
							{ chainId: newChainId },
							{
								onError: (error) => {
									console.error("Error switching chain:", error);
								},
							},
						);
						console.log("done");
						onChange?.(chain);
					}
				}}
				className="w-full p-2 border rounded"
				disabled={disabled}
			>
				{chains.map((chain) => (
					<option key={chain.id} value={chain.id}>
						{chain.name}
					</option>
				))}
			</select>
		</div>
	);
}
