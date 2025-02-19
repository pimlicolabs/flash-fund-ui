import { clipDecimals } from "@/utils";
import { MagicSpendBalance } from "@/utils/magic-spend";
import { formatEther } from "viem";

export default function BalanceCard({
	balance,
	primary,
}: {
	balance: MagicSpendBalance | Omit<MagicSpendBalance, "chain">;
	primary?: boolean;
}) {
	const chain = "chain" in balance ? balance.chain : undefined;

	if (primary === true) {
		return (
			<div className="p-6 bg-purple-100 rounded-lg">
				{chain && (
					<div className="text-2xl font-bold text-purple-700">{chain.name}</div>
				)}
				<div className="text-2xl font-bold text-purple-700">
					{clipDecimals(formatEther(balance.balance))}{" "}
					{chain?.nativeCurrency.symbol}
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 bg-white border rounded-lg">
			{chain && <div className="text-gray-600">{chain.name}</div>}
			<div className="text-2xl font-bold">
				{clipDecimals(formatEther(balance.balance))}{" "}
				{chain?.nativeCurrency.symbol}
			</div>
		</div>
	);
}
