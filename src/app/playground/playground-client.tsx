"use client";

import { useState } from "react";
import CreditMode from "./components/credit-mode";
import ResourceLockMode from "./components/resource-lock-mode";
import LogSection from "./components/log-section";

type MagicSpendMode = "credit" | "resourceLock";

export default function PlaygroundClient() {
  const [mode, setMode] = useState<MagicSpendMode>("credit");
  const { addLog, LogComponent } = LogSection();

  return (
    <div className="flex h-full">
      {/* Log Section */}
      {LogComponent}

      {/* Main Content Section */}
      <div className="w-2/3 p-4 overflow-auto">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold mb-4">Magic Spend Playground</h1>
          
          {/* Mode Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Mode</label>
            <div className="flex gap-4">
              <button
                onClick={() => setMode("credit")}
                className={`px-4 py-2 rounded-lg ${
                  mode === "credit"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                MagicSpend.Credit
              </button>
              <button
                onClick={() => setMode("resourceLock")}
                className={`px-4 py-2 rounded-lg ${
                  mode === "resourceLock"
                    ? "bg-purple-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                MagicSpend.ResourceLock
              </button>
            </div>
          </div>

          {/* Mode Description */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">
              {mode === "credit" ? "Credit Mode" : "Resource Lock Mode"}
            </h3>
            <p className="text-gray-600">
              {mode === "credit"
                ? "Credit mode allows users to spend tokens they don't yet have, similar to a credit card. Perfect for recurring payments and subscriptions."
                : "Resource Lock mode enables locking specific resources or tokens for a period of time, ideal for temporary access or time-bound permissions."}
            </p>
          </div>

          {/* Mode-specific Configuration */}
          <div className="mb-8">
            {mode === "credit" ? (
              <CreditMode addLog={addLog} />
            ) : (
              <ResourceLockMode addLog={addLog} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 