import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#eff6ff] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="inline-flex w-16 h-16 rounded-2xl bg-white border border-[#dbeafe] items-center justify-center mb-6">
          <span className="text-2xl font-black text-[#1d4ed8]">QM</span>
        </div>

        {/* 404 */}
        <div className="text-8xl font-black text-blue-500/30 leading-none mb-2 select-none">404</div>
        <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-[#1e3a5f] text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
          Check the URL or navigate back using the sidebar.
        </p>

        {/* IATF flavour */}
        <div className="bg-amber-950/40 border border-amber-200 rounded-xl px-4 py-3 mb-8 text-left">
          <div className="text-xs font-bold text-amber-600 mb-1">⚠ QMOS Audit Note</div>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            Route not found — this may indicate a broken internal link or an outdated bookmark.
            Log this in Audit Trail if it recurs (IATF Cl. 9.1.1).
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors">
            🏠 Go to Dashboard
          </Link>
          <Link href="/complaints"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-[#dbeafe] border border-[#dbeafe] text-[#1e3a5f] text-sm font-semibold rounded-xl transition-colors">
            📋 Complaints Register
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-8 pt-6 border-t border-[#dbeafe]">
          <p className="text-xs text-[#1e3a5f] mb-3">Common pages</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { href: '/analytics',     label: '📊 Analytics' },
              { href: '/capa',          label: '🔧 CAPA' },
              { href: '/quality-goals', label: '🎯 KPI Goals' },
              { href: '/audit',         label: '✅ Audit' },
              { href: '/calibration',   label: '🔬 Calibration' },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="text-xs text-[#1d4ed8] hover:text-[#1d4ed8] hover:underline transition-colors px-1">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
