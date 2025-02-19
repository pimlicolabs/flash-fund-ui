"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pimlicoStorage } from "@/utils/storage";
import { toast } from "react-toastify";

export default function Home() {
	const [apiKey, setApiKey] = useState<string>("");
	const [isSaved, setIsSaved] = useState(false);
	const [isFirstSave, setIsFirstSave] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const loadApiKey = async () => {
			const savedKey = await pimlicoStorage.getApiKey();
			if (savedKey) {
				setApiKey(savedKey);
				setIsSaved(true);
				setIsFirstSave(false);
			}
		};
		loadApiKey();
	}, []);

	const handleSave = async () => {
		await pimlicoStorage.setApiKey(apiKey);
		setIsSaved(true);
		toast.success("API key saved successfully!", {
			position: "bottom-right",
			autoClose: 3000,
		});

		if (isFirstSave) {
			setIsFirstSave(false);
			router.push("/transfer");
		}
	};

	const handleRemove = async () => {
		await pimlicoStorage.removeApiKey();
		setApiKey("");
		setIsSaved(false);
		setIsFirstSave(true);
		toast.info("API key removed", {
			position: "bottom-right",
			autoClose: 3000,
		});
	};

	return (
		<div className="p-8 max-w-3xl mx-auto">
			<div className="mb-8">
				<h2 className="text-2xl font-bold mb-4">Welcome to Magic Spend</h2>
				<p className="text-gray-600 mb-6">
					To get started with Magic Spend, you'll need to enter your Pimlico API
					key. This key will be stored securely in your browser and used for all
					future transactions.
				</p>

				<div className="mb-6">
					<label className="block text-sm font-medium mb-2">
						Pimlico API Key
					</label>
					<div className="flex gap-2">
						<input
							type="text"
							value={apiKey}
							onChange={(e) => {
								setApiKey(e.target.value);
								setIsSaved(false);
							}}
							placeholder="Enter your Pimlico API key"
							className="flex-1 p-2 border rounded"
						/>
						<button
							onClick={handleSave}
							disabled={!apiKey || isSaved}
							className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
						>
							{isSaved ? "Saved" : "Save"}
						</button>
						{isSaved && (
							<button
								onClick={handleRemove}
								className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
							>
								Remove
							</button>
						)}
					</div>
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
							📊 Get your Pimlico API key
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
