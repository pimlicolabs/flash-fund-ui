"use client";

import { useState } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { MagicSpend, type PimlicoMagicSpendStake } from "@/utils/magic-spend";
import { useConfig } from "wagmi";
import UpdateStakes from "./update-stakes";

interface ResourceLockModeProps {
  addLog: (type: "request" | "response", data: any) => void;
}

export default function ResourceLockMode({ addLog }: ResourceLockModeProps) {
  const { isConnected, address } = useAccount();
  const config = useConfig();
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

  return (
    <div className="space-y-6">      
      <UpdateStakes 
        addLog={addLog} 
        stakes={stakes}
        onStakesUpdate={setStakes} 
      />
    </div>
  );
}