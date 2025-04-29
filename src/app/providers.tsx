"use client";

import type * as React from "react";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia, baseSepolia, arbitrumSepolia, base, arbitrum, mainnet, optimism, optimismSepolia, polygon, polygonAmoy, gnosis, bsc } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { http } from "wagmi";
import { Batua } from "@/lib/batua";
import { getPimlicoUrl } from "@/utils";

const chains = [
	sepolia, baseSepolia, arbitrumSepolia, optimismSepolia,
	base, arbitrum, mainnet, optimism,
	polygon, polygonAmoy, gnosis, bsc
] as const;

const config = getDefaultConfig({
	appName: "Pimlico FlashFund Playground",
	projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
	chains,
	ssr: true,
	transports: {
		// Override transport for mainnet to use thirdweb RPC
		[mainnet.id]: http('https://1.rpc.thirdweb.com'),
	},
});

Batua.create({
    rpc: {
        transports: Object.fromEntries(
            chains.map(chain => [
                chain.id,
                http()
            ])
        ),
    },
    paymaster: {
        transports: Object.fromEntries(
            chains.map(chain => [
                chain.id,
                http(getPimlicoUrl(chain.id))
            ])
        ),
        context: {
            sponsorshipPolicyId: process.env.NEXT_PUBLIC_SPONSORSHIP_POLICY_ID
        }
    },
    bundler: {
        transports: Object.fromEntries(
            chains.map(chain => [
                chain.id,
                http(getPimlicoUrl(chain.id))
            ])
        )
    }
})

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
