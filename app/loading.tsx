export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]" role="status" aria-label="Loading QMOS">
      <div className="text-center">
        <div className="inline-flex w-12 h-12 rounded-xl bg-white border border-[#dbeafe] items-center justify-center mb-4 animate-pulse">
          <span className="text-lg font-black text-[#1d4ed8]">QM</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '120ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '240ms' }} />
        </div>
        <p className="text-xs text-[#1e3a5f] mt-3">Loading QMOS...</p>
      </div>
    </div>
  );
}
