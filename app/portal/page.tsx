'use client';

import { useState } from 'react';
import PageTitle from '../components/PageTitle';

// -- Types -----------------------------------------------------
interface PortalComplaint {
  id: string;
  complaint_number: string;
  customer: string;
  customer_name: string;
  customer_ref?: string;
  part_number?: string;
  part_name?: string;
  defect_description: string;
  defect_category?: string;
  severity: string;
  status: string;
  source?: string;
  created_at: string;
  updated_at: string;
  target_response_date?: string;
  target_closure_date?: string;
  actual_closure_date?: string;
  d3_containment?: string;
  d8_congratulations?: string;
  approval_status?: string;
}

// -- Helpers ---------------------------------------------------
function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function severityBadge(s: string) {
  const map: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700 border-red-300',
    High: 'bg-orange-100 text-orange-600 border-orange-300',
    Medium: 'bg-yellow-100 text-yellow-300 border-yellow-300',
    Low: 'bg-green-100 text-[#15803d] border-green-300',
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${map[s] ?? 'bg-white text-[#1e3a5f] border-[#dbeafe]'}`}>{s}</span>;
}

const STATUS_STEPS = [
  { key: 'Open', label: 'Received', icon: '📥' },
  { key: 'Under Investigation', label: 'Investigating', icon: '🔍' },
  { key: 'CAPA In Progress', label: 'CAPA', icon: '🔧' },
  { key: 'Pending Verification', label: 'Verifying', icon: '🧪' },
  { key: 'Pending Closure', label: 'Approving', icon: '✍️' },
  { key: 'Closed', label: 'Closed', icon: '✅' },
];

function ProgressBar({ status }: { status: string }) {
  const idx = STATUS_STEPS.findIndex(s => s.key === status);
  const active = idx === -1 ? 0 : idx;
  return (
      <>
      <PageTitle title="Portal" />
      <div className="flex items-center gap-0 w-full mt-3">
      {STATUS_STEPS.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
              ${i < active ? 'bg-green-500 border-green-500 text-white'
              : i === active ? 'bg-indigo-600 border-indigo-600 text-white ring-4 ring-indigo-100'
              : 'bg-white border-[#dbeafe] text-[#1e3a5f]'}`}>
              {i < active ? '✓' : step.icon}
            </div>
            <span className={`text-[10px] mt-1 font-medium text-center leading-tight
              ${i === active ? 'text-indigo-300' : i < active ? 'text-green-600' : 'text-[#1e3a5f]'}`}>
              {step.label}
            </span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 mb-4 ${i < active ? 'bg-green-400' : 'bg-[#dbeafe]'}`} />
          )}
        </div>
      ))}
    </div>
      </>
  );
}

// -- Submit Complaint Form --------------------------------------
interface SubmitForm {
  customerName: string; customerContact: string; customerRef: string;
  partNumber: string; partName: string; defectDescription: string;
  defectCategory: string; quantityAffected: string; severity: string;
  complaintSource: string;
}
const EMPTY_FORM: SubmitForm = {
  customerName:'', customerContact:'', customerRef:'',
  partNumber:'', partName:'', defectDescription:'',
  defectCategory:'Dimensional', quantityAffected:'', severity:'Medium',
  complaintSource:'Customer Complaint',
};
const CATEGORIES = ['Dimensional','Surface/Cosmetic','Functional','Material','Assembly','Welding','Packaging','Documentation','Other'];
const SEVERITIES = ['Critical','High','Medium','Low'];
const SOURCES    = ['Customer Complaint','Supplier NCR','Internal NCR','Warranty','Field Return','Other'];

function SubmitTab() {
  const [form, setForm]     = useState<SubmitForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState<string | null>(null);
  const [error, setError]           = useState('');
  const sf = (k: keyof SubmitForm) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.customerName.trim() || !form.defectDescription.trim()) {
      setError('Customer name and defect description are required.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName:      form.customerName,
          customerContact:   form.customerContact,
          customerRef:       form.customerRef,
          partNumber:        form.partNumber,
          partName:          form.partName,
          defectDescription: form.defectDescription,
          defectCategory:    form.defectCategory,
          quantityAffected:  Number(form.quantityAffected) || 0,
          severity:          form.severity,
          complaintSource:   form.complaintSource,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Submission failed'); return; }
      setSubmitted(data.complaint_number ?? data.complaintNumber ?? 'Submitted');
      setForm(EMPTY_FORM);
    } catch { setError('Network error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  const inp = (label: string, key: keyof SubmitForm, placeholder = '', required = false) => (
    <div>
      <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <input value={form[key]} onChange={sf(key)} placeholder={placeholder}
        className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:border-indigo-400" />
    </div>
  );

  if (submitted) return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-lg mx-auto">
      <div className="text-5xl mb-4">✅</div>
      <div className="text-xl font-bold text-[#15803d] mb-2">Complaint Submitted</div>
      <div className="text-[#1e3a5f] text-sm mb-4">Your complaint has been logged and assigned to our Quality team.</div>
      <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-xl px-6 py-4 mb-6">
        <div className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-1">Your Reference Number</div>
        <div className="font-mono font-bold text-2xl text-indigo-300">{submitted}</div>
        <div className="text-xs text-[#1e3a5f] mt-1">Use this number to track your complaint status</div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 mb-6 text-left">
        <strong>What happens next:</strong><br />
        Our Quality team will review and acknowledge within 24 hours. You will receive updates as we investigate, contain, and resolve the issue per IATF 16949 §10.2.
      </div>
      <button onClick={() => setSubmitted(null)}
        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
        Submit Another Complaint
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-2xl mx-auto space-y-4">
      <div className="text-sm font-bold text-[#1e3a5f] mb-1">Submit a Quality Complaint</div>
      <p className="text-xs text-[#1e3a5f] -mt-2">All fields marked * are required. Our team will respond within 24 hours.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {inp('Company / Customer Name', 'customerName', 'e.g. Tata Motors Ltd.', true)}
        {inp('Contact Person & Phone', 'customerContact', 'e.g. Rajesh Kumar, +91 98765 43210')}
        {inp('Customer Internal Reference', 'customerRef', 'e.g. PRR-2025-0047')}
        {inp('Part Number', 'partNumber', 'e.g. TML-12345-A')}
        {inp('Part Name / Description', 'partName', 'e.g. Seat Frame LH')}
        {inp('Quantity Affected', 'quantityAffected', 'e.g. 50')}
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Defect Description <span className="text-red-500">*</span></label>
        <textarea value={form.defectDescription} onChange={sf('defectDescription')} rows={3}
          placeholder="Describe the defect clearly — what is wrong, where it was found, how many pieces, when discovered…"
          className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:border-indigo-400 resize-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Defect Category</label>
          <select value={form.defectCategory} onChange={sf('defectCategory')}
            className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:border-indigo-400">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Severity</label>
          <select value={form.severity} onChange={sf('severity')}
            className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:border-indigo-400">
            {SEVERITIES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[#1e3a5f] mb-1">Source</label>
          <select value={form.complaintSource} onChange={sf('complaintSource')}
            className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] focus:outline-none focus:border-indigo-400">
            {SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-700/50 text-red-700 text-sm px-4 py-2 rounded-xl">⚠️ {error}</div>}

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-[#1e3a5f]">By submitting you agree this complaint will be logged in our IATF 16949 QMS.</p>
        <button onClick={handleSubmit} disabled={submitting}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition shadow-md whitespace-nowrap">
          {submitting ? 'Submitting…' : '📤 Submit Complaint'}
        </button>
      </div>
    </div>
  );
}

// -- Main Page -------------------------------------------------
export default function PortalPage() {
  const [portalTab, setPortalTab] = useState<'track' | 'submit'>('track');
  const [mode, setMode] = useState<'number' | 'customer'>('number');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PortalComplaint[] | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<PortalComplaint | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    setSelected(null);
    try {
      const param = mode === 'number' ? `complaint_number=${encodeURIComponent(query.trim())}` : `customer=${encodeURIComponent(query.trim())}`;
      const res = await fetch(`/api/portal?${param}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Lookup failed'); return; }
      if (!Array.isArray(data) || data.length === 0) {
        setError('No complaints found. Please check the reference and try again.');
        return;
      }
      if (data.length === 1) setSelected(data[0]);
      setResults(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* -- Header -- */}
      <div className="px-6 py-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20">
          🔒 Secure Customer &amp; Supplier Portal
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Quality Complaint Portal</h1>
        <p className="text-indigo-700 text-sm max-w-lg mx-auto">
          Track your complaint status in real-time — or submit a new quality concern directly to our QMS.
        </p>
        {/* Tab switcher */}
        <div className="inline-flex gap-2 bg-white/10 p-1 rounded-xl mt-5 border border-white/10">
          <button onClick={() => setPortalTab('track')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${portalTab === 'track' ? 'bg-white text-indigo-700 shadow-md' : 'text-white/70 hover:text-white'}`}>
            🔍 Track Complaint
          </button>
          <button onClick={() => setPortalTab('submit')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${portalTab === 'submit' ? 'bg-white text-indigo-700 shadow-md' : 'text-white/70 hover:text-white'}`}>
            📤 Submit Complaint
          </button>
        </div>
      </div>

      {/* -- Submit Tab -- */}
      {portalTab === 'submit' && (
        <div className="max-w-3xl mx-auto px-4 pb-16">
          <SubmitTab />
        </div>
      )}

      {/* -- Track Tab -- */}
      {portalTab === 'track' && <div className="max-w-3xl mx-auto px-4 pb-16">
        {/* -- Search Card -- */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          {/* Mode toggle */}
          <div className="flex gap-2 mb-5">
            {([['number', '🔢 By Complaint Number'], ['customer', '🏢 By Company Name']] as const).map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setQuery(''); setResults(null); setError(''); setSelected(null); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${mode === m
                  ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-[#1e3a5f] hover:bg-[#dbeafe]'}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder={mode === 'number' ? 'e.g. CC-2025-01-00001' : 'e.g. Maruti Suzuki'}
              className="flex-1 border-2 border-[#dbeafe] focus:border-indigo-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
            />
            <button onClick={handleSearch} disabled={loading || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-md">
              {loading ? '…' : 'Track →'}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-700/50 text-red-700 text-sm px-4 py-3 rounded-xl">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* -- Results List (multiple) -- */}
        {results && results.length > 1 && !selected && (
          <div className="bg-white rounded-2xl shadow-xl p-5 mb-6">
            <div className="text-sm font-bold text-[#1e3a5f] mb-3">{results.length} complaints found — select one to view details:</div>
            <div className="space-y-2">
              {results.map(c => (
                <button key={c.id} onClick={() => setSelected(c)}
                  className="w-full text-left border border-[#dbeafe] hover:border-indigo-400 hover:bg-indigo-900/30 rounded-xl px-4 py-3 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-indigo-700 text-sm">{c.complaint_number}</span>
                      <span className="text-[#1e3a5f] text-xs ml-3">{fmt(c.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {severityBadge(c.severity)}
                      <span className="text-xs bg-white text-[#1e3a5f] px-2 py-0.5 rounded-full font-medium">{c.status}</span>
                    </div>
                  </div>
                  <div className="text-xs text-[#1e3a5f] mt-1 truncate">{c.defect_description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* -- Detail View -- */}
        {selected && (
          <div className="space-y-4">
            {results && results.length > 1 && (
              <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white text-sm flex items-center gap-1 mb-1">
                ← Back to results
              </button>
            )}

            {/* Status Progress */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-mono font-bold text-2xl text-indigo-300">{selected.complaint_number}</div>
                  <div className="text-[#1e3a5f] text-sm mt-0.5">{selected.customer_name} · {fmt(selected.created_at)}</div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {severityBadge(selected.severity)}
                  {selected.approval_status === 'approved' && (
                    <span className="text-[10px] bg-green-100 text-[#15803d] border border-green-300 px-2 py-0.5 rounded-full font-bold">QH Approved ✓</span>
                  )}
                </div>
              </div>
              <ProgressBar status={selected.status} />
            </div>

            {/* Part & Defect */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="font-bold text-[#1e3a5f] mb-4 text-sm uppercase tracking-wide">Complaint Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Part Number', value: selected.part_number },
                  { label: 'Part Name', value: selected.part_name },
                  { label: 'Defect Category', value: selected.defect_category },
                  { label: 'Source', value: selected.source },
                  { label: 'Customer Ref', value: selected.customer_ref },
                  { label: 'Severity', value: selected.severity },
                ].map(f => (
                  <div key={f.label}>
                    <div className="text-xs text-[#1e3a5f] font-medium mb-0.5">{f.label}</div>
                    <div className="font-medium text-[#1e3a5f]">{f.value || '—'}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <div className="text-xs text-[#1e3a5f] font-medium mb-1">Defect Description</div>
                <div className="text-sm text-[#1e3a5f] bg-[#eff6ff] rounded-lg px-3 py-2 leading-relaxed">{selected.defect_description}</div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="font-bold text-[#1e3a5f] mb-4 text-sm uppercase tracking-wide">Key Dates</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: 'Logged On', value: fmt(selected.created_at), icon: '📅' },
                  { label: 'Last Updated', value: fmt(selected.updated_at), icon: '🔄' },
                  { label: 'Target Response', value: fmt(selected.target_response_date), icon: '⏰' },
                  { label: 'Target Closure', value: fmt(selected.target_closure_date), icon: '🎯' },
                  { label: 'Actual Closure', value: fmt(selected.actual_closure_date), icon: selected.actual_closure_date ? '✅' : '⏳' },
                ].map(f => (
                  <div key={f.label} className="flex items-start gap-2">
                    <span className="text-base mt-0.5">{f.icon}</span>
                    <div>
                      <div className="text-xs text-[#1e3a5f] font-medium">{f.label}</div>
                      <div className="font-semibold text-[#1e3a5f]">{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Containment (if available) */}
            {selected.d3_containment && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="font-bold text-[#1e3a5f] mb-2 text-sm uppercase tracking-wide">🛡️ Containment Action Taken</h2>
                <p className="text-sm text-[#1e3a5f] bg-orange-900/30 border border-orange-700/50 rounded-lg px-3 py-2 leading-relaxed">
                  {selected.d3_containment}
                </p>
              </div>
            )}

            {/* Closed message */}
            {selected.status === 'Closed' && (
              <div className="bg-green-900/30 border border-green-300 rounded-2xl p-6 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <div className="font-bold text-[#15803d] text-lg">Complaint Closed</div>
                <div className="text-green-600 text-sm mt-1">
                  {selected.d8_congratulations || 'This complaint has been successfully resolved and closed. Thank you for your feedback.'}
                </div>
                <div className="text-xs text-green-500 mt-2">Closed on: {fmt(selected.actual_closure_date)}</div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-white/40 text-xs py-2">
              This portal provides read-only status updates. For urgent escalations, contact your Quality Representative directly.
            </div>
          </div>
        )}

        {/* -- Info Footer (empty state) -- */}
        {!results && !loading && (
          <div className="grid grid-cols-3 gap-4 mt-2">
            {[
              { icon: '🔐', title: 'Secure', desc: 'Read-only access — no sensitive internal data exposed' },
              { icon: '⚡', title: 'Real-time', desc: 'Status updates as soon as Quality team acts' },
              { icon: '📋', title: 'IATF Compliant', desc: 'Traceable per IATF 16949 §8.5 customer communication' },
            ].map(f => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="font-semibold text-white text-sm">{f.title}</div>
                <div className="text-indigo-700 text-xs mt-1 leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>}
    </div>
  );
}
