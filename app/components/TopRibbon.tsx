'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// -- Live unread notification count hook ----------------------------------------
function useUnreadCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch('/api/notifications?count=true');
        const d = await r.json();
        setCount(d.unreadCount ?? 0);
      } catch { /* silent */ }
    };
    poll();
    const id = setInterval(poll, 60000); // refresh every 60s
    return () => clearInterval(id);
  }, []);
  return count;
}

interface SessionUser { name: string; role: string; type: string; plant: string; }

interface SearchResult {
  complaints: {
    id: string; complaint_number: string; customer_name: string;
    part_name: string; severity: string; status: string;
    defect_category: string; defect_description: string;
  }[];
  modules: { label: string; href: string; icon: string }[];
}

const SEV_DOT: Record<string, string> = {
  Critical: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-yellow-500', Low: 'bg-green-600',
};
const STATUS_SHORT: Record<string, string> = {
  'Open': 'Open', 'Under Investigation': 'Invest.', 'CAPA In Progress': 'CAPA',
  'Pending Verification': 'Verif.', 'Pending Closure': 'Closure', 'Closed': 'Closed',
};

function getSession(): SessionUser | null {
  try {
    const cookie = document.cookie.split('; ').find(r => r.startsWith('qmos_session='));
    if (!cookie) return null;
    return JSON.parse(decodeURIComponent(cookie.split('=')[1]));
  } catch { return null; }
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-200 text-[#0f172a] rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function TopRibbon() {
  const [search, setSearch]       = useState('');
  const [results, setResults]     = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]           = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser]           = useState<SessionUser | null>(null);
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef   = useRef<HTMLDivElement>(null);
  const unreadCount = useUnreadCount();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setUser(getSession()); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) { setResults(null); setOpen(false); return; }
    setSearching(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(d => { setResults(d); setOpen(true); setSearching(false); })
      .catch(() => setSearching(false));
  }, []);

  const handleChange = (val: string) => {
    setSearch(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(val), 300);
  };

  const navigate = (href: string) => {
    setOpen(false);
    setSearch('');
    setResults(null);
    router.push(href);
  };

  const hasResults = results && (results.complaints.length > 0 || results.modules.length > 0);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const displayName     = user?.name ?? 'QMOS User';
  const displayRole     = user?.role ?? 'Quality Team';
  const displayInitials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="no-print bg-white border-b border-[#dbeafe] h-14 flex items-center px-5 gap-4 flex-shrink-0 shadow-sm z-20">
      {/* Mobile hamburger */}
      <button className="md:hidden p-2 -ml-1 rounded-lg text-[#1e3a5f] hover:text-[#15803d] hover:bg-[#eff6ff] transition flex-shrink-0"
        aria-label="Open menu" onClick={() => window.dispatchEvent(new Event('toggle-sidebar'))}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Greeting */}
      <div className="hidden lg:block flex-shrink-0">
        <p className="text-xs font-semibold text-[#0f172a]">{greeting}, {displayName.split(' ')[0]}</p>
        <p className="text-xs text-[#1e3a5f]">{dateStr}</p>
      </div>
      <div className="w-px h-6 bg-[#dbeafe] hidden lg:block flex-shrink-0" />

      {/* Global Search */}
      <div className="flex-1 max-w-2xl relative" ref={boxRef}>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1e3a5f] text-sm">
            {searching ? '⏳' : '🔍'}
          </span>
          <input
            ref={inputRef}
            value={search}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => { if (results && search.length >= 2) setOpen(true); }}
            placeholder="Search… (Ctrl+K)"
            className="w-full pl-9 pr-16 py-1.5 text-sm border border-[#bfdbfe] rounded-lg bg-[#eff6ff] text-[#0f172a] placeholder:text-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] focus:bg-white transition"
            aria-label="Search QMOS"
            aria-expanded={open}
            aria-haspopup="listbox"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="search-results"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#1e3a5f] font-mono hidden sm:block">⌘K</span>
        </div>

        {/* Dropdown */}
        {open && (
          <div id="search-results" role="listbox" aria-label="Search results" className="absolute top-full mt-1 left-0 right-0 bg-white rounded-xl border border-[#dbeafe] shadow-2xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">
            {!hasResults ? (
              <div className="px-4 py-6 text-center text-[#1e3a5f] text-sm">
                {searching ? 'Searching…' : `No results for "${search}"`}
              </div>
            ) : (
              <>
                {/* Complaints section */}
                {results.complaints.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-[#f0f9ff] border-b border-[#dbeafe] flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">🚨 Complaints</span>
                      <span className="text-[10px] bg-[#dbeafe] text-[#1d4ed8] rounded-full px-1.5 py-0.5 font-semibold">{results.complaints.length}</span>
                    </div>
                    {results.complaints.map(c => (
                      <button key={c.id} onClick={() => navigate(`/complaints/${c.id}`)}
                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[#eff6ff] transition text-left border-b border-[#dbeafe] last:border-0">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${SEV_DOT[c.severity] ?? 'bg-gray-400'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-[#1d4ed8] font-mono">{highlight(c.complaint_number, search)}</span>
                            <span className="text-xs text-[#0f172a]">{highlight(c.customer_name, search)}</span>
                            <span className="text-[10px] bg-[#f0f9ff] text-[#1e3a5f] px-1.5 py-0.5 rounded border border-[#dbeafe]">{STATUS_SHORT[c.status] ?? c.status}</span>
                          </div>
                          <p className="text-xs text-[#1e3a5f] mt-0.5 truncate">{highlight(c.part_name, search)} · {c.defect_category}</p>
                          {c.defect_description && (
                            <p className="text-[11px] text-[#1e3a5f] truncate">{c.defect_description}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Modules section */}
                {results.modules.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-[#f0f9ff] border-b border-[#dbeafe] border-t border-[#dbeafe]">
                      <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">🗂️ Modules</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5 p-2">
                      {results.modules.map(m => (
                        <button key={m.href + m.label} onClick={() => navigate(m.href)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#eff6ff] transition text-left">
                          <span className="text-base">{m.icon}</span>
                          <span className="text-sm font-medium text-[#0f172a]">{highlight(m.label, search)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="px-4 py-2 border-t border-[#dbeafe] bg-[#f0f9ff] flex items-center justify-between">
                  <span className="text-[10px] text-[#1e3a5f]">
                    {results.complaints.length} complaint{results.complaints.length !== 1 ? 's' : ''} · {results.modules.length} module{results.modules.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-[10px] text-[#1e3a5f]">↵ to navigate · Esc to close</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
        <select aria-label="Select plant" className="hidden md:block text-xs border border-[#bfdbfe] rounded-lg px-2 py-1.5 text-[#1e3a5f] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#15803d]">
          <option>🏭 Plant 1</option><option>🏭 Plant 2</option><option>🏭 All Plants</option>
        </select>
        <div className="w-px h-6 bg-[#dbeafe] mx-1 hidden md:block" />
        <button className="p-2 text-[#1e3a5f] hover:text-[#15803d] hover:bg-[#eff6ff] rounded-lg transition text-base" title="Calendar" aria-label="Calendar">📅</button>
        <button onClick={() => router.push('/notifications')}
          className="relative p-2 text-[#1e3a5f] hover:text-[#15803d] hover:bg-[#eff6ff] rounded-lg transition text-base"
          title="Notifications" aria-label={unreadCount > 0 ? `Notifications — ${unreadCount} unread` : 'Notifications'}>
          🔔
          {unreadCount > 0 && (
            <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-[#0f172a] text-[10px] font-black rounded-full flex items-center justify-center px-1 border-2 border-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
        <button className="p-2 text-[#1e3a5f] hover:text-[#15803d] hover:bg-[#eff6ff] rounded-lg transition text-base" title="Tasks" aria-label="My Tasks">✅</button>
        <div className="w-px h-6 bg-[#dbeafe] mx-1" />
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[#eff6ff] cursor-pointer transition">
          <div className="w-8 h-8 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#15803d] text-xs font-bold flex-shrink-0 border border-[#86efac]">{displayInitials}</div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-[#0f172a] leading-tight">{displayName}</p>
            <p className="text-xs text-[#1e3a5f] leading-tight">{displayRole}</p>
          </div>
        </div>
        <div className="w-px h-6 bg-[#dbeafe] mx-1" />
        <button onClick={handleLogout} disabled={loggingOut} title="Sign Out" aria-label="Sign out of QMOS"
          className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
          <span>{loggingOut ? '⏳' : '🚪'}</span>
          <span className="hidden sm:inline">{loggingOut ? '...' : 'Logout'}</span>
        </button>
      </div>
    </header>
  );
}
