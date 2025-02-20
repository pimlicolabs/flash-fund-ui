import { Chain } from "viem";
import { baseSepolia, sepolia, arbitrumSepolia } from "viem/chains";
import { useChainId, useSwitchChain } from 'wagmi'


export const ENABLED_CHAINS = [baseSepolia, sepolia, arbitrumSepolia]

export default function NetworkSelector({
    chains = ENABLED_CHAINS,
    disabled = false,
    onChange,
}: {
    chains?: Chain[]
    disabled?: boolean
    onChange?: (chain: Chain) => void
}) {
    const chainId = useChainId()
    const { switchChain } = useSwitchChain()

    return (
        <div>
            <label className="block text-sm font-medium mb-2">Select Network</label>
            <select
                value={chainId}
                onChange={(e) => {
                    const newChainId = Number(e.target.value);
                    const chain = chains.find((c) => c.id === newChainId);
                    if (chain) {
                        switchChain({ chainId: newChainId });
                        onChange?.(chain);
                    }
                }}
                className="w-full p-2 border rounded"
                disabled={disabled}
            >
            {chains.map(chain => (
                <option key={chain.id} value={chain.id}>
                    {chain.name}
                </option>
            ))}
            </select>
        </div>
    );
}