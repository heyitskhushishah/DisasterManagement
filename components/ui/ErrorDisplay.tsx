import { cn } from "@/lib/utils";

type ErrorDisplayProps = {
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorDisplay({ message, onRetry, className }: ErrorDisplayProps) {
  return (
    <div className={cn("rounded-lg border border-red-500/20 bg-red-500/5 p-3", className)}>
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-xs text-red-400">
          {message ?? "An error occurred while fetching data."}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 text-xs font-medium text-red-300 underline decoration-red-500/30 underline-offset-2 hover:text-red-200"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message?: string }) {
  return (
    <p className="text-center text-xs text-slate-500">
      {message ?? "No data available."}
    </p>
  );
}
