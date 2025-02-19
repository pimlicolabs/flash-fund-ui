"use client";

import { useState } from "react";
import { arbitrumSepolia, baseSepolia, sepolia } from "viem/chains";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { getPimlicoUrl } from "@/utils";
import { toHex, zeroAddress, formatEther } from "viem";
import { ETH } from "@/utils";
import { MagicSpend, type PimlicoMagicSpendStake } from "@/utils/magic-spend";
import { useConfig } from "wagmi";

interface ResourceLockModeProps {
  addLog: (type: "request" | "response", data: any) => void;
}

function StakeCard({ stake, chain }: { stake: PimlicoMagicSpendStake; chain: any }) {
  return (
    <div className="p-4 border rounded-lg bg-white/5 space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium">{chain.name}</span>
        <span className={`px-2 py-1 rounded text-sm ${stake.staked ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {stake.staked ? 'Staked' : 'Unstaked'}
        </span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Amount:</span>
          <span>{formatEther(stake.amount)} ETH</span>
        </div>
        {/* {stake.pending > BigInt(0) && (
          <div className="flex justify-between">
            <span className="text-gray-400">Pending:</span>
            <span>{formatEther(stake.pending)} ETH</span>
          </div>
        )} */}
        {/* <div className="flex justify-between">
          <span className="text-gray-400">Remaining:</span>
          <span>{formatEther(stake.remaining)} ETH</span>
        </div> */}
        <div className="flex justify-between">
          <span className="text-gray-400">Unstake Delay:</span>
          <span>{Number(stake.unstakeDelaySec) / 3600}h</span>
        </div>
        {stake.withdrawTime && stake.withdrawTime.getTime() > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-400">Withdraw Time:</span>
            <span>{stake.withdrawTime.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResourceLockMode({ addLog }: ResourceLockModeProps) {
  const { isConnected, address } = useAccount();
  const config = useConfig();
  const chains = [baseSepolia, sepolia, arbitrumSepolia];
  const [stakes, setStakes] = useState<PimlicoMagicSpendStake[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const magicSpend = new MagicSpend(config, {
        onRequest: (method, params) => {
          addLog("request", { method, params });
        },
        onResponse: (method, params, result) => {
          addLog("response", { result });
        },
      });

      const stakes = await magicSpend.getStakes({
        type: "pimlico_lock",
        data: {
          account: address,
        }
      });
      setStakes(stakes);
    } catch (error) {
      console.error("Error fetching stakes:", error);
      addLog("response", { error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="h-full flex items-center justify-center">
        <ConnectButton />
      </div>
    );
  }

  const getChainById = (chainId: number) => {
    return chains.find(chain => chain.id === chainId);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={handleSubmit}
        className="w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Loading..." : "Get Resource Locks"}
      </button>

      {stakes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stakes.map((stake, index) => {
            const chain = getChainById(stake.chainId);
            if (!chain) return null;
            return <StakeCard key={index} stake={stake} chain={chain} />;
          })}
        </div>
      )}
    </div>
  );
} 