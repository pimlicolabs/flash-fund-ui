import { clipDecimals } from "@/utils";
import { MagicSpendBalance } from "@/utils/magic-spend";
import { formatEther } from "viem";

	// return (
	// 	<div className="p-6 bg-purple-100 rounded-lg">
	// 		{chain && <div className="text-2xl font-bold text-purple-700">{chain}</div>}
	// 		<div className="text-2xl font-bold text-purple-700">
	// 			{clipDecimals(formatEther(balance.balance))} ETH
	// 		</div>
	// 	</div>
	// );

export default function BalanceCard({
	balance,
	primary,
}: {
	balance: MagicSpendBalance | Omit<MagicSpendBalance, "chain">;
	primary?: boolean;
}) {
	const chain = "chain" in balance ? balance.chain : undefined;

	if (primary) {
		return (
			<div className="p-6 bg-purple-100 rounded-lg">
				{chain && <div className="text-2xl font-bold text-purple-700">{chain}</div>}
				<div className="text-2xl font-bold text-purple-700">
					{clipDecimals(formatEther(balance.balance))} {balance.token}
				</div>
			</div>
		);
	}

	return (
		<>
			{chain && <div className="text-2xl font-bold text-purple-700">{chain}</div>}
			<div className="text-lg font-bold">
				{clipDecimals(formatEther(balance.balance))} {balance.token}
			</div>
		</>
	);
}
