"use client";

import { use, useEffect, useState } from "react";
import { useAccount, useBalance, useChainId, useEnsName, useSendTransaction, useSignMessage, useSignTypedData } from "wagmi";
import { useWriteContract, useEnsAddress } from "wagmi";
import { parseEther, formatEther, isAddress, PrivateKeyAccount, getContract, Address, Hex, http, encodeFunctionData } from "viem";
import { clipDecimals, ETH } from "@/utils";
import { normalize } from 'viem/ens'
import { useDebounce } from 'use-debounce';
import { MagicSpend, MagicSpendAllowance } from "@/utils/magic-spend";
import config from "@/utils/wagmi-config";
import { SessionKey } from "@/utils/session-key";
import { MagicSpendStakeManagerAbi } from "@/abi/MagicSpendStakeManager";
import { MagicSpendWithdrawalManagerAbi } from "@/abi/MagicSpendWithdrawalManager";
import { sepolia } from "viem/chains";
import { createPimlicoClient } from "permissionless/clients/pimlico";
import { entryPoint07Address } from "viem/account-abstraction";
import { toSafeSmartAccount } from "permissionless/accounts";
import { createSmartAccountClient } from "permissionless";

export default function Home() {
	const [isMounted, setIsMounted] = useState(false);
	const [amount, setAmount] = useState<string>("0.01");
	const [recipientInput, setRecipientInput] = useState("0x433704c40F80cBff02e86FD36Bc8baC5e31eB0c1");
	const [isLoading, setIsLoading] = useState(false);
	const { address } = useAccount();
	const { signTypedDataAsync } = useSignTypedData({
		config,
	})
	const { signMessageAsync } = useSignMessage({
		config,
	})
	const { data: tokenBalance } = useBalance({
		address,
	});
    const chainId = useChainId()
	console.log('chainId')
	console.log(chainId)
	const { data: hash, sendTransaction } = useSendTransaction()
    const [sessionAccount, setSessionAccount] = useState<PrivateKeyAccount | null>(null);
    const magicSpend = new MagicSpend(config);

	useEffect(() => {
        setIsMounted(true);
        const fetchSessionKey = async () => {
            const sessionKey = new SessionKey();
            const key = await sessionKey.getKey();
            setSessionAccount(key);
        }

        fetchSessionKey();
    }, []);

	const [debouncedRecipient] = useDebounce(
		recipientInput.replace(/^\.+|\.+$/g, ''),
		500
	);

	const { data: ensAddress } = useEnsAddress({
		name: normalize(debouncedRecipient),
        chainId: 1,
	})

	const recipientAddress = ensAddress || recipientInput;

	const { writeContract } = useWriteContract();	

	const handleMaxClick = () => {
		if (tokenBalance) {
			setAmount(clipDecimals(formatEther(tokenBalance.value)));
		}
	};

	const signMagicSpendAllowance = async (allowance: MagicSpendAllowance) => {
		console.log('allowance')
		console.log(allowance)

		console.log('address')
		console.log(address)

		const sig = await signTypedDataAsync({
			types: {
				AssetAllowance: [
					{ name: 'token', type: 'address' },
					{ name: 'amount', type: 'uint128' },
					{ name: 'chainId', type: 'uint128' },
				],
				Allowance: [
					{ name: 'account', type: 'address' },
					{ name: 'assets', type: 'AssetAllowance[]' },
					{ name: 'validUntil', type: 'uint128' },
					{ name: 'validAfter', type: 'uint128' },
					{ name: 'salt', type: 'uint128' },
					{ name: 'operator', type: 'address' },
				]
			},
			primaryType: 'Allowance',
			message: allowance,
		})

		return sig;
	}

	const handleTransfer = async () => {
		if (!recipientAddress) return;

        if (!sessionAccount) return;

		if (!address) return;

        console.log(sessionAccount);

		try {
			setIsLoading(true);

            // - Check user's active allowances
            const allowances = await magicSpend.getAllowancesByOperator(sessionAccount.address)

			const totalAllowance = allowances.flatMap(a => a.assets)
				.reduce((acc: bigint, curr) => acc + curr.amount - curr.used, BigInt(0));

			// - Check if it's enough to cover the transfer
			if (totalAllowance < parseEther(amount)) {
				// -- If not, create a new allowance
				const newAllowance = await magicSpend.prepareAllowance({
					account: address,
					token: ETH,
					amount: `0x${(parseEther(amount) * BigInt(3)).toString(16)}`,
				})

				const allowanceWithOperator = {
					...newAllowance,
					operator: sessionAccount.address,
				}


				const stakeManager = getContract({
					address: '0xA38D9e0F911B1bEd03a038367A6e9667700CDEFe',
					abi: MagicSpendStakeManagerAbi,
					client: config.getClient({ chainId: 11155111 }),
				})

				const h = await stakeManager.read.getAllowanceHash([{
					...allowanceWithOperator,
					validAfter: Number(allowanceWithOperator.validAfter),
					validUntil: Number(allowanceWithOperator.validUntil),
					salt: Number(allowanceWithOperator.salt),
				}])

				console.log('h')
				console.log(h)

				const signature = await signMessageAsync({
					message: {
						raw: h,
					}
				})

				// - Grant the allowance to Pimlico
				const k = await magicSpend.grantAllowance(allowanceWithOperator, signature)
				console.log('k')
				console.log(k)
			}

			// - Request the withdrawal
			const withdrawalManagerContract = getContract({
				abi: MagicSpendWithdrawalManagerAbi,
				address: "0x3F4A20335e9045f71411b04E9F53814f5b8d725d",
				client: config.getClient({ chainId: 11155111 }),
			})
			
			const withdrawalHash = await withdrawalManagerContract.read.getWithdrawalHash([
				{
					token: ETH,
					amount: parseEther(amount),
					chainId: BigInt(sepolia.id),
					recipient: recipientAddress as Address,
					preCalls: [],
					postCalls: [],
					validUntil: Number(0),
					validAfter: Number(0),
					salt: 0
				}
			]) as Hex;

			console.log('withdrawalHash')
			console.log(withdrawalHash)

			const operatorRequestSignature = await sessionAccount.signMessage({
				message: {
					raw: withdrawalHash
				}
			})

			const [withdrawal, signature] = await magicSpend.sponsorWithdrawal({
				token: ETH,
				recipient: recipientAddress as Address,
				amount: `0x${(parseEther(amount)).toString(16)}`,
				signature: operatorRequestSignature,
			})

			// - Create the user operation
			const publicClient = config.getClient({ chainId: 11155111 })

			const paymasterClient = createPimlicoClient({
				transport: http(process.env.NEXT_PUBLIC_PIMLICO_API_URL),
				entryPoint: {
					address: entryPoint07Address,
					version: "0.7",
				},
			})

			const safeAccount = await toSafeSmartAccount({
				client: publicClient,
				entryPoint: {
					address: entryPoint07Address,
					version: "0.7",
				},
				owners: [sessionAccount],
				version: "1.4.1",
			})

			const smartAccountClient = createSmartAccountClient({
				account: safeAccount,
				chain: sepolia,
				paymaster: paymasterClient,
				bundlerTransport: http(process.env.NEXT_PUBLIC_PIMLICO_API_URL),
				userOperation: {
					estimateFeesPerGas: async () => (await paymasterClient.getUserOperationGasPrice()).fast,
				},
			})

			const magicSpendCallData = encodeFunctionData({
				abi: MagicSpendWithdrawalManagerAbi,
				functionName: 'withdraw',
				args: [
					{
						...withdrawal,
						validUntil: Number(withdrawal.validUntil),
						validAfter: Number(withdrawal.validAfter),
						salt: Number(withdrawal.salt),
					},
					signature,
				]
			})
			
			// Send user operation and withdraw funds
			// You can add subsequent calls after the withdrawal, like "buy NFT on OpenSea for ETH"
			const userOpHash = await smartAccountClient.sendUserOperation({
				account: safeAccount,
				calls: [
					{
						to: "0x3F4A20335e9045f71411b04E9F53814f5b8d725d",
						value: parseEther("0"),
						data: magicSpendCallData,
					}
				]
			})

			const receipt = await paymasterClient.waitForUserOperationReceipt({
				hash: userOpHash
			})
			
			console.log(`Transaction hash: ${receipt.receipt.transactionHash}`);		
		} catch (error) {
			console.error("Error transferring");
			console.error(error);
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
					// disabled={isLoading || amount === "0" || !isAddress(recipientAddress) || !sessionAccount !== null}
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
