'use client';
import { useState, useEffect, useCallback } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';

// -- Types ---------------------------------------------------------------------
type Urgency = 'Critical' | 'High' | 'Medium';

interface PriorityAction {
  rank: number;
  urgency: Urgency;
  icon: string;
  action: string;
  detail: string;
  module: string;
  href: string;
}

interface BriefData {
  date: string;
  shift: string;
  shiftCode: string;
  narrative: string;
  actions: PriorityAction[];
  snapshot: {
    totalOpen: number;
    criticalOpen: number;
    highOpen: number;
    todayCount: number;
    slaBreaches: number;
    nearSLA: number;
    calOverdue: number;
    calThisWeek: number;
    pendingApprovals: number;
    ppm: number;
  };
  waText: string;
  fetchedAt: string;
}

// -- Urgency styles ------------------------------------------------------------
const URG: Record<Urgency, { border: string; badge: string; dot: string; num: string }> = {
  Critical: { border: 'border-l-red-500',    badge: 'bg-red-500/20 text-red-600',     dot: 'bg-red-400',     num: 'bg-red-500/30 text-red-200' },
  High:     { border: 'border-l-orange-500', badge: 'bg-orange-50 text-orange-600', dot: 'bg-orange-400', num: 'bg-orange-50 text-orange-200' },
  Medium:   { border: 'border-l-amber-500',  badge: 'bg-amber-500/20 text-amber-600',   dot: 'bg-amber-400',  num: 'bg-amber-500/30 text-amber-200' },
};

// -- Shift icon ----------------------------------------------------------------
function shiftIcon(code: string) {
  return code === 'Day' ? '☀️' : code === 'Afternoon' ? '🌆' : '🌙';
}

// -- Overall status color ------------------------------------------------------
function statusLevel(snap: BriefData['snapshot']): { label: string; color: string; border: string; bg: string } {
  if (snap.criticalOpen >= 2 || snap.slaBreaches >= 3) return { label: 'CRITICAL', color: 'text-red-600', border: 'border-red-200', bg: 'bg-red-50' };
  if (snap.criticalOpen >= 1 || snap.slaBreaches >= 1 || snap.calOverdue >= 2) return { label: 'AT RISK', color: 'text-orange-600', border: 'border-orange-200', bg: 'bg-orange-950/30' };
  if (snap.highOpen >= 3 || snap.nearSLA >= 2 || snap.calOverdue === 1) return { label: 'CAUTION', color: 'text-amber-600', border: 'border-amber-500/40', bg: 'bg-amber-950/30' };
  return { label: 'STABLE', color: 'text-[#15803d]', border: 'border-emerald-500/40', bg: 'bg-emerald-950/20' };
}

// -- Main Page -----------------------------------------------------------------
export default function DailyBriefPage() {
  const [data, setData]     = useState<BriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [waCopied, setWaCopied] = useState(false);

  const load = useCallback(() => {
    setLoading(true); setError(null);
    fetch('/api/daily-brief')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load daily brief'); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyWA = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.waText).then(() => {
      setWaCopied(true); setTimeout(() => setWaCopied(false), 2000);
    });
  };

  const copyBrief = () => {
    if (!data) return;
    const text = [
      `Quality Daily Brief — ${new Date(data.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
      `Shift: ${data.shift}`,
      ``,
      data.narrative,
      ``,
      `Priority Actions:`,
      ...data.actions.map(a => `${a.rank}. [${a.urgency}] ${a.action} — ${a.detail}`),
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  };

  // -- Loading --
  if (loading) return (
      <>
      <PageTitle title="Daily Brief" />
      <div className="flex-1 bg-[#eff6ff] flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-amber-600 text-sm font-medium">Preparing your daily brief…</p>
        <p className="text-[#1e3a5f] text-xs">Scanning complaints · Calibration · SLA · Approvals</p>
      </div>
    </div>
      </>
  );

  if (error || !data) return (
    <div className="flex-1 bg-[#eff6ff] flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        <p className="text-red-600 text-sm">{error ?? 'No data available'}</p>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Retry</button>
      </div>
    </div>
  );

  const snap   = data.snapshot;
  const status = statusLevel(snap);
  const date   = new Date(data.date);
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-1 bg-[#eff6ff] overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* -- Header -- */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard" className="text-[#1e3a5f] hover:text-[#1e3a5f] text-xs transition">← Dashboard</Link>
              <span className="text-[#1e3a5f] text-xs">/</span>
              <span className="text-[#1e3a5f] text-xs">Daily Brief</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Quality Daily Brief</h1>
            <p className="text-[#1e3a5f] text-sm mt-0.5">
              {shiftIcon(data.shiftCode)} {data.shift} · {dateStr} · Generated {timeStr}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <button onClick={copyBrief}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#f0f9ff] text-[#1e3a5f] rounded-lg hover:bg-[#dbeafe] transition border border-[#dbeafe]">
              {copied ? '✓ Copied!' : '📋 Copy Brief'}
            </button>
            <button onClick={copyWA}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition">
              {waCopied ? '✓ Copied!' : '📱 WhatsApp'}
            </button>
            <button onClick={load}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* -- Status Hero -- */}
        <div className={`rounded-2xl border ${status.border} ${status.bg} p-5`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-center flex-shrink-0">
              <p className={`text-3xl font-black font-mono ${status.color}`}>{status.label}</p>
              <p className="text-xs text-[#1e3a5f] mt-0.5">Quality Status</p>
            </div>
            <div className="w-px h-12 bg-[#f0f9ff]/60 hidden sm:block" />
            <div className="flex-1 grid grid-cols-3 sm:grid-cols-5 gap-3">
              {[
                { label: 'Open',      value: snap.totalOpen,      color: 'text-white' },
                { label: 'Critical',  value: snap.criticalOpen,   color: snap.criticalOpen > 0 ? 'text-red-600' : 'text-[#15803d]' },
                { label: 'SLA Breach',value: snap.slaBreaches,    color: snap.slaBreaches > 0 ? 'text-orange-600' : 'text-[#15803d]' },
                { label: 'Cal OD',    value: snap.calOverdue,     color: snap.calOverdue > 0 ? 'text-amber-600' : 'text-[#15803d]' },
                { label: 'PPM (30d)', value: snap.ppm.toLocaleString(), color: snap.ppm > 500 ? 'text-orange-600' : 'text-[#15803d]' },
              ].map(k => (
                <div key={k.label} className="text-center">
                  <p className={`text-xl font-black font-mono ${k.color}`}>{k.value}</p>
                  <p className="text-[9px] text-[#1e3a5f] uppercase tracking-wide">{k.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* -- AI Narrative -- */}
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-amber-600">🤖</span>
            <span className="text-amber-600 text-sm font-bold">AI Quality Brief</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded font-mono ml-auto">LIVE</span>
          </div>
          <p className="text-amber-100/80 text-sm leading-relaxed">{data.narrative}</p>
        </div>

        {/* -- Priority Actions -- */}
        <div>
          <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
            ⚡ Today's Priority Actions
            <span className="text-xs text-[#1e3a5f] font-normal">({data.actions.length} items)</span>
          </h2>
          <div className="space-y-2">
            {data.actions.map(a => {
              const u = URG[a.urgency];
              return (
                <Link key={a.rank} href={a.href}
                  className={`block bg-white border border-[#dbeafe] border-l-4 ${u.border} rounded-xl px-4 py-3.5 hover:bg-[#dbeafe] transition group`}>
                  <div className="flex items-start gap-3">
                    {/* Rank */}
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5 ${u.num}`}>
                      {a.rank}
                    </div>
                    {/* Icon */}
                    <span className="text-lg flex-shrink-0 mt-0.5">{a.icon}</span>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white group-hover:text-[#1d4ed8] transition">{a.action}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${u.badge}`}>{a.urgency}</span>
                      </div>
                      <p className="text-xs text-[#1e3a5f] mt-0.5 truncate">{a.detail}</p>
                      <p className="text-[10px] text-[#1e3a5f] mt-0.5">→ {a.module}</p>
                    </div>
                    <span className="text-[#1e3a5f] group-hover:text-[#1e3a5f] transition flex-shrink-0 mt-1">›</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* -- Additional snapshot -- */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Additional Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Today\'s New', value: snap.todayCount, sub: 'complaints raised',   icon: '📨', warn: snap.todayCount > 3 },
              { label: 'Near SLA',     value: snap.nearSLA,    sub: 'complaints (25–30d)',  icon: '⚠️', warn: snap.nearSLA > 0 },
              { label: 'Cal This Week',value: snap.calThisWeek,sub: 'instruments due',      icon: '📅', warn: snap.calThisWeek > 0 },
              { label: 'Pending Appr.',value: snap.pendingApprovals, sub: 'need your sign-off', icon: '✍️', warn: snap.pendingApprovals > 0 },
            ].map(k => (
              <div key={k.label} className={`rounded-lg px-3 py-2.5 text-center border ${k.warn ? 'border-amber-500/30 bg-amber-950/20' : 'border-[#dbeafe] bg-[#eff6ff]'}`}>
                <p className="text-lg mb-0.5">{k.icon}</p>
                <p className={`text-xl font-black font-mono ${k.warn ? 'text-amber-600' : 'text-white'}`}>{k.value}</p>
                <p className="text-[9px] text-[#1e3a5f] uppercase tracking-wide leading-tight">{k.label}</p>
                <p className="text-[9px] text-[#1e3a5f]">{k.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* -- WhatsApp preview -- */}
        <div className="bg-white border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[#15803d]">📱</span>
              <span className="text-[#15803d] text-sm font-bold">WhatsApp Standup Message</span>
            </div>
            <button onClick={copyWA} className="text-xs px-2.5 py-1 bg-emerald-700 text-white rounded-lg hover:bg-emerald-600 transition font-medium">
              {waCopied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="text-xs text-[#1e3a5f] whitespace-pre-wrap leading-relaxed font-mono bg-[#eff6ff] rounded-lg p-3 border border-[#dbeafe] max-h-48 overflow-y-auto">
            {data.waText}
          </pre>
        </div>

        {/* -- Quick nav -- */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: '/complaints',      icon: '🚨', label: 'Complaints' },
            { href: '/calibration',     icon: '🔬', label: 'Calibration' },
            { href: '/iatf-compliance', icon: '🛡️', label: 'IATF Status' },
          ].map(l => (
            <Link key={l.href} href={l.href}
              className="bg-white border border-[#dbeafe] rounded-xl px-3 py-3 flex items-center gap-2.5 hover:border-[#bfdbfe] hover:bg-[#dbeafe] transition group">
              <span className="text-base">{l.icon}</span>
              <span className="text-xs font-semibold text-[#1e3a5f] group-hover:text-white">{l.label}</span>
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-[#1e3a5f] pb-2">
          Refresh each morning for an up-to-date quality brief · Data from live Supabase
        </p>
      </div>
    </div>
  );
}
