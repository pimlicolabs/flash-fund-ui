"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import Link from "next/link";
import { formatEther } from "viem";
import { clipDecimals } from "@/utils";
import { MagicSpend, MagicSpendBalance, PimlicoMagicSpendStake } from "@/utils/magic-spend";
import config from "@/utils/wagmi-config";
import BalanceCard from "@/components/balance-card";

export default function Home() {
	const [isMounted, setIsMounted] = useState(false);
	const { address } = useAccount();
	const magicSpend = new MagicSpend(config);
	const [balances, setBalances] = useState<MagicSpendBalance[]>([]);
	const [stakes, setStakes] = useState<PimlicoMagicSpendStake[]>([]);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!address) return;

		magicSpend.getBalances(address).then(setBalances);
		magicSpend.getStakes(address).then(setStakes);
	}, [address]);

	const balance = balances.reduce((acc, curr) => acc + curr.balance, BigInt(0));

	return (
		<div className="p-8 max-w-7xl mx-auto">
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<h2 className="text-2xl font-bold">Your Balance</h2>
					<Link href="/transfer" className="text-purple-600 hover:text-purple-800">
						Transfer Tokens
					</Link>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* {balances.map((balance) => (
						<BalanceCard key={balance.chain} balance={balance} />
					))} */}
					<BalanceCard balance={{ chain: "Sepolia", token: "ETH", balance }} />
				</div>
			</div>

			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<h2 className="text-2xl font-bold">Staking Overview</h2>
					<Link href="/add-stake" className="text-purple-600 hover:text-purple-800">
						Add Stake
					</Link>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<div className="p-6 bg-white border rounded-lg">
						<div className="text-gray-600">Sepolia</div>
						<div className="text-2xl font-bold">0.00 ETH</div>
					</div>
					<div className="p-6 bg-white border rounded-lg">
						<div className="text-gray-600">Base Sepolia</div>
						<div className="text-2xl font-bold">0.00 ETH</div>
					</div>
					<div className="p-6 bg-white border rounded-lg">
						<div className="text-gray-600">Arbitrum Sepolia</div>
						<div className="text-2xl font-bold">0.00 ETH</div>
					</div>
				</div>
			</div>
		</div>
	);
}
