"use client";
import Link from "next/link";

export default function Home() {
	return (
		<div className="p-8 max-w-3xl mx-auto">
			<div className="mb-8">
				<h2 className="text-2xl font-bold mb-4">Welcome to Magic Spend</h2>
				<p className="text-gray-600 mb-6">
					Magic Spend solves liquidity fragmentation by enabling flexible token
					spending across multiple chains. If you have tokens spread across
					different chains and formats, Magic Spend allows you to instantly
					access their value while we handle the underlying token management.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					<Link
						href="/playground/credit"
						className="block p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow"
					>
						<h3 className="text-xl font-semibold mb-2">Magic Spend Credit</h3>
						<p className="text-gray-600 mb-4">
							Perfect for demos and small amounts. Developers fund their balance
							through the Pimlico dashboard and we instantly provide ETH on any
							chain.
						</p>
						<span className="text-purple-600">Try Credit Mode →</span>
					</Link>

					<Link
						href="/playground/resource-lock"
						className="block p-6 bg-white rounded-lg border hover:shadow-lg transition-shadow"
					>
						<h3 className="text-xl font-semibold mb-2">
							Magic Spend Resource Lock
						</h3>
						<p className="text-gray-600 mb-4">
							Ideal for any use case. Users lock their tokens in smart contracts
							and can instantly access ETH on any chain through simple message
							signing.
						</p>
						<span className="text-purple-600">Try Resource Lock Mode →</span>
					</Link>
				</div>

				<div className="space-y-4">
					<div className="flex items-center gap-2">
						<Link
							href="https://docs.pimlico.io/infra/magic-spend"
							target="_blank"
							className="text-purple-600 hover:text-purple-800"
						>
							📚 Read the Magic Spend documentation
						</Link>
					</div>
					<div className="flex items-center gap-2">
						<Link
							href="https://dashboard.pimlico.io"
							target="_blank"
							className="text-purple-600 hover:text-purple-800"
						>
							📊 View Pimlico Dashboard
						</Link>
					</div>
					<div className="flex items-center gap-2">
						<Link
							href="https://cal.com/sergey-potekhin"
							target="_blank"
							className="text-purple-600 hover:text-purple-800"
						>
							📅 Schedule a call to learn more
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
