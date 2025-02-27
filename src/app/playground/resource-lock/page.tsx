"use client";

import ResourceLockMode from "../components/resource-lock-mode";
import LogSection from "../components/log-section";

export default function ResourceLockPage() {
	const { addLog, LogComponent } = LogSection();

	return (
		<div className="flex h-[calc(100vh-73px)]">
			{/* Log Section */}
			{LogComponent}

			{/* Main Content Section */}
			<div className="flex-1 p-4 overflow-auto">
				<div className="max-w-3xl mx-auto">
					<h1 className="text-2xl font-bold mb-4">MagicSpend.ResourceLock</h1>

					<div className="mb-8 p-4 bg-gray-50 rounded-lg">
						<p className="text-gray-600">
							Resource Lock mode is designed for production-scale applications,
							requiring no developer funding. Users lock their tokens in
							specialized contracts (OneBalance and Pimlico lock) and can
							instantly access ETH on any chain by signing allowance messages.
							This enables immediate cross-chain liquidity while maintaining
							user control over their assets.
						</p>
						<ul className="mt-4 list-disc list-inside text-gray-600">
							<li>No developer funding required</li>
							<li>User-controlled token locking</li>
							<li>Instant cross-chain ETH access</li>
							<li>Currently supports ETH only</li>
						</ul>
					</div>

					<div className="mb-8">
						<ResourceLockMode addLog={addLog} />
					</div>
				</div>
			</div>
		</div>
	);
}
