'use client';
import { useState, useEffect, useRef } from 'react';

export interface ProcessDef {
  id: string;
  no: string;
  label: string;
  freq: 'Daily' | 'Weekly' | 'Biweekly' | 'Monthly' | 'Quarterly' | 'Six Monthly' | 'Yearly';
  icon: string;
  clause: string;
  desc: string;
  activities: string[];
  docs: string[];
  kpis: string[];
}

export interface DeptConfig {
  id: string;
  label: string;
  icon: string;
  subtitle: string;
  headerBg: string;       // e.g. 'bg-orange-900'
  headerText: string;     // e.g. 'text-orange-600'
  accentBorder: string;   // e.g. 'border-orange-500'
  accentBg: string;       // e.g. 'bg-orange-900/30'
  accentText: string;     // e.g. 'text-orange-200'
  btnBg: string;          // e.g. 'bg-orange-700'
  tabActive: string;      // e.g. 'border-orange-700 text-orange-200 bg-orange-900/30'
}

const FREQ_COLORS: Record<string, string> = {
  Daily:        'bg-red-900/50 text-red-600 border-red-700/50',
  Biweekly:     'bg-cyan-900/50 text-cyan-300 border-cyan-700/50',
  Weekly:       'bg-blue-900/50 text-[#1d4ed8] border-blue-700/50',
  Monthly:      'bg-green-900/50 text-[#15803d] border-green-700/50',
  Quarterly:    'bg-purple-900/50 text-purple-700 border-purple-700/50',
  'Six Monthly':'bg-orange-900/50 text-orange-600 border-orange-700/50',
  Yearly:       'bg-[#eff6ff] text-[#1e3a5f] border-[#dbeafe]',
};

const STATUS_COLORS: Record<string, string> = {
  Done:        'bg-green-900/50 text-green-300',
  Planned:     'bg-blue-900/50 text-[#1d4ed8]',
  Pending:     'bg-yellow-900/50 text-yellow-300',
  'In Progress':'bg-amber-50 text-amber-600',
};

interface ActivityLog {
  id: number; process_id: string; activity_step: string;
  log_date: string; owner: string; status: string; remarks: string; evidence: string;
}

interface ProcessDoc {
  id: number; document_name: string; file_name: string; uploaded_at: string;
}

// -- Activity Log Modal -------------------------------------------------------
function ActivityLogModal({ process, dept, preStep, onClose, onSuccess }: {
  process: ProcessDef; dept: DeptConfig; preStep?: string;
  onClose: () => void; onSuccess: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    activityStep: preStep || process.activities[0],
    logDate: today, owner: '', status: 'Done', remarks: '', evidence: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await fetch('/api/activity-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processId: `${dept.id}__${process.id}`, processLabel: `${dept.label} — ${process.label}`, ...form }),
      });
      onSuccess();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className={`${dept.headerBg} text-white px-6 py-4 rounded-t-2xl flex items-center justify-between`}>
          <div>
            <h2 className="font-bold text-sm">📋 Log Activity — {process.label}</h2>
            <p className={`${dept.headerText} text-xs mt-0.5`}>{process.clause}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Activity Step</label>
            <select value={form.activityStep} onChange={e => set('activityStep', e.target.value)}
              className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
              {process.activities.map(a => <option key={a} value={a}>{a}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Date</label>
              <input type="date" value={form.logDate} onChange={e => set('logDate', e.target.value)}
                className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option>Done</option><option>Planned</option><option>Pending</option><option>In Progress</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Owner / Responsible</label>
            <input type="text" value={form.owner} onChange={e => set('owner', e.target.value)}
              placeholder="e.g. Piyush Behere"
              className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Remarks</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} rows={3}
              placeholder="What was done, findings, gaps..."
              className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Evidence Reference</label>
            <input type="text" value={form.evidence} onChange={e => set('evidence', e.target.value)}
              placeholder="e.g. Report_Jul2026.xlsx, Email ref"
              className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-[#dbeafe] text-[#1e3a5f] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#eff6ff]">Cancel</button>
            <button onClick={save} disabled={saving}
              className={`flex-1 ${dept.headerBg} text-white py-2.5 rounded-xl text-sm font-bold disabled:opacity-60`}>
              {saving ? 'Saving...' : '✓ Save Activity'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Document Panel -----------------------------------------------------------
function DocumentPanel({ process, dept, onClose }: {
  process: ProcessDef; dept: DeptConfig; onClose: () => void;
}) {
  const [docs, setDocs] = useState<ProcessDoc[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeDoc, setActiveDoc] = useState('');
  const pid = `${dept.id}__${process.id}`;

  const load = async () => {
    try { const r = await fetch(`/api/process-documents?processId=${pid}`); const d = await r.json(); setDocs(Array.isArray(d) ? d : []); }
    catch { setDocs([]); }
  };
  useEffect(() => { load(); }, [pid]);

  const upload = async (docName: string, file: File) => {
    await fetch('/api/process-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processId: pid, documentName: docName, fileName: file.name, uploadedBy: 'User' }),
    });
    load();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col">
        <div className={`${dept.headerBg} text-white px-5 py-4 flex items-center justify-between flex-shrink-0`}>
          <div>
            <h2 className="font-bold text-sm">📄 Documents — {process.label}</h2>
            <p className={`${dept.headerText} text-xs mt-0.5`}>{process.docs.length} required documents</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {process.docs.map(doc => {
            const uploaded = docs.filter(d => d.document_name === doc);
            return (
              <div key={doc} className="border border-[#dbeafe] rounded-xl p-3 hover:border-[#dbeafe] transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-[#1e3a5f] mt-0.5">📄</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#1e3a5f]">{doc}</p>
                      {uploaded.length > 0 ? uploaded.map(u => (
                        <div key={u.id} className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs bg-green-900/50 text-[#15803d] px-1.5 py-0.5 rounded font-medium">✓ {u.file_name}</span>
                          <span className="text-xs text-[#1e3a5f]">{u.uploaded_at?.slice(0, 10)}</span>
                          <button onClick={async () => { await fetch(`/api/process-documents?id=${u.id}`, { method: 'DELETE' }); load(); }}
                            className="text-red-600 hover:text-red-600 text-xs">✕</button>
                        </div>
                      )) : <p className="text-xs text-[#1e3a5f] mt-0.5">Not yet uploaded</p>}
                    </div>
                  </div>
                  <button onClick={() => { setActiveDoc(doc); fileRef.current?.click(); }}
                    className="text-xs bg-white text-[#1e3a5f] border border-[#dbeafe] px-2 py-1 rounded-lg hover:bg-[#dbeafe] flex-shrink-0">
                    ↑ Upload
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (file && activeDoc) upload(activeDoc, file);
          e.target.value = '';
        }} />
        <div className="p-4 border-t border-[#dbeafe] flex-shrink-0">
          <button onClick={onClose} className={`w-full ${dept.headerBg} text-white py-2.5 rounded-xl text-sm font-semibold`}>Close</button>
        </div>
      </div>
    </div>
  );
}

// -- Main Template ------------------------------------------------------------
export default function DepartmentPageTemplate({ dept, processes }: { dept: DeptConfig; processes: ProcessDef[] }) {
  const [activeTab, setActiveTab] = useState(processes[0]?.id || '');
  const [activityModal, setActivityModal] = useState<{ process: ProcessDef; preStep?: string } | null>(null);
  const [docPanel, setDocPanel] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [filterMonth, setFilterMonth] = useState('');

  const active = processes.find(p => p.id === activeTab) || processes[0];
  const pid = `${dept.id}__${active?.id}`;

  const freqGroups = ['Daily', 'Weekly', 'Biweekly', 'Monthly', 'Quarterly', 'Six Monthly', 'Yearly'];
  const freqCount = (f: string) => processes.filter(p => p.freq === f).length;
  const summaryFreqs = freqGroups.filter(f => freqCount(f) > 0);

  const loadLogs = async (fullPid: string) => {
    try { const r = await fetch(`/api/activity-logs?processId=${fullPid}`); const d = await r.json(); setActivityLogs(Array.isArray(d) ? d : []); }
    catch { setActivityLogs([]); }
  };
  useEffect(() => { if (active) loadLogs(`${dept.id}__${active.id}`); }, [activeTab]);

  const deleteLog = async (id: number) => {
    await fetch(`/api/activity-logs?id=${id}`, { method: 'DELETE' });
    loadLogs(pid);
  };

  const months: string[] = [];
  const mDate = new Date();
  for (let i = 0; i < 12; i++) {
    months.push(`${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`);
    mDate.setMonth(mDate.getMonth() - 1);
  }
  const filteredLogs = filterMonth ? activityLogs.filter(l => l.log_date?.startsWith(filterMonth)) : activityLogs;

  const handleReport = () => {
    if (!active) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const rows = activityLogs.map(l =>
      `<tr><td>${l.log_date}</td><td>${l.activity_step}</td><td>${l.owner || '—'}</td><td>${l.status}</td><td>${l.remarks || '—'}</td><td>${l.evidence || '—'}</td></tr>`
    ).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>${dept.label} — ${active.label}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}.hdr{background:#1e3a5f;color:#fff;padding:16px 20px;border-radius:8px;margin-bottom:20px}h1{font-size:17px;margin:0}p{opacity:.8;font-size:11px;margin:4px 0 0}table{width:100%;border-collapse:collapse}th{background:#f1f5f9;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase}td{padding:7px 10px;border-bottom:1px solid #f0f0f0}.btn{background:#1e3a5f;color:#fff;padding:8px 20px;border:none;border-radius:6px;cursor:pointer;margin-top:12px}@media print{.btn{display:none}}</style>
      </head><body>
      <div class="hdr"><h1>${active.icon} ${dept.label} — ${active.label}</h1><p>${month} · ${active.clause} · Generated: ${new Date().toLocaleString('en-IN')}</p></div>
      <table><thead><tr><th>Date</th><th>Activity</th><th>Owner</th><th>Status</th><th>Remarks</th><th>Evidence</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#888;padding:16px">No activity logged yet.</td></tr>'}</tbody></table>
      <button class="btn" onclick="window.print()">🖨 Print / Save PDF</button></body></html>`);
    w.document.close();
  };

  if (!active) return null;

  return (
    <div className="min-h-full bg-[#eff6ff]">

      {/* HEADER */}
      <div className={`${dept.headerBg} text-white px-6 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <div className={`flex items-center gap-2 ${dept.headerText} text-xs mb-1`}>
              <span>QMOS</span><span>›</span><span>Departments</span><span>›</span><span className="text-white">{dept.label}</span>
            </div>
            <h1 className="text-xl font-bold">{dept.icon} {dept.label}</h1>
            <p className={`${dept.headerText} text-xs mt-0.5`}>{dept.subtitle}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActivityModal({ process: active })}
              className="bg-white text-white px-4 py-2 rounded-lg text-xs font-bold hover:opacity-90 transition">
              + Log Activity
            </button>
            <button onClick={handleReport}
              className="bg-white/20 text-[#1e3a5f] px-4 py-2 rounded-lg text-xs font-semibold hover:bg-white/30 transition border border-white/30">
              📊 Report
            </button>
          </div>
        </div>

        {/* FREQ SUMMARY */}
        <div className={`grid gap-2 mt-4`} style={{ gridTemplateColumns: `repeat(${Math.min(summaryFreqs.length + 1, 6)}, minmax(0, 1fr))` }}>
          {summaryFreqs.map(f => (
            <div key={f} className="bg-white/10 rounded-lg px-3 py-2">
              <p className="text-xl font-bold">{freqCount(f)}</p>
              <p className={`text-xs ${dept.headerText}`}>{f}</p>
            </div>
          ))}
          <div className="bg-white/10 rounded-lg px-3 py-2">
            <p className="text-xl font-bold">{processes.length}</p>
            <p className={`text-xs ${dept.headerText}`}>Total</p>
          </div>
        </div>
      </div>

      {/* BODY — vertical nav + content */}
      <div className="flex min-h-[calc(100vh-220px)]">

        {/* VERTICAL NAV */}
        <aside className="w-56 flex-shrink-0 bg-white border-r border-[#dbeafe] shadow-sm overflow-y-auto">
          <nav className="py-2">
            {processes.map(p => (
              <button key={p.id} onClick={() => setActiveTab(p.id)}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-all border-l-4 ${
                  activeTab === p.id
                    ? 'border-current bg-[#eff6ff] ' + dept.accentText
                    : 'border-transparent text-[#1e3a5f] hover:bg-[#eff6ff] hover:text-[#0f172a]'
                }`}>
                <span className="text-sm flex-shrink-0 mt-0.5">{p.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold leading-tight">{p.no}. {p.label}</p>
                  <span className={`inline-block text-xs px-1.5 py-0.5 rounded border mt-1 font-medium ${FREQ_COLORS[p.freq]}`}>{p.freq}</span>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* CONTENT */}
        <div className="flex-1 min-w-0 p-5 space-y-4 overflow-y-auto">

        {/* Process Card */}
        <div className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${dept.accentBorder}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{active.icon}</span>
                <span className="text-xs text-[#1e3a5f] font-mono">Process {active.no}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${FREQ_COLORS[active.freq]}`}>{active.freq}</span>
                {activityLogs.length > 0 && (
                  <span className="bg-white text-[#1e3a5f] text-xs px-2 py-0.5 rounded-full font-semibold">{activityLogs.length} logged</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white">{active.label}</h2>
              <p className="text-xs text-[#1e3a5f] mt-1">{active.clause}</p>
              <p className="text-sm text-[#1e3a5f] mt-2 max-w-3xl">{active.desc}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              <button onClick={() => setActivityModal({ process: active })}
                className={`${dept.headerBg} text-white px-3 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition`}>
                + Log Activity
              </button>
              <button onClick={() => setDocPanel(true)}
                className="bg-white text-[#1e3a5f] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#dbeafe] transition">
                📄 Documents
              </button>
              <button onClick={handleReport}
                className="bg-white text-[#1e3a5f] px-3 py-2 rounded-lg text-xs font-semibold hover:bg-[#dbeafe] transition">
                📊 Report
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* WORKFLOW */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-4">📋 Activity Workflow — {active.freq}</h3>
            <div className="space-y-2">
              {active.activities.map((act, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 bg-[#eff6ff] rounded-lg border border-[#dbeafe] hover:border-[#dbeafe] transition group`}>
                  <div className={`w-6 h-6 rounded-full ${dept.headerBg} text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5`}>{i + 1}</div>
                  <p className="text-sm text-[#1e3a5f] flex-1">{act}</p>
                  <button onClick={() => setActivityModal({ process: active, preStep: act })}
                    className="opacity-0 group-hover:opacity-100 text-xs text-[#1e3a5f] bg-[#dbeafe] hover:bg-[#dbeafe] px-2 py-1 rounded-lg font-semibold flex-shrink-0 transition">
                    Log ›
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">
            {/* KPIs */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">📊 Key KPIs</h3>
              <div className="space-y-2">
                {active.kpis.map((kpi, i) => {
                  const val = i === 0 ? activityLogs.length + ' logged' : i === 1 ? activityLogs.filter(l => l.status === 'Done').length + ' done' : '—';
                  return (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-[#eff6ff] rounded-lg">
                      <span className="text-xs text-[#1e3a5f] font-medium">{kpi}</span>
                      <span className={`text-xs font-bold ${val !== '—' ? 'text-[#1d4ed8]' : 'text-[#1e3a5f]'}`}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide mb-3">📄 Required Documents</h3>
              <div className="space-y-1.5">
                {active.docs.map((doc, i) => (
                  <div key={i} onClick={() => setDocPanel(true)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#eff6ff] cursor-pointer group">
                    <span className="text-[#1e3a5f] text-xs">📄</span>
                    <span className="text-xs text-[#1e3a5f] flex-1">{doc}</span>
                    <span className="text-xs text-blue-500 opacity-0 group-hover:opacity-100">Upload ›</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`${dept.headerBg} text-white rounded-xl p-4`}>
              <h3 className={`text-xs font-bold ${dept.headerText} uppercase tracking-wide mb-3`}>⚡ Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: `Log ${active.freq} activity`, fn: () => setActivityModal({ process: active }) },
                  { label: `Upload documents`, fn: () => setDocPanel(true) },
                  { label: `Generate report`, fn: handleReport },
                  { label: `Log last step (done)`, fn: () => setActivityModal({ process: active, preStep: active.activities[active.activities.length - 1] }) },
                ].map((s, i) => (
                  <button key={i} onClick={s.fn}
                    className="w-full text-left text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition">
                    💡 {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVITY LOG TABLE */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-[#dbeafe] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-[#1e3a5f]">Activity Log — {active.label}</h3>
              <span className="text-xs bg-white text-[#1e3a5f] px-2 py-0.5 rounded-full font-semibold">{filteredLogs.length} entries</span>
            </div>
            <div className="flex gap-2">
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                className="text-xs border border-[#dbeafe] rounded-lg px-2 py-1.5 text-[#1e3a5f] focus:outline-none">
                <option value="">All Months</option>
                {months.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>)}
              </select>
              <button onClick={() => setActivityModal({ process: active })}
                className={`${dept.headerBg} text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition`}>
                + Add Entry
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-[#eff6ff] text-xs text-[#1e3a5f] uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2.5 text-left">Date</th>
                <th className="px-4 py-2.5 text-left">Activity</th>
                <th className="px-4 py-2.5 text-left">Owner</th>
                <th className="px-4 py-2.5 text-center">Status</th>
                <th className="px-4 py-2.5 text-left">Evidence</th>
                <th className="px-4 py-2.5 text-left">Remarks</th>
                <th className="px-4 py-2.5 text-center">Del</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-4xl mb-3">{active.icon}</div>
                    <p className="text-[#1e3a5f] text-sm mb-3">No activity logged yet for this {active.freq} process.</p>
                    <button onClick={() => setActivityModal({ process: active })}
                      className={`inline-flex items-center gap-2 ${dept.headerBg} text-white px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition`}>
                      {active.icon} Log First Entry →
                    </button>
                  </td>
                </tr>
              ) : filteredLogs.map((log, idx) => (
                <tr key={log.id} className={`hover:bg-[#eff6ff] transition ${idx % 2 === 0 ? 'bg-white' : 'bg-[#eff6ff]/40'}`}>
                  <td className="px-4 py-3 text-xs text-[#1e3a5f] whitespace-nowrap">{log.log_date || '—'}</td>
                  <td className="px-4 py-3 text-xs font-medium text-[#1e3a5f] max-w-[200px]">{log.activity_step}</td>
                  <td className="px-4 py-3 text-xs text-[#1e3a5f]">{log.owner || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[log.status] || 'bg-white text-[#1e3a5f]'}`}>{log.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#1d4ed8] max-w-[140px] truncate">{log.evidence || '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#1e3a5f] max-w-[180px]"><span className="line-clamp-2">{log.remarks || '—'}</span></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => deleteLog(log.id)}
                      className="text-red-600 hover:text-red-600 text-xs hover:bg-red-900/30 px-2 py-1 rounded transition">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODALS */}
        {activityModal && (
          <ActivityLogModal process={activityModal.process} dept={dept} preStep={activityModal.preStep}
            onClose={() => setActivityModal(null)}
            onSuccess={() => { setActivityModal(null); loadLogs(pid); }} />
        )}
        {docPanel && <DocumentPanel process={active} dept={dept} onClose={() => setDocPanel(false)} />}
        </div>
      </div>
    </div>
  );
}
