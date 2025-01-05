"use client";

import { useEffect, useState } from "react";
import { Address, getAddress, isAddress, parseEther, toHex, encodeFunctionData, createPublicClient, http, PrivateKeyAccount } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { pimlicoStorage } from "@/utils/storage";
import { Bounce, toast } from "react-toastify";
import Link from "next/link";
import { sepolia, baseSepolia, arbitrumSepolia } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";
import { MagicSpendWithdrawalManagerAbi } from "@/abi/MagicSpendWithdrawalManager";

const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
// This is a dummy private key for testing - DO NOT use in production
const DUMMY_KEY = "0x1234567890123456789012345678901234567890123456789012345678901234";

if (!process.env.NEXT_PUBLIC_PIMLICO_API_URL) {
	throw new Error("NEXT_PUBLIC_PIMLICO_API_URL is not set");
}

export default function Transfer() {
	const [apiKey, setApiKey] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [transferStatus, setTransferStatus] = useState<string>("");
	const [amount] = useState<string>("0.0000000123");
	const [recipientInput, setRecipientInput] = useState<Address>("0x433704c40F80cBff02e86FD36Bc8baC5e31eB0c1");
	const [selectedChain, setSelectedChain] = useState<typeof sepolia | typeof baseSepolia | typeof arbitrumSepolia>(sepolia);
	const chains = [sepolia, baseSepolia, arbitrumSepolia];

	const getPimlicoUrl = (chainId: number) => {
		if (!apiKey) throw new Error("API key is required");
		return `${process.env.NEXT_PUBLIC_PIMLICO_API_URL}v2/${chainId}/rpc?apikey=${apiKey}`;
	};

	useEffect(() => {
		const loadApiKey = async () => {
			const key = await pimlicoStorage.getApiKey();
			setApiKey(key);
		};
		loadApiKey();
	}, []);

	if (!apiKey) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
				<h1 className="text-2xl font-bold mb-4">API Key Required</h1>
				<p className="text-gray-600 mb-4 text-center max-w-md">
					Please set up your Pimlico API key before making transfers.
				</p>
				<Link
					href="/"
					className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
				>
					Set up API Key
				</Link>
			</div>
		);
	}

	const handleTransfer = async () => {
		try {
			setIsLoading(true);
			setTransferStatus("Preparing transfer...");

			const params = {
				recipient: recipientInput,
				token: ETH_ADDRESS,
				amount: toHex(parseEther(amount)),
				salt: "0x0",
				signature: "0x0",
			}

			console.log("Request params:", params);

			setTransferStatus("Requesting withdrawal data...");
			const response = await fetch(getPimlicoUrl(selectedChain.id), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					method: "pimlico_sponsorMagicSpendWithdrawal",
					params: [params, null],
					id: 1
				}),
			});

			const data = await response.json();
			console.log("API Response:", data);

			if (data.error) {
				throw new Error(data.error.message || 'Transfer failed');
			}

			// Extract withdrawal data and signature from response
			const [withdrawal, signature] = data.result;
			console.log("Withdrawal:", withdrawal);
			console.log("Signature:", signature);

			setTransferStatus("Setting up clients...");
			// Create clients
			const publicClient = createPublicClient({
				chain: selectedChain,
				transport: http(),
			});

			const paymasterClient = createPimlicoClient({
				transport: http(getPimlicoUrl(selectedChain.id)),
				entryPoint: {
					address: entryPoint07Address,
					version: "0.7",
				},
			});

			// Create dummy account
			const dummyAccount = privateKeyToAccount(DUMMY_KEY);

			setTransferStatus("Creating smart account...");
			// Create safe account
			const safeAccount = await toSafeSmartAccount({
				client: publicClient,
				entryPoint: {
					address: entryPoint07Address,
					version: "0.7",
				},
				owners: [dummyAccount],
				version: "1.4.1",
			});

			// Create smart account client
			const smartAccountClient = createSmartAccountClient({
				account: safeAccount,
				chain: selectedChain,
				paymaster: paymasterClient,
				bundlerTransport: http(getPimlicoUrl(selectedChain.id)),
				userOperation: {
					estimateFeesPerGas: async () =>
						(await paymasterClient.getUserOperationGasPrice()).fast,
				},
			});

			setTransferStatus("Preparing withdrawal...");
			// Encode withdrawal call
			const magicSpendCallData = encodeFunctionData({
				abi: MagicSpendWithdrawalManagerAbi,
				functionName: "withdraw",
				args: [
					{
						...withdrawal,
						validUntil: Number(withdrawal.validUntil),
						validAfter: Number(withdrawal.validAfter),
						salt: Number(withdrawal.salt),
					},
					signature,
				],
			});

			setTransferStatus("Sending user operation...");
			const userOpHash = await smartAccountClient.sendUserOperation({
				account: safeAccount,
				calls: [
					{
						to: "0x0526f93A854c6f5cfEb9fBbFC70d32Fc4F46F182",
						value: parseEther("0"),
						data: magicSpendCallData,
					},
				],
			});

			setTransferStatus("Waiting for confirmation...");
			const receipt = await paymasterClient.waitForUserOperationReceipt({
				hash: userOpHash,
			});

			console.log("Transaction confirmed:", receipt);
			setTransferStatus("Transfer confirmed!");

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
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					progress: undefined,
					theme: "light",
					transition: Bounce,
				}
			);

		} catch (error) {
			console.error("Transfer error:", error);
			setTransferStatus("Transfer failed");
			toast.error(error instanceof Error ? error.message : "Transfer failed", {
				position: "bottom-right",
				autoClose: 5000,
			});
		} finally {
			setIsLoading(false);
			setTimeout(() => setTransferStatus(""), 3000);
		}
	};

	return (
		<div className="flex justify-center p-4">
			<div className="max-w-lg w-full">
				<h1 className="text-2xl font-bold mb-4">Send a Transfer</h1>
				<p className="text-gray-600 mb-6">
					This is a demo of Magic Spend transfer functionality. For security reasons, it's limited to testnet chains and small amounts.
					To explore the full potential of Magic Spend or integrate it into your application, please{' '}
					<Link href="https://docs.pimlico.io/infra/magic-spend" target="_blank" className="text-purple-600 hover:text-purple-800">
						read the documentation
					</Link>
					{' '}or{' '}
					<Link href="https://cal.com/sergey-potekhin" target="_blank" className="text-purple-600 hover:text-purple-800">
						schedule a call
					</Link>
					.
				</p>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-2">
						Chain
					</label>
					<select
						value={selectedChain.id}
						onChange={(e) => {
							const chain = chains.find(c => c.id === Number(e.target.value));
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

				<div className="mb-4">
					<label className="block text-sm font-medium mb-2">
						Recipient Address
					</label>
					<input
						type="text"
						value={recipientInput}
						onChange={(e) => setRecipientInput(getAddress(e.target.value))}
						placeholder="0x..."
						className="w-full p-2 border rounded"
					/>
				</div>

				<div className="mb-6">
					<label className="block text-sm font-medium mb-2">Amount (fixed for demo)</label>
					<input
						type="text"
						value={amount}
						disabled
						className="w-full p-2 border rounded bg-gray-50"
					/>
				</div>

				<button
					onClick={handleTransfer}
					disabled={isLoading || !isAddress(recipientInput)}
					className="w-full py-2 bg-purple-500 text-white rounded disabled:opacity-50 relative overflow-hidden"
				>
					<span className={`transition-opacity duration-300`}>
						{transferStatus || (isLoading ? 'Processing...' : 'Send Transfer')}
					</span>
				</button>
			</div>
		</div>
	);
}
