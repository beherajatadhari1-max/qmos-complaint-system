'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Server error. Please try again.');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen bg-white">

      {/* LEFT BRANDING PANEL — Option A Dark Navy */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0c1a3a 0%, #162450 55%, #0c1a3a 100%)' }}
      >
        {/* Decorative glows */}
        <div style={{ position:'absolute', top:-100, right:-80, width:360, height:360, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(99,102,241,0.16) 0%, transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240, borderRadius:'50%',
          background:'radial-gradient(circle, rgba(56,189,248,0.09) 0%, transparent 65%)', pointerEvents:'none' }} />

        {/* Brand row */}
        <div style={{ position:'relative', zIndex:2 }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight leading-none">QMOS</h1>
              <p className="text-[#93c5fd] text-xs font-medium mt-0.5">Quality Management Operating System</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['IATF 16949','ISO 9001','AIAG · VDA'].map(tag => (
              <span key={tag} style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.18)',
                color:'#bfdbfe', fontSize:10, fontWeight:700, padding:'4px 11px', borderRadius:16, letterSpacing:'0.05em' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Headline + features */}
        <div className="my-8" style={{ position:'relative', zIndex:2 }}>
          <h2 className="font-black text-white leading-tight mb-3" style={{ fontSize:28, letterSpacing:-0.8 }}>
            Your Digital<br />
            <span style={{ color:'#60a5fa', display:'block' }}>
              Quality Command
            </span>
            Centre
          </h2>
          <p className="text-[#bfdbfe] leading-relaxed max-w-sm" style={{ fontSize:12.5 }}>
            A complete Quality Operating System built for automotive &amp; manufacturing — from complaint logging to IATF audit readiness.
          </p>

          <div className="mt-6 flex flex-col gap-2">

            {/* Complaint Management */}
            <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
              style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.09)' }}>
              <div className="flex items-center justify-center flex-shrink-0 rounded-lg"
                style={{ width:34, height:34, background:'rgba(239,68,68,0.14)', border:'1px solid rgba(239,68,68,0.25)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold" style={{ fontSize:12.5 }}>Complaint Management</p>
                <p className="text-[#93c5fd]" style={{ fontSize:11, marginTop:1 }}>Log, track &amp; resolve customer complaints in real time</p>
              </div>
            </div>

            {/* FMEA */}
            <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
              style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.09)' }}>
              <div className="flex items-center justify-center flex-shrink-0 rounded-lg"
                style={{ width:34, height:34, background:'rgba(59,130,246,0.14)', border:'1px solid rgba(59,130,246,0.25)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold" style={{ fontSize:12.5 }}>FMEA &amp; Control Plan</p>
                <p className="text-[#93c5fd]" style={{ fontSize:11, marginTop:1 }}>AIAG-VDA aligned PFMEA, DFMEA &amp; Control Plan tools</p>
              </div>
            </div>

            {/* KPIs */}
            <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
              style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.09)' }}>
              <div className="flex items-center justify-center flex-shrink-0 rounded-lg"
                style={{ width:34, height:34, background:'rgba(34,197,94,0.14)', border:'1px solid rgba(34,197,94,0.25)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold" style={{ fontSize:12.5 }}>Live Quality KPIs</p>
                <p className="text-[#93c5fd]" style={{ fontSize:11, marginTop:1 }}>PPM, CAPA status, audit scores &amp; trend dashboards</p>
              </div>
            </div>

            {/* AI Copilot */}
            <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
              style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.09)' }}>
              <div className="flex items-center justify-center flex-shrink-0 rounded-lg"
                style={{ width:34, height:34, background:'rgba(139,92,246,0.14)', border:'1px solid rgba(139,92,246,0.25)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                  <rect x="3" y="11" width="18" height="10" rx="2"/>
                  <path d="M12 2a3 3 0 0 0-3 3v6h6V5a3 3 0 0 0-3-3z"/>
                  <line x1="8" y1="21" x2="8" y2="16"/><line x1="16" y1="21" x2="16" y2="16"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold" style={{ fontSize:12.5 }}>AI Quality Copilot</p>
                <p className="text-[#93c5fd]" style={{ fontSize:11, marginTop:1 }}>IATF 16949 &amp; ISO 9001 expert assistant built-in</p>
              </div>
            </div>

            {/* IATF Audit */}
            <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5"
              style={{ background:'rgba(255,255,255,0.055)', border:'1px solid rgba(255,255,255,0.09)' }}>
              <div className="flex items-center justify-center flex-shrink-0 rounded-lg"
                style={{ width:34, height:34, background:'rgba(249,115,22,0.14)', border:'1px solid rgba(249,115,22,0.25)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="17" height="17">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold" style={{ fontSize:12.5 }}>IATF Audit &amp; PPAP</p>
                <p className="text-[#93c5fd]" style={{ fontSize:11, marginTop:1 }}>Audit trails, PPAP submissions &amp; compliance tracking</p>
              </div>
            </div>

          </div>
        </div>

        {/* Company code hint */}
        <div className="rounded-xl px-4 py-3"
          style={{ background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', position:'relative', zIndex:2 }}>
          <p className="text-[#93c5fd] font-bold uppercase tracking-widest" style={{ fontSize:10, marginBottom:4 }}>Company Code</p>
          <p className="text-white font-mono font-bold text-base tracking-widest">BALESH001</p>
          <p className="text-[#93c5fd]" style={{ fontSize:10, marginTop:3 }}>Use your company email to sign in</p>
        </div>
      </div>

      {/* RIGHT LOGIN PANEL */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 bg-[#eff6ff]">

        {/* Mobile logo */}
        <div className="flex flex-col items-center mb-8 lg:hidden">
          <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center shadow-xl mb-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[#0f172a] tracking-tight">QMOS</h1>
          <p className="text-[#1e3a5f] text-xs mt-1 font-medium text-center">Quality Management Operating System</p>
          <div className="flex gap-1.5 mt-2">
            {['IATF 16949','ISO 9001','AIAG'].map(tag => (
              <span key={tag} className="text-xs text-[#1d4ed8] bg-blue-100 rounded-full px-2 py-0.5 font-medium">{tag}</span>
            ))}
          </div>
        </div>

        {/* Login card */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-[#dbeafe] p-8">
          <div className="mb-6">
            <h2 className="text-xl font-black text-[#0f172a]">Welcome back</h2>
            <p className="text-[#1e3a5f] text-sm mt-1">Sign in with your company credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">Company Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required autoComplete="email"
                className="w-full bg-[#eff6ff] border border-[#dbeafe] text-[#0f172a] placeholder-[#94a3b8] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1e3a5f] mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" required autoComplete="current-password"
                  className="w-full bg-[#eff6ff] border border-[#dbeafe] text-[#0f172a] placeholder-[#94a3b8] rounded-lg px-3.5 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#1e3a5f] transition text-base">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input id="remember" type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#dbeafe] text-blue-600 cursor-pointer accent-blue-600" />
              <label htmlFor="remember" className="text-sm text-[#1e3a5f] cursor-pointer select-none">Remember me for 30 days</label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 flex items-start gap-2">
                <span className="text-red-500 text-sm flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-blue-200 text-sm mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#dbeafe] text-center">
            <p className="text-xs text-[#64748b]">
              Forgot your password?{' '}
              <span className="text-blue-600 font-semibold">Contact your Quality Head or IT Admin</span>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#64748b] mt-6">
          © 2026 QMOS &nbsp;·&nbsp; Confidential &nbsp;·&nbsp; Authorized Access Only
        </p>
      </div>
    </div>
  );
}
