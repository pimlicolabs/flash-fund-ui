"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { arbitrumSepolia, baseSepolia, sepolia } from "wagmi/chains";
import config from "./wagmi-config";

const queryClient = new QueryClient();

export default function RainbowProvider({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<RainbowKitProvider>{children}</RainbowKitProvider>
			</QueryClientProvider>
		</WagmiProvider>
	);
}
