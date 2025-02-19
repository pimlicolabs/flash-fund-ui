"use client";

import ResourceLockMode from "../components/resource-lock-mode";
import LogSection from "../components/log-section";

export default function ResourceLockPage() {
  const { addLog, LogComponent } = LogSection();

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* Log Section */}
      {LogComponent}

      {/* Main Content Section */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">MagicSpend.ResourceLock</h1>
          
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Resource Lock mode enables locking specific resources or tokens for a period of time, 
              ideal for temporary access or time-bound permissions.
            </p>
          </div>

          <div className="mb-8">
            <ResourceLockMode addLog={addLog} />
          </div>
        </div>
      </div>
    </div>
  );
} 