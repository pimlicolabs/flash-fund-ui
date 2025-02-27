import { useState, useCallback } from "react";
import { useAccount, useChains, useConfig } from "wagmi";
import { MagicSpend, type PimlicoMagicSpendStake } from "@/utils/magic-spend";
import { formatEther } from "viem";
import type { AddLogFunction } from "../components/log-section";

interface UpdateStakesProps {
	addLog: AddLogFunction;
	stakes: PimlicoMagicSpendStake[];
	onStakesUpdate: (stakes: PimlicoMagicSpendStake[]) => void;
}

export default function UpdateLocks({
	addLog,
	stakes: locks,
	onStakesUpdate: onLocksUpdate,
}: UpdateStakesProps) {
	const { isConnected, address } = useAccount();
	const config = useConfig();
	const chains = useChains();
	const [loading, setLoading] = useState(false);

	const updateStakes = useCallback(async () => {
		if (!address || !isConnected) return;

		setLoading(true);
		try {
			const magicSpend = new MagicSpend(config, {
				onRequest: (method, params) => {
					addLog("request", { method, params });
				},
				onResponse: (method, params, result) => {
					addLog("response", { result });
				},
			});

			const newStakes = await magicSpend.getStakes({
				account: address,
			});
			onLocksUpdate(newStakes.stakes);
		} catch (error) {
			console.error("Error fetching stakes:", error);
			addLog("response", { error: String(error) });
		} finally {
			setLoading(false);
		}
	}, [address, isConnected, config, addLog, onLocksUpdate]);

	// useEffect(() => {
	// 	const interval = setInterval(updateStakes, 30000); // Update every 30 seconds
	// 	return () => clearInterval(interval);
	// }, [updateStakes]);

	const getChainById = (chainId: number) => {
		return chains.find((chain) => chain.id === chainId);
	};

	if (!isConnected) return null;

	// Sort stakes by USD value (testnet stakes at the end)
	const sortedStakes = [...locks].sort((a, b) => {
		if (a.testnet && !b.testnet) return 1;
		if (!a.testnet && b.testnet) return -1;
		return Number(b.usdValue - a.usdValue);
	});

	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<h2 className="text-xl font-semibold">Your Locks</h2>
				<p className="text-gray-600 mb-4">
					Below are your active locks across all supported networks.
				</p>

				{locks.length > 0 ? (
					<div
						className="relative overflow-x-auto"
						style={{ maxHeight: "320px" }}
					>
						<table className="w-full text-sm text-left text-gray-500">
							<thead className="text-xs uppercase bg-gray-50">
								<tr>
									<th scope="col" className="px-6 py-3">
										Network
									</th>
									<th scope="col" className="px-6 py-3">
										Type
									</th>
									<th scope="col" className="px-6 py-3 text-right">
										Amount
									</th>
									<th scope="col" className="px-6 py-3 text-right">
										USD Value
									</th>
								</tr>
							</thead>
							<tbody>
								{sortedStakes.map((stake, index) => {
									const chain = getChainById(stake.chainId);
									if (!chain) return null;

									const formatAmount = (amount: bigint) => {
										const value = Number(formatEther(amount));
										if (value === 0) return "0";
										return value < 0.001 ? "<0.001" : value.toFixed(3);
									};

									const amount = stake.amount - (stake.pending || BigInt(0));
									const formattedAmount = formatAmount(amount);
									const formattedUsdValue = (
										Number(stake.usdValue) / 1_000_000
									).toLocaleString(undefined, {
										minimumFractionDigits: 0,
										maximumFractionDigits: 2,
									});

									const nativeCurrency = chain.nativeCurrency;

									return (
										<tr
											key={index}
											className="bg-white border-b border-gray-50 hover:bg-gray-50 transition-colors"
										>
											<th
												scope="row"
												className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap"
											>
												<div className="flex items-center gap-2">
													<span>{chain.name}</span>
													{stake.testnet && (
														<span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-500 rounded">
															Testnet
														</span>
													)}
												</div>
											</th>
											<td className="px-6 py-4">
												<span className="capitalize">
													{stake.type.replace("_", " ")}
												</span>
											</td>
											<td className="px-6 py-4 text-right">{`${formattedAmount} ${nativeCurrency.symbol}`}</td>
											<td className="px-6 py-4 text-right">
												{`$${formattedUsdValue}`}
											</td>
											{/* <td className="px-6 py-4 text-right">
												<span
													className={`px-2 py-1 rounded text-xs ${
														stake.staked
															? "bg-green-500/20 text-green-500"
															: "bg-red-500/20 text-red-500"
													}`}
												>
													{stake.staked ? "Staked" : "Unstaked"}
												</span>
											</td> */}
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				) : (
					<div className="bg-gray-50 rounded-lg p-8 text-center">
						<p className="text-gray-600">
							No locks found yet. Your locks will appear here once you create
							them.
						</p>
					</div>
				)}
			</div>

			<div className="flex justify-end">
				<button
					onClick={updateStakes}
					className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
					disabled={loading}
				>
					{loading ? "Updating..." : "Update Locks"}
				</button>
			</div>
		</div>
	);
}
