"use client";

import CreditMode from "../components/credit-mode";
import LogSection from "../components/log-section";

export default function CreditPage() {
  const { addLog, LogComponent } = LogSection();

  return (
    <div className="flex">
      {/* Log Section */}
      {LogComponent}

      {/* Main Content Section */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">MagicSpend.Credit</h1>
          
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Credit mode allows users to spend tokens they don't yet have, similar to a credit card. 
              Perfect for recurring payments and subscriptions.
            </p>
          </div>

          <div className="mb-8">
            <CreditMode addLog={addLog} />
          </div>
        </div>
      </div>
    </div>
  );
} 