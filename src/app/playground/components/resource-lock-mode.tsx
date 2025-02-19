"use client";

import { useState } from "react";
import { arbitrumSepolia, baseSepolia, sepolia } from "viem/chains";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';

interface ResourceLockModeProps {
  addLog: (type: "request" | "response", data: any) => void;
}

export default function ResourceLockMode({ addLog }: ResourceLockModeProps) {
  const { isConnected } = useAccount();
  const [resourceId, setResourceId] = useState<string>("");
  const [lockDuration, setLockDuration] = useState<string>("3600"); // 1 hour in seconds
  const [maxAmount, setMaxAmount] = useState<string>("0.01");
  const chains = [baseSepolia, sepolia, arbitrumSepolia];

  const handleSubmit = async () => {
    // Example request to be replaced with actual implementation
    const request = {
      method: "pimlico_sponsorMagicSpendWithdrawal",
      params: {
        mode: "resourceLock",
        resourceId,
        lockDuration: parseInt(lockDuration),
        maxAmount,
      },
    };

    addLog("request", request);

    // Simulate response for now
    setTimeout(() => {
      addLog("response", {
        success: true,
        data: {
          lockId: "0x789...",
          signature: "0xabc...",
          expiresAt: Math.floor(Date.now() / 1000) + parseInt(lockDuration),
        },
      });
    }, 500);
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
      <div>
        <label className="block text-sm font-medium mb-2">Resource ID</label>
        <input
          type="text"
          value={resourceId}
          onChange={(e) => setResourceId(e.target.value)}
          placeholder="Enter resource identifier"
          className="w-full p-2 border rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Lock Duration (seconds)</label>
        <select
          value={lockDuration}
          onChange={(e) => setLockDuration(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="300">5 minutes</option>
          <option value="900">15 minutes</option>
          <option value="1800">30 minutes</option>
          <option value="3600">1 hour</option>
          <option value="86400">24 hours</option>
          <option value="604800">1 week</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Max Amount (ETH)</label>
        <input
          type="number"
          value={maxAmount}
          onChange={(e) => setMaxAmount(e.target.value)}
          className="w-full p-2 border rounded"
          step="0.000000001"
          min="0"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        disabled={!resourceId || !lockDuration || !maxAmount}
      >
        Create Resource Lock
      </button>
    </div>
  );
} 