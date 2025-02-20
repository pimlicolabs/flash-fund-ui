"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignTypedData } from "wagmi";
import { MagicSpend, type PimlicoMagicSpendStake } from "@/utils/magic-spend";
import { useConfig } from "wagmi";
import UpdateStakes from "./update-stakes";
import { sepolia, baseSepolia, arbitrumSepolia } from "viem/chains";
import { isAddress, getAddress, parseEther, toHex, Chain } from "viem";
import AddLock from "./add-lock";
import { AddLogFunction } from "../components/log-section";
import { ETH } from "@/utils";
import NetworkSelector, { ENABLED_CHAINS } from "./network-selector";
// import { signTypedData } from '@wagmi/core'

interface ResourceLockModeProps {
	addLog: AddLogFunction;
}

interface TransferFundsProps {
	addLog: AddLogFunction;
	disabled?: boolean;
}

function TransferFunds({ addLog, disabled }: TransferFundsProps) {
	const [amount, setAmount] = useState<string>("0.0000000123");
	const [recipient, setRecipient] = useState<string>(
		"0x77d1f68C3C924cFD4732e64E93AEBEA836797485",
	);
	const [selectedChain, setSelectedChain] = useState<Chain>(ENABLED_CHAINS[0]);
	const [isLoading, setIsLoading] = useState(false);
	const config = useConfig();
	const { isConnected, address } = useAccount();
	const { signTypedDataAsync } = useSignTypedData();

	const handleTransfer = async () => {
		if (!address) return;
		// Prepare allowance
		const magicSpend = new MagicSpend(config, {
			onRequest: (method, params) => {
				addLog("request", { method, params });
			},
			onResponse: (method, params, result) => {
				addLog("response", { result });
			},
		});

		magicSpend.setChainId(selectedChain.id);

		const recipientAddress = getAddress(recipient);

		const allowance = await magicSpend.prepareAllowance({
			type: "pimlico_lock",
			data: {
				account: address,
				token: ETH,
				amount: toHex(parseEther(amount)),
				recipient: recipientAddress,
			},
		});

		const signature = await signTypedDataAsync({
			domain: {
				name: "Pimlico Lock",
				chainId: selectedChain.id,
				verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
				version: "1",
			},
			types: {
				AssetAllowance: [
					{ name: "token", type: "address" },
					{ name: "amount", type: "uint128" },
					{ name: "chainId", type: "uint128" },
				],
				Allowance: [
					{ name: "account", type: "address" },
					{ name: "assets", type: "AssetAllowance[]" },
					{ name: "validUntil", type: "uint48" },
					{ name: "validAfter", type: "uint48" },
					{ name: "salt", type: "uint48" },
					{ name: "version", type: "uint32" },
					{ name: "metadata", type: "bytes" },
				],
			},
			primaryType: "Allowance",
			message: {
				account: allowance.account,
				assets: allowance.assets,
				validUntil: Number(allowance.validUntil),
				validAfter: Number(allowance.validAfter),
				salt: Number(allowance.salt),
				version: Number(allowance.version),
				metadata: allowance.metadata,
			},
		});

		const withdrawal = await magicSpend.sponsorWithdrawal({
			type: "pimlico_lock",
			data: {
				allowance,
				signature,
			},
		});
	};

	return (
		<div className="space-y-6">
			<h2 className="text-xl font-semibold">Transfer Funds</h2>
			<NetworkSelector onChange={(chain) => setSelectedChain(chain)} />

			<div>
				<label className="block text-sm font-medium mb-2">Amount (ETH)</label>
				<input
					type="string"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className="w-full p-2 border rounded"
					placeholder="0.0000000123"
					disabled={disabled}
				/>
			</div>

			<div>
				<label className="block text-sm font-medium mb-2">
					Recipient Address
				</label>
				<input
					type="text"
					value={recipient}
					onChange={(e) => {
						try {
							if (e.target.value && !isAddress(e.target.value)) return;
							setRecipient(getAddress(e.target.value));
						} catch (err) {
							// Invalid address, ignore
						}
					}}
					placeholder="0x..."
					className="w-full p-2 border rounded"
					disabled={disabled}
				/>
			</div>

			<div className="flex justify-end">
				<button
					onClick={handleTransfer}
					disabled={isLoading || !isAddress(recipient) || !amount || disabled}
					className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
				>
					{isLoading ? "Processing..." : "Send Funds"}
				</button>
			</div>
		</div>
	);
}

export default function ResourceLockMode({ addLog }: ResourceLockModeProps) {
	const { isConnected, address } = useAccount();
	const config = useConfig();
	const [stakes, setStakes] = useState<PimlicoMagicSpendStake[]>([]);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!address) return;

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

			const stakes = await magicSpend.getStakes({
				type: "pimlico_lock",
				data: {
					account: address,
				},
			});
			setStakes(stakes);
		} catch (error) {
			console.error("Error fetching stakes:", error);
			addLog("response", { error: String(error) });
		} finally {
			setLoading(false);
		}
	};

	if (!isConnected) {
		return (
			<div className="h-full flex items-center justify-center">
				<ConnectButton />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<AddLock addLog={addLog} disabled={loading} />
			<hr className="border-gray-100" />
			<UpdateStakes
				addLog={addLog}
				stakes={stakes}
				onStakesUpdate={setStakes}
			/>
			<hr className="border-gray-100" />
			<TransferFunds addLog={addLog} disabled={loading} />
		</div>
	);
}
