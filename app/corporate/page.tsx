'use client';
import { useState, useEffect, useRef } from 'react';

const PROCESSES = [
  {
    id: 'qrm-data', no: '0', label: 'QRM Data', freq: 'Monthly',
    icon: '📊', clause: 'Corporate Reporting — TACO / TML',
    desc: 'Compile and submit Quality Risk Management (QRM) data to corporate on a monthly basis. Include customer complaints, PPM, warranty, audit NCs, and open CAPAs.',
    activities: [
      'Collect QRM data from all quality functions (Customer, Supplier, Inprocess)',
      'Validate data accuracy with respective HODs',
      'Fill QRM template in prescribed corporate format',
      'Get sign-off from Plant Head / QH before submission',
      'Submit QRM data to corporate before monthly deadline',
      'File submitted copy and acknowledgement in QRM register',
    ],
    docs: ['QRM Data Template', 'Submission Acknowledgement', 'QRM Register', 'Plant Head Sign-off', 'Previous Month QRM (for comparison)'],
    kpis: ['On-time Submission (Y/N)', 'Data Accuracy (%)', 'Last Submission Date', 'Open CAPAs Reported'],
  },
  {
    id: 'plant-ops-mis', no: '1', label: 'Plant Ops MIS — Dharwad', freq: 'Monthly',
    icon: '🏭', clause: 'Corporate Reporting — Plant Operations',
    desc: 'Prepare and submit Plant Operations MIS report for Dharwad plant. Cover production, quality KPIs, manpower, OEE, and material metrics in the defined MIS format.',
    activities: [
      'Collect plant ops data: production output, rejection, OEE, downtime',
      'Compile manpower data from HR',
      'Update quality section: PPM, customer complaints, CAPA status',
      'Prepare MIS in Dharwad plant format',
      'Review with Plant Head and get approval',
      'Submit to corporate MIS team before cut-off date',
    ],
    docs: ['Plant Ops MIS Template (Dharwad)', 'Production Data Sheet', 'Quality KPI Summary', 'Manpower Report', 'Submission Acknowledgement'],
    kpis: ['MIS Submitted On-time (Y/N)', 'OEE (%)', 'Monthly Rejection PPM', 'Downtime (hrs)'],
  },
  {
    id: 'quality-mis-copq', no: '2', label: 'Quality MIS with COPQ & Scrap Sign-off', freq: 'Weekly',
    icon: '💹', clause: 'Internal Reporting — Quality + Finance',
    desc: 'Prepare weekly Quality MIS covering all quality metrics along with Cost of Poor Quality (COPQ) data and scrap value. Obtain sign-off from QH and Finance before circulation.',
    activities: [
      'Collect weekly quality data: rejections, rework, scrap, customer returns',
      'Calculate COPQ components: internal failure, external failure, appraisal',
      'Compile scrap data with part number, qty, and value',
      'Prepare weekly MIS in standard format',
      'Get sign-off from QH and Finance/Plant Head',
      'Circulate to all HODs by Monday morning',
    ],
    docs: ['Weekly Quality MIS Format', 'COPQ Calculation Sheet', 'Scrap Register', 'Sign-off Record', 'MIS Distribution List'],
    kpis: ['MIS On-time (Y/N)', 'COPQ (₹ / week)', 'Scrap Value (₹)', 'Week-on-week Rejection Trend'],
  },
  {
    id: 'weekly-supplier', no: '3', label: 'Weekly Report — Supplier', freq: 'Weekly',
    icon: '🏗️', clause: 'Supplier Quality — Weekly Reporting',
    desc: 'Prepare weekly supplier quality report covering incoming rejections, supplier PPM, SCAR status, and supplier performance rating. Circulate to purchase and QH.',
    activities: [
      'Collect incoming inspection rejection data for the week',
      'Calculate weekly supplier PPM for top suppliers',
      'Update SCAR (Supplier Corrective Action Request) status',
      'Identify top 3 defect-causing suppliers',
      'Prepare weekly supplier report in standard format',
      'Circulate to Purchase HOD and QH by Friday',
    ],
    docs: ['Weekly Supplier Quality Report', 'Incoming Rejection Register', 'Supplier PPM Tracker', 'SCAR Log', 'Supplier Rating Sheet'],
    kpis: ['Supplier PPM (weekly)', 'Incoming Rejection Qty', 'SCARs Open', 'Top Defect Supplier'],
  },
  {
    id: 'weekly-inprocess', no: '4', label: 'Weekly Report — Inprocess', freq: 'Weekly',
    icon: '⚙️', clause: 'Inprocess Quality — Weekly Reporting',
    desc: 'Prepare weekly inprocess quality report covering line rejections, rework, first pass yield, and top defect categories by process/shift. Circulate to production and QH.',
    activities: [
      'Collect inprocess rejection and rework data for the week',
      'Calculate first pass yield (FPY) by process/line',
      'Identify top 3 inprocess defect categories',
      'Review line-wise and shift-wise defect breakdown',
      'Prepare weekly inprocess report in standard format',
      'Circulate to Production HOD, IE, and QH by Friday',
    ],
    docs: ['Weekly Inprocess Quality Report', 'Rejection & Rework Register', 'FPY Calculation Sheet', 'Defect Category Pareto', 'Process-wise Rejection Log'],
    kpis: ['Inprocess Rejection PPM', 'FPY (%)', 'Rework Qty', 'Top Defect Category'],
  },
  {
    id: 'inprocess-weekly2', no: '5', label: 'Inprocess Weekly Report', freq: 'Weekly',
    icon: '📋', clause: 'Inprocess Quality — Detailed Weekly Tracker',
    desc: 'Detailed week-on-week inprocess quality tracker including operation-wise defects, poka-yoke status, control plan compliance, and corrective action update.',
    activities: [
      'Collect operation-wise defect data for the week',
      'Check poka-yoke functionality status at each station',
      'Review control plan compliance for critical operations',
      'Update corrective actions from previous week',
      'Identify recurring defects needing escalation',
      'Present in weekly quality review meeting',
    ],
    docs: ['Inprocess Detailed Weekly Tracker', 'Operation-wise Defect Log', 'Poka-Yoke Status Report', 'Control Plan Compliance Checklist', 'CAPA Update Log'],
    kpis: ['Operation-wise Defect Count', 'Poka-yoke Uptime (%)', 'CP Compliance (%)', 'Recurring Defects'],
  },
  {
    id: 'md-dashboard', no: '6', label: 'MD Dashboard Data', freq: 'Monthly',
    icon: '🎯', clause: 'Corporate Reporting — MD / CEO Level',
    desc: 'Compile monthly data inputs for the MD / CEO Quality Dashboard. Include top-level KPIs: customer PPM, warranty, CAPA closure, audit scores, and objectives status.',
    activities: [
      'Gather MD dashboard KPIs from all quality verticals',
      'Validate numbers with HODs before submission',
      'Prepare one-page MD dashboard in prescribed format',
      'Highlight critical items needing MD attention (red flags)',
      'Get QH / Plant Head review and approval',
      'Submit to MD office / corporate by deadline',
    ],
    docs: ['MD Dashboard Template', 'KPI Summary Sheet', 'Red Flag Report', 'Approval Email', 'MD Dashboard Archive'],
    kpis: ['Dashboard Submitted On-time (Y/N)', 'Red Flags Raised', 'KPIs in Red Zone', 'Last Submission Date'],
  },
  {
    id: 'ifc-quality-ticks', no: '7', label: 'IFC Data & Quality Ticks', freq: 'Monthly',
    icon: '✅', clause: 'Corporate Reporting — Document Control / IFC',
    desc: 'Compile monthly IFC (Internal Format Compliance) audit data and Quality Tick scores. Submit to corporate quality team with improvement actions for non-compliance areas.',
    activities: [
      'Compile IFC audit results for all departments',
      'Calculate IFC compliance score (%) for the month',
      'Collect Quality Tick verification data from audits',
      'Identify areas below target and initiate actions',
      'Prepare IFC + Quality Ticks monthly summary report',
      'Submit to corporate quality / MR by month-end',
    ],
    docs: ['IFC Audit Summary Report', 'Quality Ticks Verification Sheet', 'IFC Score Card', 'Action Plan for Non-compliance', 'Corporate Submission Acknowledgement'],
    kpis: ['IFC Score (%)', 'Quality Ticks Score', 'Non-compliance Areas', 'Actions Closed %'],
  },
  {
    id: 'customer-rating-mis', no: '8', label: 'Send Customer Rating for MIS', freq: 'Monthly',
    icon: '⭐', clause: 'Customer Quality — Corporate MIS Input',
    desc: 'Collect all customer ratings / scorecards received during the month and submit as MIS input to corporate. Cover quality, delivery, responsiveness, and overall rating per customer.',
    activities: [
      'Collect customer scorecards from all customer portals / emails',
      'Compile customer rating summary (quality, delivery, service)',
      'Compare with previous month and identify declining ratings',
      'Prepare customer rating MIS in corporate format',
      'Submit to corporate MIS team before month-end deadline',
      'File ratings in customer scorecard register',
    ],
    docs: ['Customer Rating Summary Sheet', 'Customer Scorecard Copies', 'MIS Input Format', 'Submission Acknowledgement', 'Customer Scorecard Register'],
    kpis: ['Customers Rated', 'Avg Quality Rating', 'Ratings Below Target', 'On-time Submission (Y/N)'],
  },
  {
    id: 'mpcp', no: '9', label: 'MPCP Filled Up', freq: 'Monthly',
    icon: '📝', clause: 'Corporate Requirement — MPCP',
    desc: 'Complete and submit the Monthly Plant Compliance Plan (MPCP) to corporate. Capture all quality compliance activities done during the month with status and evidence.',
    activities: [
      'Download MPCP template from corporate portal',
      'Fill all mandatory sections: audits, training, calibration, PPAP, CAPAs',
      'Attach evidence links / references for each activity',
      'Get Plant Head / MR sign-off on completed MPCP',
      'Submit MPCP to corporate quality / compliance team',
      'File submitted MPCP and acknowledgement in MPCP register',
    ],
    docs: ['MPCP Template', 'MPCP Filled & Signed Copy', 'Evidence Attachments', 'Plant Head Sign-off', 'MPCP Submission Register'],
    kpis: ['MPCP Submitted On-time (Y/N)', 'Compliance Activities Filled %', 'Sections with Gaps', 'Last Submission Date'],
  },
];

const FREQ_COLORS: Record<string, string> = {
  Weekly:  'bg-blue-100 text-blue-800 border-blue-200',
  Monthly: 'bg-green-100 text-green-800 border-green-200',
};

const STATUS_COLORS: Record<string, string> = {
  Done: 'bg-green-100 text-green-700',
  Planned: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
};

interface ActivityLog {
  id: number; process_id: string; process_label: string; activity_step: string;
  log_date: string; owner: string; status: string; remarks: string; evidence: string;
}

interface ProcessDoc {
  id: number; process_id: string; document_name: string; file_name: string;
  uploaded_by: string; uploaded_at: string;
}

// ─── ACTIVITY LOG MODAL ────────────────────────────────────────────────────────
function ActivityLogModal({ process, preStep, onClose, onSuccess }: {
  process: typeof PROCESSES[0]; preStep?: string; onClose: () => void; onSuccess: () => void;
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
        body: JSON.stringify({ processId: process.id, processLabel: process.label, ...form }),
      });
      onSuccess();
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="bg-gray-800 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm">📋 Log Activity — {process.label}</h2>
            <p className="text-gray-400 text-xs mt-0.5">{process.clause}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Activity Step</label>
            <select value={form.activityStep} onChange={e => set('activityStep', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500">
              {process.activities.map(a => <option key={a} value={a}>{a}</option>)}
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
              <input type="date" value={form.logDate} onChange={e => set('logDate', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500">
                <option>Done</option><option>Planned</option><option>Pending</option><option>In Progress</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Owner / Responsible</label>
            <input type="text" value={form.owner} onChange={e => set('owner', e.target.value)}
              placeholder="e.g. Piyush Behere"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Remarks</label>
            <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)}
              rows={3} placeholder="What was submitted, to whom, any issues..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Evidence Reference</label>
            <input type="text" value={form.evidence} onChange={e => set('evidence', e.target.value)}
              placeholder="e.g. QRM_Jul2026.xlsx, Email to corporate dated 28-Jul"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 bg-gray-800 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-gray-700 disabled:opacity-60">
              {saving ? 'Saving...' : '✓ Save Activity'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DOCUMENT PANEL ────────────────────────────────────────────────────────────
function DocumentPanel({ process, onClose }: { process: typeof PROCESSES[0]; onClose: () => void }) {
  const [docs, setDocs] = useState<ProcessDoc[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [activeDoc, setActiveDoc] = useState('');

  const load = async () => {
    try { const r = await fetch(`/api/process-documents?processId=${process.id}`); const d = await r.json(); setDocs(Array.isArray(d) ? d : []); }
    catch { setDocs([]); }
  };
  useEffect(() => { load(); }, [process.id]);

  const handleUpload = async (docName: string, file: File) => {
    await fetch('/api/process-documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processId: process.id, documentName: docName, fileName: file.name, uploadedBy: 'User' }),
    });
    load();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end">
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col">
        <div className="bg-gray-800 text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="font-bold text-sm">📄 Documents — {process.label}</h2>
            <p className="text-gray-400 text-xs mt-0.5">{process.docs.length} required documents</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {process.docs.map(doc => {
            const uploaded = docs.filter(d => d.document_name === doc);
            return (
              <div key={doc} className="border border-gray-100 rounded-xl p-3 hover:border-gray-300 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="text-gray-400 text-sm mt-0.5">📄</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{doc}</p>
                      {uploaded.length > 0 ? uploaded.map(u => (
                        <div key={u.id} className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">✓ {u.file_name}</span>
                          <span className="text-xs text-gray-400">{u.uploaded_at?.slice(0, 10)}</span>
                          <button onClick={async () => { await fetch(`/api/process-documents?id=${u.id}`, { method: 'DELETE' }); load(); }}
                            className="text-red-400 hover:text-red-600 text-xs">✕</button>
                        </div>
                      )) : <p className="text-xs text-gray-400 mt-0.5">Not yet uploaded</p>}
                    </div>
                  </div>
                  <button onClick={() => { setActiveDoc(doc); fileRef.current?.click(); }}
                    className="text-xs bg-gray-100 text-gray-700 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-200 flex-shrink-0">
                    ↑ Upload
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <input ref={fileRef} type="file" className="hidden" onChange={e => {
          const file = e.target.files?.[0];
          if (file && activeDoc) handleUpload(activeDoc, file);
          e.target.value = '';
        }} />
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <button onClick={onClose} className="w-full bg-gray-800 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function CorporatePage() {
  const [activeTab, setActiveTab] = useState('qrm-data');
  const [activityModal, setActivityModal] = useState<{ process: typeof PROCESSES[0]; preStep?: string } | null>(null);
  const [docPanel, setDocPanel] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [filterMonth, setFilterMonth] = useState('');

  const active = PROCESSES.find(p => p.id === activeTab) || PROCESSES[0];
  const weeklyCount = PROCESSES.filter(p => p.freq === 'Weekly').length;
  const monthlyCount = PROCESSES.filter(p => p.freq === 'Monthly').length;

  const loadLogs = async (pid: string) => {
    try { const r = await fetch(`/api/activity-logs?processId=${pid}`); const d = await r.json(); setActivityLogs(Array.isArray(d) ? d : []); }
    catch { setActivityLogs([]); }
  };
  useEffect(() => { loadLogs(activeTab); }, [activeTab]);

  const deleteLog = async (id: number) => {
    await fetch(`/api/activity-logs?id=${id}`, { method: 'DELETE' });
    loadLogs(activeTab);
  };

  const months: string[] = [];
  const mDate = new Date();
  for (let i = 0; i < 12; i++) {
    months.push(`${mDate.getFullYear()}-${String(mDate.getMonth() + 1).padStart(2, '0')}`);
    mDate.setMonth(mDate.getMonth() - 1);
  }
  const filteredLogs = filterMonth ? activityLogs.filter(l => l.log_date?.startsWith(filterMonth)) : activityLogs;

  const handleReport = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const rows = activityLogs.map(l =>
      `<tr><td>${l.log_date}</td><td>${l.activity_step}</td><td>${l.owner || '—'}</td><td>${l.status}</td><td>${l.remarks || '—'}</td><td>${l.evidence || '—'}</td></tr>`
    ).join('');
    w.document.write(`<!DOCTYPE html><html><head><title>Corporate Report — ${active.label}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;margin:20px}.hdr{background:#1f2937;color:#fff;padding:16px 20px;border-radius:8px;margin-bottom:20px}h1{color:#fff;font-size:17px;margin:0}p.sub{opacity:.7;font-size:11px;margin:4px 0 0}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;text-align:left;padding:8px 10px;font-size:10px;text-transform:uppercase}td{padding:7px 10px;border-bottom:1px solid #f0f0f0}.btn{background:#1f2937;color:#fff;padding:8px 20px;border:none;border-radius:6px;cursor:pointer;font-size:13px;margin-top:12px}@media print{.btn{display:none}}</style>
      </head><body>
      <div class="hdr"><h1>${active.icon} Corporate Reporting — ${active.label}</h1><p class="sub">${month} &nbsp;|&nbsp; ${active.clause} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-IN')}</p></div>
      <table><thead><tr><th>Date</th><th>Activity</th><th>Owner</th><th>Status</th><th>Remarks</th><th>Evidence</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#888;padding:16px">No activity logged yet.</td></tr>'}</tbody></table>
      <button class="btn" onclick="window.print()">🖨 Print / Save PDF</button></body></html>`);
    w.document.close();
  };

  return (
    <div className="min-h-full bg-gray-50">

      {/* HEADER */}
      <div className="bg-gray-800 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
              <span>QMOS</span><span>›</span><span>Departments</span><span>›</span><span className="text-white">Corporate Reporting</span>
            </div>
            <h1 className="text-xl font-bold">📊 Corporate Reporting / New Initiatives</h1>
            <p className="text-gray-400 text-xs mt-0.5">QRM · MIS · COPQ · MD Dashboard · MPCP · Customer Rating · Weekly Reports</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActivityModal({ process: active })}
              className="bg-white text-gray-800 px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition">
              + Log Activity
            </button>
            <button onClick={handleReport}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:bg-gray-500 transition border border-gray-500">
              📊 Report
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {[
            { label: 'Weekly Reports', value: weeklyCount, color: 'bg-blue-700' },
            { label: 'Monthly Reports', value: monthlyCount, color: 'bg-green-700' },
            { label: 'Total Processes', value: PROCESSES.length, color: 'bg-gray-600' },
            { label: 'Logged This Month', value: activityLogs.filter(l => l.log_date?.startsWith(new Date().toISOString().slice(0, 7))).length, color: 'bg-yellow-700' },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-lg px-4 py-2.5 bg-opacity-80`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-300">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <div className="flex min-w-max px-4 gap-0">
            {PROCESSES.map(p => (
              <button key={p.id} onClick={() => setActiveTab(p.id)}
                className={`flex flex-col items-start px-3 py-2.5 border-b-2 transition-all whitespace-nowrap text-left ${
                  activeTab === p.id ? 'border-gray-800 text-gray-900 bg-gray-50' : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                }`}>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">{p.icon}</span>
                  <span className="text-xs font-semibold">{p.no}. {p.label}</span>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded border mt-1 font-medium ${FREQ_COLORS[p.freq]}`}>{p.freq}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-5 space-y-4">

        {/* Process Card */}
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{active.icon}</span>
                <span className="text-xs text-gray-400 font-mono">Process {active.no}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${FREQ_COLORS[active.freq]}`}>{active.freq}</span>
                {activityLogs.length > 0 && (
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full font-semibold border border-gray-200">{activityLogs.length} logged</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{active.label}</h2>
              <p className="text-xs text-gray-500 mt-1">{active.clause}</p>
              <p className="text-sm text-gray-700 mt-2 max-w-3xl">{active.desc}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              <button onClick={() => setActivityModal({ process: active })}
                className="bg-gray-800 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-700 transition">
                + Log Activity
              </button>
              <button onClick={() => setDocPanel(true)}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">
                📄 Documents
              </button>
              <button onClick={handleReport}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition">
                📊 Report
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* WORKFLOW */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">📋 Activity Workflow — {active.freq}</h3>
            <div className="space-y-2">
              {active.activities.map((act, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-100 transition group">
                  <div className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-gray-700 flex-1">{act}</p>
                  <button onClick={() => setActivityModal({ process: active, preStep: act })}
                    className="opacity-0 group-hover:opacity-100 text-xs text-gray-700 bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-lg font-semibold flex-shrink-0 transition">
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
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">📊 Key KPIs</h3>
              <div className="space-y-2">
                {active.kpis.map((kpi, i) => {
                  const val = i === 0 ? activityLogs.length + ' logged' : i === 1 ? activityLogs.filter(l => l.status === 'Done').length + ' done' : '—';
                  return (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                      <span className="text-xs text-gray-700 font-medium">{kpi}</span>
                      <span className={`text-xs font-bold ${val !== '—' ? 'text-gray-800' : 'text-gray-400'}`}>{val}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">📄 Required Documents</h3>
              <div className="space-y-1.5">
                {active.docs.map((doc, i) => (
                  <div key={i} onClick={() => setDocPanel(true)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group">
                    <span className="text-gray-400 text-xs">📄</span>
                    <span className="text-xs text-gray-700 flex-1">{doc}</span>
                    <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100">Upload ›</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-700 text-white rounded-xl p-4">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-3">⚡ Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: `Log this ${active.freq} submission`, action: () => setActivityModal({ process: active }) },
                  { label: `Upload ${active.docs[0]}`, action: () => setDocPanel(true) },
                  { label: 'Generate activity report', action: handleReport },
                  { label: 'Mark as submitted to corporate', action: () => setActivityModal({ process: active, preStep: active.activities[active.activities.length - 1] }) },
                ].map((s, i) => (
                  <button key={i} onClick={s.action}
                    className="w-full text-left text-xs text-gray-200 hover:text-white bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg transition">
                    💡 {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ACTIVITY LOG TABLE */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-gray-800">Submission Log — {active.label}</h3>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">{filteredLogs.length} entries</span>
            </div>
            <div className="flex gap-2">
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none">
                <option value="">All Months</option>
                {months.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' })}</option>)}
              </select>
              <button onClick={() => setActivityModal({ process: active })}
                className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-700 transition">
                + Add Entry
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
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
                    <p className="text-gray-400 text-sm mb-3">No submission logged yet for this {active.freq} report.</p>
                    <button onClick={() => setActivityModal({ process: active })}
                      className="inline-flex items-center gap-2 bg-gray-800 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition">
                      {active.icon} Log First Submission →
                    </button>
                  </td>
                </tr>
              ) : filteredLogs.map((log, idx) => (
                <tr key={log.id} className={`hover:bg-gray-50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{log.log_date || '—'}</td>
                  <td className="px-4 py-3 text-xs font-medium text-gray-800 max-w-[200px]">{log.activity_step}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{log.owner || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[log.status] || 'bg-gray-100 text-gray-600'}`}>{log.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 max-w-[140px] truncate">{log.evidence || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px]"><span className="line-clamp-2">{log.remarks || '—'}</span></td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => deleteLog(log.id)}
                      className="text-red-400 hover:text-red-600 text-xs hover:bg-red-50 px-2 py-1 rounded transition">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {activityModal && (
        <ActivityLogModal process={activityModal.process} preStep={activityModal.preStep}
          onClose={() => setActivityModal(null)}
          onSuccess={() => { setActivityModal(null); loadLogs(activeTab); }} />
      )}
      {docPanel && <DocumentPanel process={active} onClose={() => setDocPanel(false)} />}
    </div>
  );
}
