import { FiRefreshCw } from 'react-icons/fi';

function LoadingState() {
  return (
    <div className="space-y-6">
      {/* Skeleton Summary Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-slate-900/40 p-4 flex flex-col justify-between h-32 animate-pulse"
          >
            <div className="flex justify-between items-start">
              <div className="h-3 w-20 rounded bg-white/10" />
              <div className="h-4 w-4 rounded-full bg-white/10" />
            </div>
            <div>
              <div className="h-6 w-24 rounded bg-white/10 animate-pulse delay-75" />
              <div className="h-3 w-16 rounded bg-white/10 mt-2" />
            </div>
          </div>
        ))}
      </div>

      {/* Skeleton Filters */}
      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-5 space-y-4 animate-pulse">
        <div className="h-4 w-32 rounded bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="h-10 rounded-xl bg-white/5 lg:col-span-2" />
          <div className="h-10 rounded-xl bg-white/5" />
          <div className="h-10 rounded-xl bg-white/5" />
          <div className="h-10 rounded-xl bg-white/5" />
        </div>
      </div>

      {/* Skeleton Table */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur space-y-6">
        <div className="h-5 w-40 rounded bg-white/10 animate-pulse" />
        
        <div className="space-y-3.5">
          <div className="h-6 rounded bg-white/10 w-full" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center py-2 border-b border-white/5 animate-pulse">
              <div className="h-4 w-20 rounded bg-white/5" />
              <div className="h-4 w-32 rounded bg-white/5" />
              <div className="h-4 w-20 rounded bg-white/5" />
              <div className="h-4 w-16 rounded bg-white/5" />
              <div className="h-4 w-24 rounded bg-white/5 ml-auto" />
            </div>
          ))}
        </div>

        {/* Loading Banner */}
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 border-t border-white/5 mt-6">
          <FiRefreshCw className="text-cyan-400 text-2xl animate-spin" />
          <span className="text-sm font-semibold text-slate-300">
            Preparing backend integration...
          </span>
          <span className="text-xs text-slate-500 max-w-xs leading-relaxed">
            Connecting to data gateways and verifying local storage records.
          </span>
        </div>
      </div>
    </div>
  );
}

export default LoadingState;
