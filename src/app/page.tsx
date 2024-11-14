"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import Link from "next/link";
import { formatEther } from "viem";
import { clipDecimals, getChain } from "@/utils";
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

	const balance = stakes.reduce((acc, curr) => acc + curr.amount, BigInt(0));

	console.log(stakes);
	return (
		<div className="p-8 max-w-7xl mx-auto">
			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<h2 className="text-2xl font-bold">Your Balance</h2>
					<Link href="/transfer" className="text-purple-600 hover:text-purple-800">
						Transfer Tokens
					</Link>
				</div>
				<p className="text-gray-600 mb-4">
					This is your total Magic Spend token balance, available across all connected chains. 
					These tokens can be used instantly on any supported network, giving you seamless cross-chain liquidity.
				</p>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					<BalanceCard balance={{ token: "ETH", balance }} primary={true} />
				</div>
			</div>

			<div className="mb-8">
				<div className="flex items-center gap-4 mb-4">
					<h3 className="text-2xl font-bold">Staking Overview</h3>
					<Link href="/add-stake" className="text-purple-600 hover:text-purple-800">
						Add Stake
					</Link>
				</div>
				<p className="text-gray-600 mb-4">
					Below are your individual stakes across different chains. The sum of these stakes determines your total balance shown above.
				</p>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{stakes.map((stake) => (
						<BalanceCard key={stake.chainId} balance={{
							chain: getChain(stake.chainId).name,
							token: 'ETH',
							balance: stake.amount,
						}} />
					))}
				</div>
			</div>
		</div>
	);
}
