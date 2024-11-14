"use client";

import { MagicSpendStakeManagerAbi } from "@/abi/MagicSpendStakeManager";
import { clipDecimals } from "@/utils";
import config from "@/utils/wagmi-config";
import { useEffect, useState } from "react";
import { Chain, createPublicClient, formatEther, http, parseEther } from "viem";
import { useAccount, useBalance, useChainId, useSwitchChain } from "wagmi";
import { useWriteContract } from "wagmi";

const ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const UNSTAKE_DELAY_SEC = 86400;

export default function AddStake() {
	const [amount, setAmount] = useState<string>("0");
	const [selectedChain, setSelectedChain] = useState<Chain>(config.chains[0]);
	const [isLoading, setIsLoading] = useState(false);
	const { address } = useAccount();
	const { data: tokenBalance } = useBalance({
		address,
	});

    const { chains, switchChain } = useSwitchChain()
    const chainId = useChainId()

	const { writeContract } = useWriteContract({
		config,
	});

	const write = async () =>
		writeContract({
			abi: MagicSpendStakeManagerAbi,
			address: "0xA38D9e0F911B1bEd03a038367A6e9667700CDEFe",
			functionName: "addStake",
			value: parseEther(amount),
            // chainId: 84532,
			args: [ETH, parseEther(amount), UNSTAKE_DELAY_SEC],
		});

	const handleMaxClick = () => {
		if (tokenBalance) {
			setAmount(clipDecimals(formatEther(tokenBalance.value)));
		}
	};

	const handleStake = async () => {
		console.log("handleStake", amount);

        try {
		  setIsLoading(true)
		  await write()
		} catch (error) {
		  console.error('Error staking:', error)
		} finally {
		  setIsLoading(false)
		}
	};

	const [chainTokenBalances, setChainTokenBalances] = useState<
		Array<{ chain: string; token: string; balance: string }>
	>([]);
	const [isLoadingBalances, setIsLoadingBalances] = useState(true);

	useEffect(() => {
		const loadBalances = async () => {
			if (!address) return;

			try {
				const balances = await Promise.all(
					config.chains.map(async (chain) => {
						const client = createPublicClient({
							chain,
							transport: http(),
						});

						const balance = await client.getBalance({
							address,
						});

						return {
							chain: chain.name,
							token: chain.nativeCurrency.symbol,
							balance: clipDecimals(formatEther(balance)),
						};
					}),
				);

				setChainTokenBalances(balances);
			} catch (error) {
				console.error("Error loading balances:", error);
			} finally {
				setIsLoadingBalances(false);
			}
		};

		loadBalances();
	}, [address]);

	const totalBalance = chainTokenBalances.reduce(
		(acc, curr) => acc + parseFloat(curr.balance),
		0,
	);

	const handleBalanceClick = (chainName: string, balance: string) => {
		const chain = config.chains.find((c) => c.name === chainName);
		if (chain) {
			setSelectedChain(chain);
			setAmount(balance);
		}
	};

	return (
		<div className="flex gap-8 p-4 max-w-7xl mx-auto">
			<div className="flex-1">
				<div className="mb-6">
					<h2 className="text-xl font-bold mb-2">Total Balance</h2>
					<div className="p-4 bg-purple-100 rounded-lg">
						<span className="text-2xl font-bold text-purple-700">
							{totalBalance} ETH
						</span>
					</div>
				</div>

				<h2 className="text-xl font-bold mb-4">Available Balances</h2>
				<div className="grid grid-cols-3 gap-4">
					{chainTokenBalances.map((item, index) => (
						<div
							key={index}
							className="p-4 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
							onClick={() => handleBalanceClick(item.chain, item.balance)}
						>
							<div className="font-medium text-gray-600">{item.chain}</div>
							<div className="text-lg font-bold">
								{item.balance} {item.token}
							</div>
						</div>
					))}
				</div>
			</div>

			<div className="flex-1 max-w-lg">
				<h1 className="text-2xl font-bold mb-6">Stake Tokens</h1>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-2">Select Chain</label>
					<select
						className="w-full p-2 border rounded"
						value={selectedChain.name}
						onChange={(e) => {
							const chain = config.chains.find(
								(c) => c.name === e.target.value,
							);
							if (chain) setSelectedChain(chain);
						}}
					>
						{config.chains.map((chain) => (
							<option key={chain.id} value={chain.name}>
								{chain.name}
							</option>
						))}
					</select>
				</div>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-2">Select Token</label>
					<select className="w-full p-2 border rounded">
						<option>{selectedChain.nativeCurrency.symbol} (Native)</option>
					</select>
				</div>

				<div className="mb-6">
					<label className="block text-sm font-medium mb-2">Amount</label>
					<div className="flex gap-2">
						<input
							type="number"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							placeholder="0.0"
							className="flex-1 p-2 border rounded"
						/>
						<button
							onClick={handleMaxClick}
							className="px-3 py-2 bg-gray-200 rounded"
						>
							Max
						</button>
					</div>
				</div>

				{chainId === selectedChain.id ? (
                    <>
                        <button
                            onClick={handleStake}
                            disabled={!write || isLoading || amount === "0"}
                            className="w-full py-2 bg-purple-500 text-white rounded disabled:opacity-50"
                        >
                            {isLoading ? "Staking..." : "Stake"}
                        </button>

                        {parseFloat(amount) >= 0.1 && (
                            <div className="p-4 mt-2 bg-yellow-100 rounded-lg">
                                <span className="text-m font-bold text-yellow-700">
                                    You are about to stake more than 0.1 ETH, be careful!
                                </span>
                            </div>
                        )}
                    </>
				) : (
					<button
						onClick={() => switchChain({ chainId: selectedChain.id })}
						className="w-full py-2 bg-purple-500 text-white rounded"
					>
						Switch to {selectedChain.name}
					</button>
				)}
			</div>
		</div>
	);
}
