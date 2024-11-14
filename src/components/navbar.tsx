import Image from "next/image";
import Link from "next/link";

import { ConnectButton } from "@rainbow-me/rainbowkit";

const NavBar = () => {
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

				<Link href="/add-stake" className="hover:text-primary">
					Add Stake
				</Link>
				<Link href="/transfer" className="hover:text-primary">
					Transfer
				</Link>
			</div>
			<div className="my-auto flex"></div>
			<div>
				<ConnectButton chainStatus="none" showBalance={false} label="Connect" />
			</div>
		</div>
	);
};

export default NavBar;
