import { useState, useEffect, useCallback } from "react";
import { useAccount, useConfig } from 'wagmi';
import { MagicSpend, type PimlicoMagicSpendStake } from "@/utils/magic-spend";
import { arbitrumSepolia, baseSepolia, sepolia } from "viem/chains";
import { formatEther } from "viem";

interface UpdateStakesProps {
  addLog: (type: "request" | "response", data: any) => void;
  stakes: PimlicoMagicSpendStake[];
  onStakesUpdate: (stakes: PimlicoMagicSpendStake[]) => void;
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

export default function UpdateStakes({ addLog, stakes, onStakesUpdate }: UpdateStakesProps) {
  const { isConnected, address } = useAccount();
  const config = useConfig();
  const chains = [baseSepolia, sepolia, arbitrumSepolia];
  const [loading, setLoading] = useState(false);

  const updateStakes = useCallback(async () => {
    if (!address || !isConnected) return;
    
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

      const newStakes = await magicSpend.getStakes({
        type: "pimlico_lock",
        data: {
          account: address,
        }
      });
      onStakesUpdate(newStakes);
    } catch (error) {
      console.error("Error fetching stakes:", error);
      addLog("response", { error: String(error) });
    } finally {
      setLoading(false);
    }
  }, [address, isConnected, config, addLog, onStakesUpdate]);

  useEffect(() => {
    const interval = setInterval(updateStakes, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [updateStakes]);

  const getChainById = (chainId: number) => {
    return chains.find(chain => chain.id === chainId);
  };

  if (!isConnected) return null;

  return (
    <div className="space-y-6">
      {stakes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-md font-medium">Current Stakes</h3>
          <div className="grid grid-cols-3 gap-4">
            {stakes.map((stake, index) => {
              const chain = getChainById(stake.chainId);
              if (!chain) return null;
              return <StakeCard key={index} stake={stake} chain={chain} />;
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={updateStakes}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Stakes"}
        </button>
      </div>
    </div>
  );
}