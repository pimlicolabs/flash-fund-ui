import type { Metadata } from "next";
import "./globals.css";
import NavBar from "@/components/navbar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const metadata: Metadata = {
	title: "Magic Spend",
	description: "Magic Spend by Pimlico",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<NavBar />
				{children}
				<ToastContainer />
			</body>
		</html>
	);
}
