"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pimlicoStorage } from "@/utils/storage";
import { toast } from "react-toastify";

export default function Home() {
	return (
		<div className="p-8 max-w-3xl mx-auto">
			<div className="mb-8">
				<h2 className="text-2xl font-bold mb-4">Welcome to Magic Spend</h2>
				<p className="text-gray-600 mb-6">
					Magic Spend is a powerful tool for managing token spending and resource access. 
					Experiment with different modes in our interactive playground to see how they work.
				</p>

				<div className="mb-8">
					<Link
						href="/playground"
						className="inline-block px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
					>
						Try the Playground →
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
