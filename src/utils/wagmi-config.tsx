'use client'

import { http, createConfig } from "wagmi";
import { arbitrumSepolia, baseSepolia, sepolia } from "wagmi/chains";
import { createClient } from 'viem'

const config = createConfig({
	chains: [baseSepolia, sepolia, arbitrumSepolia],
	transports: {
		[sepolia.id]: http('https://sepolia.infura.io/v3/b6faf2ee61164873bfd18cdba483bf65'),
		[baseSepolia.id]: http('https://base-sepolia.infura.io/v3/b6faf2ee61164873bfd18cdba483bf65'),
		[arbitrumSepolia.id]: http('https://arbitrum-sepolia.infura.io/v3/b6faf2ee61164873bfd18cdba483bf65'),
	},
	// client({ chain }) {
	// 	return createClient({ chain, transport: http() })
	//   },
});

export default config;
