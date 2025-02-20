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

  // Sort stakes by USD value (testnet stakes at the end)
  const sortedStakes = [...stakes].sort((a, b) => {
    if (a.testnet && !b.testnet) return 1;
    if (!a.testnet && b.testnet) return -1;
    return Number(b.usdValue - a.usdValue);
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Your Stakes</h2>
        <p className="text-gray-600 mb-4">
          Below are your active stakes across all supported networks.
        </p>
        
        {stakes.length > 0 ? (
          <div className="relative overflow-x-auto" style={{ maxHeight: '320px' }}>
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Network</th>
                  <th scope="col" className="px-6 py-3 text-right">Amount</th>
                  <th scope="col" className="px-6 py-3 text-right">USD Value</th>
                  <th scope="col" className="px-6 py-3 text-right">Withdrawal Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedStakes.map((stake, index) => {
                  const chain = getChainById(stake.chainId);
                  if (!chain) return null;

                  let withdrawalStatus = "-";
                  if (stake.withdrawTime && stake.withdrawTime.getTime() > 0) {
                    const timeLeft = stake.withdrawTime.getTime() - Date.now();
                    if (timeLeft > 0) {
                      const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
                      withdrawalStatus = `${hoursLeft}h until withdrawal`;
                    } else {
                      withdrawalStatus = "Ready to withdraw";
                    }
                  } else if (stake.unstakeDelaySec) {
                    withdrawalStatus = `${Number(stake.unstakeDelaySec) / 3600}h delay`;
                  }

                  return (
                    <tr key={index} className="bg-white">
                      <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{chain.name}</span>
                          {stake.testnet && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-500 rounded">
                              Testnet
                            </span>
                          )}
                        </div>
                      </th>
                      <td className="px-6 py-4 text-right">{formatEther(stake.amount)} ETH</td>
                      <td className="px-6 py-4 text-right">
                        {stake.testnet ? "-" : `$${formatEther(stake.usdValue)}`}
                      </td>
                      <td className="px-6 py-4 text-right">{withdrawalStatus}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded text-xs ${
                          stake.staked ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                        }`}>
                          {stake.staked ? 'Staked' : 'Unstaked'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">No stakes found yet. Your stakes will appear here once you create them.</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => {/* TODO: Add stake handler */}}
          className="px-3 py-1.5 text-sm bg-white border border-purple-500 text-purple-500 rounded hover:bg-purple-50"
        >
          Add Stake
        </button>
        <button
          onClick={updateStakes}
          className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Stakes"}
        </button>
      </div>
    </div>
  );
}