"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const ExternalLinkIcon = () => (
	<svg
		className="inline-block ml-1 h-4 w-4"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
			d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
		/>
	</svg>
);

const NavBar = () => {
	const pathname = usePathname();

	return (
		<div className="text-secondary-foreground flex-row flex justify-between py-4 px-5 bg-background border-border border-b-2 gap-2">
			<div className="flex items-center gap-6">
				<Link href="/">
					<Image
						src="/pimlico-purple.svg"
						width={150}
						height={50}
						alt="Pimlico logo"
						className="hover:opacity-75 cursor-pointer"
					/>
				</Link>

				<Link
					href="/playground/credit"
					className={`hover:text-primary ${pathname?.startsWith("/playground/credit") ? "text-purple-500 font-medium" : ""}`}
				>
					MagicSpend.Credit
				</Link>

				<Link
					href="/playground/resource-lock"
					className={`hover:text-primary ${pathname?.startsWith("/playground/resource-lock") ? "text-purple-500 font-medium" : ""}`}
				>
					MagicSpend.ResourceLock
				</Link>

				<Link
					href="https://docs.pimlico.io/infra/magic-spend"
					target="_blank"
					className="hover:text-primary flex items-center"
				>
					Docs
					<ExternalLinkIcon />
				</Link>

				<Link
					href="https://cal.com/sergey-potekhin"
					target="_blank"
					className="hover:text-primary flex items-center"
				>
					Schedule a call
					<ExternalLinkIcon />
				</Link>
			</div>

			<div className="flex items-center space-x-4">
				<ConnectButton 
					showBalance={false}
					chainStatus="icon"
					accountStatus={{
						smallScreen: 'avatar',
						largeScreen: 'full',
					}}
				/>
			</div>
		</div>
	);
};

export default NavBar;
