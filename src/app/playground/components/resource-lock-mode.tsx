"use client";

import { useState } from "react";
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { MagicSpend, type PimlicoMagicSpendStake } from "@/utils/magic-spend";
import { useConfig } from "wagmi";
import UpdateStakes from "./update-stakes";
import { sepolia, baseSepolia, arbitrumSepolia } from "viem/chains";
import { isAddress, getAddress } from "viem";
import AddLock from "./add-lock";
import { AddLogFunction } from "../components/log-section";

interface ResourceLockModeProps {
  addLog: AddLogFunction;
}

interface TransferFundsProps {
  addLog: AddLogFunction;
  disabled?: boolean;
}

function TransferFunds({ addLog, disabled }: TransferFundsProps) {
  const [amount, setAmount] = useState<string>("0.0000000123");
  const [recipient, setRecipient] = useState<string>("");
  const [selectedChain, setSelectedChain] = useState<typeof sepolia | typeof baseSepolia | typeof arbitrumSepolia>(sepolia);
  const chains = [baseSepolia, sepolia, arbitrumSepolia];
  const [isLoading, setIsLoading] = useState(false);

  const handleTransfer = async () => {
    // Prepare allowance
    // Sponsor transaction
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Transfer Funds</h2>
      <div>
        <label className="block text-sm font-medium mb-2">Chain</label>
        <select
          value={selectedChain.id}
          onChange={(e) => {
            const chain = chains.find((c) => c.id === Number(e.target.value));
            if (chain) setSelectedChain(chain);
          }}
          className="w-full p-2 border rounded"
          disabled={disabled}
        >
          {chains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Amount (ETH)</label>
        <input
          type="string"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="0.0000000123"
          disabled={disabled}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Recipient Address</label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => {
            try {
              if (e.target.value && !isAddress(e.target.value)) return;
              setRecipient(getAddress(e.target.value));
            } catch (err) {
              // Invalid address, ignore
            }
          }}
          placeholder="0x..."
          className="w-full p-2 border rounded"
          disabled={disabled}
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleTransfer}
          disabled={isLoading || !isAddress(recipient) || !amount || disabled}
          className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {isLoading ? "Processing..." : "Send Funds"}
        </button>
      </div>
    </div>
  );
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
      <AddLock 
        addLog={addLog}
        disabled={loading}
      />
      <UpdateStakes 
        addLog={addLog} 
        stakes={stakes}
        onStakesUpdate={setStakes} 
      />
      <TransferFunds 
        addLog={addLog}
        disabled={loading} 
      />
    </div>
  );
}