'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to console for debugging — in production this would go to Sentry/logging
    console.error('[QMOS Error Boundary]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#eff6ff] flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-700/50 flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            <p className="text-[#1e3a5f] text-sm">An unexpected error occurred in QMOS</p>
          </div>
        </div>

        {/* Error detail */}
        {error.message && (
          <div className="bg-red-50 border border-red-700/40 rounded-xl p-4 mb-5">
            <div className="text-xs font-bold text-red-600 mb-1">Error Details</div>
            <p className="text-xs text-red-200 font-mono break-all leading-relaxed">{error.message}</p>
            {error.digest && (
              <p className="text-[10px] text-[#1e3a5f] mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}

        {/* IATF flavour */}
        <div className="bg-amber-950/40 border border-amber-200 rounded-xl px-4 py-3 mb-6">
          <div className="text-xs font-bold text-amber-600 mb-1">📋 QMOS System Alert</div>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            An unhandled exception occurred. If this error repeats, raise a corrective action
            in the CAPA module (IATF Cl. 10.2). Capture this screenshot as objective evidence.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
            🔄 Try Again
          </button>
          <Link href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-[#dbeafe] border border-[#dbeafe] text-[#1e3a5f] text-sm font-semibold rounded-xl transition-colors">
            🏠 Go to Dashboard
          </Link>
          <Link href="/capa"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-[#dbeafe] border border-[#dbeafe] text-[#1e3a5f] text-sm font-semibold rounded-xl transition-colors">
            🔧 Raise CAPA
          </Link>
        </div>

        {/* System info */}
        <div className="mt-6 pt-4 border-t border-[#dbeafe] flex items-center justify-between text-[11px] text-[#1e3a5f]">
          <span>QMOS v1.0 · IATF 16949 Aligned</span>
          <span>Cl. 10.2 — Nonconformity & Corrective Action</span>
        </div>
      </div>
    </div>
  );
}
