import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface QueryErrorProps {
  error: Error | null;
  onRetry: () => void;
}

export function QueryError({ error, onRetry }: QueryErrorProps) {
  return (
    <div className="bg-[#111111] border border-red-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg">
      <div className="bg-red-500/10 p-3 rounded-full mb-4 text-red-500">
        <AlertTriangle size={24} />
      </div>
      <h3 className="text-[#f1f5f9] font-medium mb-2">Failed to load data</h3>
      <p className="text-[#888888] text-sm mb-6 max-w-xs">
        {error?.message || "There was a problem retrieving your data. Please check your connection and try again."}
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222222] text-[#f1f5f9] border border-white/10 px-4 py-2 rounded-full transition-colors text-sm font-medium"
      >
        <RefreshCcw size={16} />
        Retry
      </button>
    </div>
  );
}
