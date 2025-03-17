"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useChains, useSignTypedData, useSwitchChain } from "wagmi";
import { MagicSpend, type PimlicoMagicSpendStake } from "@/utils/magic-spend";
import { useConfig } from "wagmi";
import UpdateStakes from "./update-stakes";
import { isAddress, getAddress, parseEther, toHex, type Chain } from "viem";
import AddLock from "./add-lock";
import type { AddLogFunction } from "../components/log-section";
import { ETH } from "@/utils";
import NetworkSelector from "./network-selector";
import { sendUserOperation } from "@/utils/user-operation";
import { toast } from "react-toastify";
import { signQuote } from "@/utils/onebalance/sign-quote";
import { useWalletClient } from 'wagmi'
import { base, optimism, arbitrum } from "wagmi/chains";
import { ONEBALANCE_SUPPORTED_CHAINS, OneBalanceChainId } from "@/utils/onebalance/assets";

interface ResourceLockModeProps {
	addLog: AddLogFunction;
}

interface TransferFundsProps {
	addLog: AddLogFunction;
	disabled?: boolean;
}

function TransferFunds({ addLog, disabled }: TransferFundsProps) {
	const [amount, setAmount] = useState<string>("0.001");
	const [recipient, setRecipient] = useState<string>(
		"0x77d1f68C3C924cFD4732e64E93AEBEA836797485",
	);
	const chains = useChains();	
	const chainId = useChainId();
	const [isLoading, setIsLoading] = useState(false);
	const [resourceLock, setResourceLock] = useState<"pimlico" | "onebalance">("pimlico");
	const config = useConfig();
	const { isConnected, address } = useAccount();
	const { signTypedDataAsync } = useSignTypedData();
	const { data: walletClient } = useWalletClient();
	const { switchChainAsync } = useSwitchChain();

	const handlePimlicoTransfer = async () => {
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

		magicSpend.setChainId(chainId);

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
				name: "Pimlico FlashFund",
				version: "1",
				// chainId,
				// verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
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

		const [withdrawalManagerAddress, withdrawalCallData] = withdrawal;

		const chain = chains.find((c) => c.id === chainId);

		if (!chain) return;

		const receipt = await sendUserOperation(
			chain,
			withdrawalManagerAddress,
			withdrawalCallData,
			addLog,
		);

		toast.success(
			<div>
				🦄 Transfer successful!
				<br />
				<a
					href={`${chain.blockExplorers?.default.url}/tx/${receipt.receipt.transactionHash}`}
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
	};

	const handleOneBalanceTransfer = async () => {
		if (!address || !walletClient) return;

		// Prepare allowance
		const magicSpend = new MagicSpend(config, {
			onRequest: (method, params) => {
				addLog("request", { method, params });
			},
			onResponse: (method, params, result) => {
				addLog("response", { result });
			},
		});

		magicSpend.setChainId(chainId);

		const recipientAddress = getAddress(recipient);

		const allowance = await magicSpend.prepareAllowance({
			type: "onebalance",
			data: {
				account: address,
				token: ETH,
				amount: toHex(parseEther(amount)),
				recipient: recipientAddress,
			},
		});

		await switchChainAsync({
			// @ts-ignore
			chainId: allowance.originChainsOperations[0].typedDataToSign.domain.chainId,
		})

		const signedQuote = await signQuote(
			walletClient
		)(allowance);

		const withdrawal = await magicSpend.sponsorWithdrawal({
			type: "onebalance",
			data: {
				quote: signedQuote,
				amount: toHex(parseEther(amount)),
				recipient: recipientAddress,
			},
		});

		const [withdrawalManagerAddress, withdrawalCallData] = withdrawal;

		const chain = chains.find((c) => c.id === chainId);

		if (!chain) return;

		const receipt = await sendUserOperation(
			chain,
			withdrawalManagerAddress,
			withdrawalCallData,
			addLog,
		);
	};

	const handleTransfer = async () => {
		setIsLoading(true);
		try {
			if (resourceLock === "pimlico") {
				await handlePimlicoTransfer();
			} else {
				await handleOneBalanceTransfer();
			}
		} catch (error) {
			console.error("Transfer error:", error);
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
			<h2 className="text-xl font-semibold">Transfer Funds</h2>
			<NetworkSelector chains={chains} />
			{resourceLock === "onebalance" && !ONEBALANCE_SUPPORTED_CHAINS.includes(chainId as OneBalanceChainId) && (
				<div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<p className="text-yellow-700">
						OneBalance is only available on Optimism, Base, and Arbitrum. Please switch to one of these networks to continue.
					</p>
				</div>
			)}

			<div>
				<label className="block text-sm font-medium mb-2">Resource Lock</label>
				<select
					className="w-full p-2 border rounded"
					disabled={disabled}
					value={resourceLock}
					onChange={(e) => setResourceLock(e.target.value as "pimlico" | "onebalance")}
				>
					<option value="pimlico">Pimlico Lock</option>
					<option value="onebalance">One Balance</option>
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
					disabled={isLoading || !isAddress(recipient) || !amount || disabled || 
						(resourceLock === "onebalance" && !ONEBALANCE_SUPPORTED_CHAINS.includes(chainId as OneBalanceChainId))}
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

			const { stakes } = await magicSpend.getStakes({
				account: address,
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
