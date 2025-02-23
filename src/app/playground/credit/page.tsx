"use client";

import CreditMode from "../components/credit-mode";
import LogSection from "../components/log-section";

export default function CreditPage() {
	const { addLog, LogComponent } = LogSection();

	return (
		<div className="flex flex h-[calc(100vh-73px)]">
			{/* Log Section */}
			{LogComponent}

			{/* Main Content Section */}
			<div className="flex-1 p-4 overflow-auto">
				<div className="max-w-3xl mx-auto">
					<h1 className="text-2xl font-bold mb-4">MagicSpend.Credit</h1>

					<div className="mb-8 p-4 bg-gray-50 rounded-lg">
						<p className="text-gray-600">
							Credit mode simplifies token access by shifting liquidity management from users to developers. 
							Developers can top up their balance through the Pimlico dashboard and instantly provide ETH 
							to users on any supported chain using their API key. Perfect for demos and small-scale applications.
						</p>
						<ul className="mt-4 list-disc list-inside text-gray-600">
							<li>Instant ETH provision on any supported chain</li>
							<li>Developer-funded model with dashboard management</li>
							<li>Webhook support for transaction monitoring</li>
							<li>Currently supports ETH only</li>
						</ul>
					</div>

					<div className="mb-8">
						<CreditMode addLog={addLog} />
					</div>
				</div>
			</div>
		</div>
	);
}
