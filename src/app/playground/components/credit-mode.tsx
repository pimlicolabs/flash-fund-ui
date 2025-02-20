"use client";

import { useState } from "react";
import {
	Address,
	getAddress,
	isAddress,
	parseEther,
	toHex,
	createPublicClient,
	http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia, baseSepolia, arbitrumSepolia } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
import { MagicSpendWithdrawalManagerAbi } from "@/abi/MagicSpendWithdrawalManager";
import { toast } from "react-toastify";
import { getPimlicoUrl } from "@/utils";
import { MagicSpend } from "@/utils/magic-spend";
import { useConfig } from "wagmi";
import { AddLogFunction } from "../components/log-section";
import { sendUserOperation } from "@/utils/user-operation";

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
// This is a dummy private key for testing - DO NOT use in production
const DUMMY_KEY =
	"0x1234567890123456789012345678901234567890123456789012345678901234";

if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
	throw new Error(
		"NEXT_PUBLIC_PIMLICO_API_KEY is not set in environment variables",
	);
}

interface CreditModeProps {
	addLog: AddLogFunction;
}

export default function CreditMode({ addLog }: CreditModeProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [amount, setAmount] = useState<string>("0.0000000123");
	const [recipient, setRecipient] = useState<Address>(
		"0x433704c40F80cBff02e86FD36Bc8baC5e31eB0c1",
	);
	const [selectedChain, setSelectedChain] = useState<
		typeof sepolia | typeof baseSepolia | typeof arbitrumSepolia
	>(sepolia);
	const chains = [baseSepolia, sepolia, arbitrumSepolia];
	const config = useConfig();
	const magicSpend = new MagicSpend(config, {
		onRequest: (method, params) => {
			addLog("request", { method, params });
		},
		onResponse: (method, params, result) => {
			addLog("response", { method, params, result });
		},
	});

	const handleSubmit = async () => {
		try {
			setIsLoading(true);
			addLog("debug", { message: "Preparing withdrawal..." });

			await magicSpend.setChainId(selectedChain.id);

			const [withdrawalManagerAddress, withdrawalCallData] =
				await magicSpend.sponsorWithdrawal({
					type: "credits",
					data: {
						token: ETH_ADDRESS,
						recipient,
						amount: toHex(parseEther(amount)),
						signature: "0x0",
					},
				});

			addLog("debug", {
				message: "Withdrawal sponsored",
				withdrawalManagerAddress,
				withdrawalCallData,
			});

			const receipt = await sendUserOperation(
				selectedChain,
				withdrawalManagerAddress,
				withdrawalCallData,
				addLog,
			);

			addLog("success", {
				message: "Transfer confirmed!",
				receipt,
				explorerUrl: `${selectedChain.blockExplorers?.default.url}/tx/${receipt.receipt.transactionHash}`,
			});

			toast.success(
				<div>
					🦄 Transfer successful!
					<br />
					<a
						href={`${selectedChain.blockExplorers?.default.url}/tx/${receipt.receipt.transactionHash}`}
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
		} catch (error) {
			console.error("Transfer error:", error);
			addLog("error", {
				message: error instanceof Error ? error.message : "Transfer failed",
			});
			toast.error(error instanceof Error ? error.message : "Transfer failed", {
				position: "bottom-right",
				autoClose: 5000,
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<label className="block text-sm font-medium mb-2">Chain</label>
				<select
					value={selectedChain.id}
					onChange={(e) => {
						const chain = chains.find((c) => c.id === Number(e.target.value));
						if (chain) setSelectedChain(chain);
					}}
					className="w-full p-2 border rounded"
				>
					{chains.map((chain) => (
						<option key={chain.id} value={chain.id}>
							{chain.name}
						</option>
					))}
				</select>
			</div>

			<div>
				<label className="block text-sm font-medium mb-2">Amount (ETH)</label>
				<input
					type="string"
					value={amount}
					onChange={(e) => setAmount(e.target.value)}
					className="w-full p-2 border rounded"
					placeholder="0.0000000123"
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
				/>
			</div>

			<button
				onClick={handleSubmit}
				disabled={isLoading || !isAddress(recipient) || !amount}
				className="w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 relative"
			>
				{isLoading ? "Processing..." : "Send funds"}
			</button>
		</div>
	);
}
