"use client";

import type * as React from "react";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia, baseSepolia, arbitrumSepolia, base, arbitrum, mainnet, optimism, optimismSepolia, polygon, polygonAmoy, gnosis, bsc } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { http } from "wagmi";

const config = getDefaultConfig({
	appName: "Pimlico MagicSpend++ Playground",
	projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
	chains: [
		sepolia, baseSepolia, arbitrumSepolia, optimismSepolia,
		base, arbitrum, mainnet, optimism,
		polygon, polygonAmoy, gnosis, bsc
	],
	ssr: true,
	transports: {
		// Override transport for mainnet to use thirdweb RPC
		[mainnet.id]: http('https://1.rpc.thirdweb.com'),
	},
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider>{children}</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
