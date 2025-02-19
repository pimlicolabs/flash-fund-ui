"use client";

import Image from "next/image";
import Link from "next/link";

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

				<Link href="/playground" className="hover:text-primary">
					Playground
				</Link>
				<Link
					href="https://docs.pimlico.io/infra/magic-spend"
					target="_blank"
					className="hover:text-primary"
				>
					Docs
				</Link>
				<Link
					href="https://cal.com/sergey-potekhin"
					target="_blank"
					className="hover:text-primary"
				>
					Schedule a call
				</Link>
			</div>
		</div>
	);
};

export default NavBar;
