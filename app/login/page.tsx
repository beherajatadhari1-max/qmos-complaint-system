'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
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
    <div className="fixed inset-0 z-[9999] bg-blue-950 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl shadow-xl mb-3">
            <span className="text-2xl">⚙️</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">QMOS</h1>
          <p className="text-blue-400 text-xs mt-0.5 font-medium">Quality Management Operating System</p>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span className="text-xs text-blue-600 bg-blue-900/50 px-1.5 py-0.5 rounded-full">IATF 16949</span>
            <span className="text-xs text-blue-600 bg-blue-900/50 px-1.5 py-0.5 rounded-full">ISO 9001</span>
            <span className="text-xs text-blue-600 bg-blue-900/50 px-1.5 py-0.5 rounded-full">AIAG · VDA</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-blue-900/40 backdrop-blur border border-blue-800 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-sm font-bold text-white mb-0.5">Sign in to your account</h2>
          <p className="text-blue-400 text-xs mb-4">Use your company credentials to access QMOS</p>

          <form onSubmit={handleLogin} className="space-y-3">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-blue-300 mb-1 uppercase tracking-wide">
                Company Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="w-full bg-blue-950/60 border border-blue-700 text-white placeholder-blue-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-blue-300 mb-1 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className="w-full bg-blue-950/60 border border-blue-700 text-white placeholder-blue-600 rounded-lg px-3 py-2 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-300 text-xs">
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-0.5">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-blue-600 bg-blue-950 text-blue-500 cursor-pointer accent-blue-500"
              />
              <label htmlFor="remember" className="text-xs text-blue-300 cursor-pointer select-none">
                Remember me for 30 days
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-900/40 border border-red-700 rounded-lg px-3 py-2 flex items-start gap-2">
                <span className="text-red-400 text-xs flex-shrink-0">⚠️</span>
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/50 text-sm mt-1"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-blue-800 text-center">
            <p className="text-xs text-blue-500">
              Forgot your password? Contact your <span className="text-blue-400 font-medium">Quality Head</span> or IT Admin
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-blue-700 mt-3">
          © 2026 QMOS · Confidential · Authorized Access Only
        </p>
      </div>
    </div>
  );
}
