export const pimlicoStorage = {
	getApiKey: async () => {
		if (!process.env.NEXT_PUBLIC_PIMLICO_API_KEY) {
			throw new Error(
				"NEXT_PUBLIC_PIMLICO_API_KEY is not set in environment variables",
			);
		}
		return process.env.NEXT_PUBLIC_PIMLICO_API_KEY;
	},
};
