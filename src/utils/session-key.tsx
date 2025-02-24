import type { Hex, PrivateKeyAccount } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createStorage } from "wagmi";

export class SessionKey {
	private storage: ReturnType<typeof createStorage>;

	constructor() {
		this.storage = createStorage({
			storage: localStorage,
			key: "pimlico-magic-spend",
		});
	}

	async getKey(): Promise<PrivateKeyAccount> {
		// @ts-ignore
		const key = await this.storage.getItem("operator-key");

		if (!key) {
			const newKey = generatePrivateKey();
			// @ts-ignore
			await this.storage.setItem("operator-key", newKey);

			return privateKeyToAccount(newKey);
		}

		return privateKeyToAccount(key as Hex);
	}
}
