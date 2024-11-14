"use client";

import { use, useEffect, useState } from "react";
import { useAccount, useBalance, useSendTransaction } from "wagmi";
import { useWriteContract, useEnsAddress } from "wagmi";
import { parseEther, formatEther, isAddress } from "viem";
import { clipDecimals } from "@/utils";
import { normalize } from 'viem/ens'
import { useDebounce } from 'use-debounce';

export default function Home() {
	const [isMounted, setIsMounted] = useState(false);
	const [amount, setAmount] = useState<string>("0");
	const [recipientInput, setRecipientInput] = useState("vitalik.eth");
	const [isLoading, setIsLoading] = useState(false);
	const { address } = useAccount();
	const { data: tokenBalance } = useBalance({
		address,
	});
	const { data: hash, sendTransaction } = useSendTransaction()
	console.log(hash)

	useEffect(() => {
        setIsMounted(true);
    }, []);

	const [debouncedRecipient] = useDebounce(
		recipientInput.replace(/^\.+|\.+$/g, ''),
		500
	);

	console.log(debouncedRecipient)

	const { data: ensAddress } = useEnsAddress({
		// name: normalize(debouncedRecipient),
		name: normalize('wevm.eth'),
	})
	console.log(ensAddress)

	const recipientAddress = ensAddress || recipientInput;

	const { writeContract } = useWriteContract();	

	const handleMaxClick = () => {
		if (tokenBalance) {
			setAmount(clipDecimals(formatEther(tokenBalance.value)));
		}
	};

	const handleTransfer = async () => {
		if (!recipientAddress) return;

		try {
			setIsLoading(true);

			sendTransaction({
				to: recipientAddress as `0x${string}`,
				value: parseEther(amount),
			});
		} catch (error) {
			console.error("Error transferring:", error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="flex justify-center p-4">
			<div className="max-w-lg w-full">
				<h1 className="text-2xl font-bold mb-6">Transfer ETH</h1>

				<div className="mb-4">
					<label className="block text-sm font-medium mb-2">Recipient Address or ENS</label>
					<input
						type="text"
						value={recipientInput}
						onChange={(e) => setRecipientInput(e.target.value)}
						placeholder="0x... or name.eth"
						className="w-full p-2 border rounded"
					/>
					{recipientInput.endsWith('.eth') && ensAddress && (
						<p className="mt-1 text-sm text-gray-600">
							Resolved address: {ensAddress}
						</p>
					)}
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

				<button
					onClick={handleTransfer}
					disabled={!writeContract || isLoading || amount === "0" || !isAddress(recipientAddress)}
					className="w-full py-2 bg-purple-500 text-white rounded disabled:opacity-50"
				>
					{isLoading ? "Transferring..." : "Transfer"}
				</button>

				{parseFloat(amount) >= 0.1 && (
					<div className="p-4 mt-2 bg-yellow-100 rounded-lg">
						<span className="text-m font-bold text-yellow-700">
							You are about to transfer more than 0.1 ETH, be careful!
						</span>
					</div>
				)}
			</div>
		</div>
	);
}
