import type { Metadata } from "next";
import Link from "next/link";
import PlaygroundClient from "./playground-client";

export const metadata: Metadata = {
  title: "Magic Spend Playground | Pimlico",
  description: "Experiment with Magic Spend functionality in this interactive playground. Try out Credit and Resource Lock modes with real-time RPC logs.",
  openGraph: {
    title: "Magic Spend Playground | Pimlico",
    description: "Interactive playground for experimenting with Magic Spend functionality.",
    type: "website",
  },
};

export default function PlaygroundPage() {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1">
        <PlaygroundClient />
      </div>
      
      {/* Documentation Links */}
      <div className="border-t p-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Resources</h3>
          <div className="flex gap-8">
            <Link
              href="https://docs.pimlico.io/infra/magic-spend"
              target="_blank"
              className="text-purple-600 hover:text-purple-800"
            >
              📚 Read the Documentation
            </Link>
            <Link
              href="https://dashboard.pimlico.io"
              target="_blank"
              className="text-purple-600 hover:text-purple-800"
            >
              📊 Get API Key
            </Link>
            <Link
              href="https://cal.com/sergey-potekhin"
              target="_blank"
              className="text-purple-600 hover:text-purple-800"
            >
              📅 Schedule a Call
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
