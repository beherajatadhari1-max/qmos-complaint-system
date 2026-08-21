'use client';
import { useQualityKPIs } from '../hooks/useQualityKPIs';

// -- LiveCustomerComplaints ----------------------------------------------------
// Shows per-customer complaint data from Supabase, displayed inside the
// Customer Scorecard Dashboard tab as a "Live Complaints" section.
// -----------------------------------------------------------------------------

export default function LiveCustomerComplaints() {
  const { data, loading, error } = useQualityKPIs();

  if (loading) return (
    <div className="bg-white border border-[#dbeafe] rounded-xl p-5 animate-pulse">
      <div className="h-4 w-48 bg-[#dbeafe] rounded mb-3"/>
      <div className="space-y-2">
        {[1,2,3].map(i=><div key={i} className="h-8 bg-[#dbeafe] rounded"/>)}
      </div>
    </div>
  );

  if (error || !data || data.byCustomer.length === 0) return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
      ⚠️ No live complaint data found in database.
      {error && <span className="text-amber-500 ml-1">({error})</span>}
      <span className="block mt-1 text-amber-500">Add complaints via the Complaints module to see live data here.</span>
    </div>
  );

  const { byCustomer, monthlyTrend, categoryPareto, overview } = data;

  return (
    <div className="space-y-4">
      {/* Live badge */}
      <div className="flex items-center gap-2 text-xs">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-900/50 border border-emerald-700/50 text-[#15803d] font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"/>
          LIVE — Supabase Complaints
        </span>
        <span className="text-[#1e3a5f]">{overview.total} total complaints</span>
      </div>

      {/* Per-customer table */}
      <div className="bg-white border border-[#dbeafe] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#dbeafe] flex items-center justify-between">
          <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Live Complaint Breakdown by Customer</span>
          <span className="text-xs text-[#15803d] font-semibold">● Real Data</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#dbeafe]">
                {['Customer','Total','Open','Critical','PPM (live)','Status'].map(h=>(
                  <th key={h} className="px-3 py-2 text-left text-[#1e3a5f] font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byCustomer.map((c, i) => {
                const hasLivePPM = c.ppm !== null && c.supplied > 0;
                return (
                  <tr key={i} className="border-b border-[#dbeafe] hover:bg-[#dbeafe]/30">
                    <td className="px-3 py-2 font-semibold text-[#1e3a5f] whitespace-nowrap">{c.name}</td>
                    <td className="px-3 py-2 text-[#1e3a5f] font-bold">{c.total}</td>
                    <td className={`px-3 py-2 font-bold ${c.open > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{c.open}</td>
                    <td className={`px-3 py-2 font-bold ${c.critical > 0 ? 'text-red-600' : 'text-[#1e3a5f]'}`}>{c.critical || '—'}</td>
                    <td className="px-3 py-2 font-bold">
                      {hasLivePPM
                        ? <span className={c.ppm! > 1000 ? 'text-red-600' : c.ppm! > 500 ? 'text-amber-600' : 'text-emerald-600'}>{c.ppm!.toLocaleString()}</span>
                        : <span className="text-[#1e3a5f] italic text-xs">supply qty needed</span>
                      }
                    </td>
                    <td className="px-3 py-2">
                      {c.open === 0
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">All Closed</span>
                        : c.critical > 0
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">🚨 Critical Open</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">Open</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly trend */}
      {monthlyTrend.length > 0 && (
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">Monthly Complaint Trend (Live)</div>
          <div className="flex items-end gap-3 h-24">
            {monthlyTrend.map((m, i) => {
              const max = Math.max(...monthlyTrend.map(x => x.complaints), 1);
              const pct = Math.round(m.complaints / max * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-xs font-bold text-[#1e3a5f]">{m.complaints}</span>
                  <div className="w-full rounded-t-md bg-blue-500" style={{height:`${Math.max(pct,4)}%`}}/>
                  <span className="text-[#1e3a5f]" style={{fontSize:'9px'}}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category pareto */}
      {categoryPareto.length > 0 && (
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <div className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">Top Defect Categories (Live Pareto)</div>
          <div className="space-y-2">
            {categoryPareto.map((cat, i) => {
              const max = categoryPareto[0].count;
              const pct = Math.round(cat.count / max * 100);
              const COLORS = ['bg-red-500','bg-orange-500','bg-amber-500','bg-yellow-500','bg-lime-500','bg-green-500','bg-teal-500','bg-blue-500'];
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-[#1e3a5f] w-28 truncate shrink-0">{cat.category}</span>
                  <div className="flex-1 bg-[#dbeafe] rounded-full h-2">
                    <div className={`h-2 rounded-full ${COLORS[i] ?? 'bg-blue-500'}`} style={{width:`${pct}%`}}/>
                  </div>
                  <span className="text-xs font-bold text-[#1e3a5f] w-6 text-right">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
