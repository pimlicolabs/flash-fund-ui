"use client";

import { useState } from "react";
import {
	useAccount,
	useBalance,
	useChains,
	useConfig,
	useSendTransaction,
} from "wagmi";
import { type Chain, formatEther, parseEther, toHex } from "viem";
import { clipDecimals } from "@/utils";
import { toast } from "react-toastify";
import { ETH } from "@/utils";
import type { AddLogFunction } from "../components/log-section";
import NetworkSelector from "./network-selector";
import { MagicSpend } from "@/utils/magic-spend";

interface AddLockProps {
	addLog: AddLogFunction;
	disabled?: boolean;
}

export default function AddLock({ addLog, disabled }: AddLockProps) {
	const { isConnected, address } = useAccount();
	const chains = useChains();
	const [selectedChain, setSelectedChain] = useState<Chain>(chains[0]);
	const [amount, setAmount] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const config = useConfig();
	const { sendTransactionAsync } = useSendTransaction();
	const [resourceLock, setResourceLock] = useState<"pimlico" | "onebalance">(
		"pimlico",
	);

	const { data: balance } = useBalance({
		address,
		chainId: selectedChain.id,
	});

	const handleSetMax = () => {
		if (balance) {
			setAmount(formatEther(balance.value));
		}
	};

	const handleCreateLock = async () => {
		if (!amount || !address) return;

		setIsLoading(true);
		try {
			const unstakeDelaySec = 86400; // 1 day in seconds

			const magicSpend = new MagicSpend(config, {
				onRequest: (method, params) => {
					addLog("request", {
						method,
						params,
					});
				},
				onResponse: (method, params, result) => {
					addLog("response", {
						result,
					});
				},
			});

			magicSpend.setChainId(selectedChain.id);

			const [target, calldata, value] = await magicSpend.prepareStake(
				resourceLock === "pimlico"
					? {
							type: "pimlico_lock",
							data: {
								token: ETH,
								amount: toHex(parseEther(amount)),
								unstakeDelaySec: toHex(unstakeDelaySec),
							},
						}
					: {
							type: "onebalance",
							data: {
								token: ETH,
								amount: toHex(parseEther(amount)),
								account: address,
							},
						},
			);

			const hash = await sendTransactionAsync({
				data: calldata,
				to: target,
				value: BigInt(value),
				chainId: selectedChain.id,
			});

			if (hash) {
				const txUrl = `${selectedChain.blockExplorers?.default.url}/tx/${hash}`;

				addLog("debug", {
					hash,
					txUrl,
				});

				toast.success(
					<div>
						🔒 Lock creation submitted!
						<br />
						<a
							href={txUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="text-purple-500 hover:text-purple-700"
						>
							View on Explorer
						</a>
					</div>,
					{
						position: "bottom-right",
						autoClose: 5000,
					},
				);
			}
		} catch (error) {
			console.error("Lock creation error:", error);
			addLog("error", { error: String(error) });
			toast.error(
				error instanceof Error ? error.message : "Lock creation failed",
				{
					position: "bottom-right",
					autoClose: 5000,
				},
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<h2 className="text-xl font-semibold">Add Lock</h2>
			<p className="text-gray-600 mb-4">
				Lock ETH to start using resource lock mode. Your locked ETH is summed across
				different chains - for example, locking 0.5 ETH on Arbitrum and 0.1 ETH on
				Base allows you to request withdrawals up to 0.6 ETH on Ethereum.
			</p>

			<div className="space-y-4">
				<NetworkSelector chains={chains} onChange={(chain) => setSelectedChain(chain)} />

				<div>
					<label className="block text-sm font-medium mb-2">
						Resource Lock
					</label>
					<select
						className="w-full p-2 border rounded"
						disabled={disabled}
						value={resourceLock}
						onChange={(e) =>
							setResourceLock(e.target.value as "pimlico" | "onebalance")
						}
					>
						<option value="pimlico">Pimlico Lock</option>
						<option value="onebalance">One Balance</option>
					</select>
				</div>

				<div>
					<label className="block text-sm font-medium mb-2">
						Amount (ETH)
						{balance && (
							<span className="text-gray-500 ml-2">
								Balance: {clipDecimals(formatEther(balance.value), 5)} ETH
							</span>
						)}
					</label>
					<div className="flex gap-2">
						<input
							type="number"
							step="0.01"
							min="0"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							className="flex-1 p-2 border rounded"
							placeholder="0.0"
							disabled={disabled}
						/>
						<button
							onClick={handleSetMax}
							disabled={disabled || !balance}
							className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
						>
							Max
						</button>
					</div>
				</div>

				<div className="flex justify-end">
					<button
						onClick={handleCreateLock}
						disabled={isLoading || !amount || disabled}
						className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
					>
						{isLoading ? "Creating..." : "Create Lock"}
					</button>
				</div>
			</div>
		</div>
	);
}
