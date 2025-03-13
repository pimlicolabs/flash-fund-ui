import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
	title: "FlashFund",
	description: "FlashFund by Pimlico",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<Providers>
					<NavBar />
					{children}
					<ToastContainer />
				</Providers>
			</body>
		</html>
	);
}
