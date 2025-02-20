"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance, useWriteContract } from 'wagmi';
import { sepolia, baseSepolia, arbitrumSepolia } from "viem/chains";
import { formatEther, parseEther } from "viem";
import { clipDecimals } from "@/utils";
import { toast } from "react-toastify";
import { MagicSpendStakeManagerAbi } from "@/abi/MagicSpendStakeManager";
import { ETH } from "@/utils";
import { AddLogFunction } from "../components/log-section";

interface AddLockProps {
  addLog: AddLogFunction;
  disabled?: boolean;
}

export default function AddLock({ addLog, disabled }: AddLockProps) {
  const { isConnected, address } = useAccount();
  const chains = [baseSepolia, sepolia, arbitrumSepolia];
  const [selectedChain, setSelectedChain] = useState(chains[0]);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: balance } = useBalance({
    address,
    chainId: selectedChain.id,
  });

  const { writeContract, data: hash } = useWriteContract();

  const handleSetMax = () => {
    if (balance) {
      setAmount(formatEther(balance.value));
    }
  };

  useEffect(() => {
    if (hash) {
      const txUrl = `${selectedChain.blockExplorers?.default.url}/tx/${hash}`;

      addLog("debug", {
        hash,
        txUrl,
      });

      toast.success(
        <div>
          🔒 Lock creation submitted!
          <br />
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-500 hover:text-purple-700"
          >
            View on Explorer
          </a>
        </div>,
        {
          position: "bottom-right",
          autoClose: 5000,
        }
      );
    }
  }, [hash]);

  const handleCreateLock = async () => {
    if (!amount || !address) return;

    setIsLoading(true);
    try {
      const unstakeDelaySec = 86400; // 1 day in seconds
      
      addLog("request", { 
        method: "addStake",
        params: {
          token: ETH,
          amount: parseEther(amount),
          unstakeDelaySec
        }
      });

      writeContract({
        address: "0xa5cB33bbC3aA8a69b1FDfE66A2E5bD196407c5BD",
        abi: MagicSpendStakeManagerAbi,
        functionName: "addStake",
        args: [ETH, parseEther(amount), unstakeDelaySec],
        value: parseEther(amount),
        chainId: selectedChain.id,
      });
    } catch (error) {
      console.error("Lock creation error:", error);
      addLog("error", { error: String(error) });
      toast.error(error instanceof Error ? error.message : "Lock creation failed", {
        position: "bottom-right",
        autoClose: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Add Lock</h2>
      <p className="text-gray-600 mb-4">
        Lock your ETH to become a bundler. Your locked ETH acts as collateral,
        ensuring reliable transaction processing on the network.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Network</label>
          <select
            value={selectedChain.id}
            onChange={(e) => {
              const chain = chains.find((c) => c.id === Number(e.target.value));
              if (chain) setSelectedChain(chain);
            }}
            className="w-full p-2 border rounded"
            disabled={disabled}
          >
            {chains.map(chain => (
              <option key={chain.id} value={chain.id}>
                {chain.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Resource Lock</label>
          <select
            className="w-full p-2 border rounded"
            disabled={disabled}
            value="pimlico"
          >
            <option value="pimlico">Pimlico Lock</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Amount (ETH)
            {balance && (
              <span className="text-gray-500 ml-2">
                Balance: {clipDecimals(formatEther(balance.value), 5)} ETH
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 p-2 border rounded"
              placeholder="0.0"
              disabled={disabled}
            />
            <button
              onClick={handleSetMax}
              disabled={disabled || !balance}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
            >
              Max
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleCreateLock}
            disabled={isLoading || !amount || disabled}
            className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create Lock"}
          </button>
        </div>
      </div>
    </div>
  );
} 