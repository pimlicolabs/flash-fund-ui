"use client";

import { useState } from "react";
import { arbitrumSepolia, baseSepolia, sepolia } from "viem/chains";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { getPimlicoUrl } from "@/utils";
import { toHex, zeroAddress } from "viem";
import { parseEther } from "viem";
import { ETH } from "@/utils";

interface ResourceLockModeProps {
  addLog: (type: "request" | "response", data: any) => void;
}

export default function ResourceLockMode({ addLog }: ResourceLockModeProps) {
  const { isConnected } = useAccount();
  const chains = [baseSepolia, sepolia, arbitrumSepolia];

  const handleSubmit = async () => {
    const params = {
      type: "pimlico_lock",
      data: {
        account: "0x77d1f68C3C924cFD4732e64E93AEBEA836797485",
      }
    };

    addLog("request", {
      method: "pimlico_getMagicSpendStakes",
      params: [params, null],
    });

    const response = await fetch(getPimlicoUrl(sepolia.id), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "pimlico_getMagicSpendStakes",
        params: [params],
        id: 1,
      }),
    });

    const data = await response.json();
    addLog("response", data);
  };

  if (!isConnected) {
    return (
      <div className="h-full flex items-center justify-center">
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={handleSubmit}
        className="w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        disabled={false}
      >
        Create Resource Lock
      </button>
    </div>
  );
} 