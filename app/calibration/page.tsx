'use client';
import { useState, useEffect, useCallback } from 'react';
import PageTitle from '../components/PageTitle';
import RoleGuard from '../components/RoleGuard';

// -- Types ---------------------------------------------------------------------
interface CalibrationEquipment {
  id: string;
  instrument_id: string;
  name: string;
  type: string;
  make: string;
  model: string;
  serial_number: string;
  range_min: number | null;
  range_max: number | null;
  unit: string;
  accuracy: string;
  location: string;
  department: string;
  custodian: string;
  status: string;
  calibration_status: string;
  frequency_months: number;
  last_calibrated: string | null;
  next_due: string | null;
  calibrated_by: string;
  calibration_source: string;
  certificate_number: string;
  created_at: string;
}

interface Summary {
  total: number; calibrated: number; dueSoon: number;
  overdue: number; inCal: number; notRequired: number;
}

interface OverdueItem {
  instrument_id: string; name: string; department: string; next_due: string; days_overdue: number;
}

// -- Helpers -------------------------------------------------------------------
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  'Calibrated':     { label:'Calibrated',     bg:'#dcfce7', text:'#14532d', dot:'#16a34a' },
  'Due Soon':       { label:'Due Soon',        bg:'#fef3c7', text:'#78350f', dot:'#d97706' },
  'Overdue':        { label:'Overdue',         bg:'#fee2e2', text:'#7f1d1d', dot:'#dc2626' },
  'In Calibration': { label:'In Calibration', bg:'#dbeafe', text:'#1e3a5f', dot:'#2563eb' },
  'Not Required':   { label:'Not Required',   bg:'#f1f5f9', text:'#475569', dot:'#94a3b8' },
  'Out of Scope':   { label:'Out of Scope',   bg:'#f1f5f9', text:'#475569', dot:'#94a3b8' },
  'Inactive':       { label:'Inactive',       bg:'#f1f5f9', text:'#475569', dot:'#94a3b8' },
  'Scrapped':       { label:'Scrapped',       bg:'#f1f5f9', text:'#475569', dot:'#94a3b8' },
};

function StatusBadge({ s }: { s: string }) {
  const cfg = STATUS_CONFIG[s] || STATUS_CONFIG['Calibrated'];
  return (
      <>
      <PageTitle title="Calibration" />
      <span style={{ background: cfg.bg, color: cfg.text, padding: '2px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {cfg.label}
    </span>
      </>
  );
}

function daysUntilDue(nextDue: string | null): number | null {
  if (!nextDue) return null;
  return Math.floor((new Date(nextDue).getTime() - Date.now()) / 86_400_000);
}

function fmtDate(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// -- Register Equipment Modal ---------------------------------------------------
function RegisterModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    instrument_id: '', name: '', type: 'Measuring Instrument', make: '', model: '',
    serial_number: '', unit: 'mm', accuracy: '', location: '', department: '',
    custodian: '', frequency_months: 12, last_calibrated: '', next_due: '',
    calibrated_by: '', calibration_source: 'NABL Lab', certificate_number: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  async function submit() {
    if (!form.instrument_id || !form.name) { setErr('Instrument ID and Name are required.'); return; }
    setSaving(true); setErr('');
    try {
      const r = await fetch('/api/calibration', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Save failed'); }
      onSave();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }

  const inp = 'w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const sel = inp + ' bg-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white rounded-t-2xl px-6 py-4 flex justify-between items-center">
          <div>
            <div className="font-bold text-lg">Register Instrument / Equipment</div>
            <div className="text-xs text-indigo-200">IATF 16949 Cl. 7.1.5 — Calibration register</div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Instrument ID *</label>
              <input className={inp} placeholder="CAL-001" value={form.instrument_id} onChange={e=>set('instrument_id',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Instrument Name *</label>
              <input className={inp} placeholder="Vernier Caliper 150mm" value={form.name} onChange={e=>set('name',e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Type</label>
              <select className={sel} value={form.type} onChange={e=>set('type',e.target.value)}>
                {['Measuring Instrument','Gauge','Test Equipment','Machine','Reference Standard','Other'].map(t=><option key={t}>{t}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Make / Brand</label>
              <input className={inp} placeholder="Mitutoyo" value={form.make} onChange={e=>set('make',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Model</label>
              <input className={inp} placeholder="CD-6" value={form.model} onChange={e=>set('model',e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Serial Number</label>
              <input className={inp} placeholder="SN-12345" value={form.serial_number} onChange={e=>set('serial_number',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Unit</label>
              <input className={inp} placeholder="mm" value={form.unit} onChange={e=>set('unit',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Accuracy / Least Count</label>
              <input className={inp} placeholder="0.01 mm" value={form.accuracy} onChange={e=>set('accuracy',e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Department</label>
              <input className={inp} placeholder="Quality" value={form.department} onChange={e=>set('department',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Location</label>
              <input className={inp} placeholder="Quality Lab" value={form.location} onChange={e=>set('location',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Custodian</label>
              <input className={inp} placeholder="Ranjit Kumar" value={form.custodian} onChange={e=>set('custodian',e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Frequency (months)</label>
              <select className={sel} value={form.frequency_months} onChange={e=>set('frequency_months',parseInt(e.target.value))}>
                {[1,3,6,12,24].map(m=><option key={m} value={m}>{m} month{m>1?'s':''}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Last Calibrated</label>
              <input className={inp} type="date" value={form.last_calibrated} onChange={e=>set('last_calibrated',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Next Due Date</label>
              <input className={inp} type="date" value={form.next_due} onChange={e=>set('next_due',e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Calibration Source</label>
              <select className={sel} value={form.calibration_source} onChange={e=>set('calibration_source',e.target.value)}>
                {['NABL Lab','External Agency','Internal','OEM Service'].map(s=><option key={s}>{s}</option>)}
              </select></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Calibrated By</label>
              <input className={inp} placeholder="Triform Lab, Pune" value={form.calibrated_by} onChange={e=>set('calibrated_by',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Certificate Number</label>
              <input className={inp} placeholder="NABL/2024/001" value={form.certificate_number} onChange={e=>set('certificate_number',e.target.value)} /></div>
          </div>
          {err && <div className="text-xs text-red-600 bg-red-50 border border-red-700/40 rounded-lg px-3 py-2">{err}</div>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#dbeafe] text-sm text-[#1e3a5f] hover:bg-white">Cancel</button>
            <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Saving...' : '✅ Register Instrument'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Record Calibration Modal ---------------------------------------------------
function RecordCalModal({ equip, onClose, onSave }: { equip: CalibrationEquipment; onClose: () => void; onSave: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const nextDueDefault = () => {
    const d = new Date(); d.setMonth(d.getMonth() + (equip.frequency_months || 12));
    return d.toISOString().split('T')[0];
  };
  const [form, setForm] = useState({
    calibrated_on: today, next_due: nextDueDefault(),
    calibrated_by: equip.calibrated_by || '',
    calibration_source: equip.calibration_source || 'NABL Lab',
    certificate_number: '', result: 'Pass', remarks: '', created_by: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const inp = 'w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  async function submit() {
    setSaving(true); setErr('');
    try {
      const r = await fetch(`/api/calibration/${equip.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, frequency_months: equip.frequency_months }),
      });
      if (!r.ok) { const d = await r.json(); throw new Error(d.error || 'Save failed'); }
      onSave();
    } catch (e) { setErr((e as Error).message); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-600 text-white rounded-t-2xl px-6 py-4 flex justify-between items-center">
          <div>
            <div className="font-bold">Record Calibration</div>
            <div className="text-xs text-emerald-200">{equip.instrument_id} — {equip.name}</div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Calibrated On *</label>
              <input className={inp} type="date" value={form.calibrated_on} onChange={e=>set('calibrated_on',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Next Due Date *</label>
              <input className={inp} type="date" value={form.next_due} onChange={e=>set('next_due',e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Calibrated By</label>
              <input className={inp} placeholder="Lab / Agency name" value={form.calibrated_by} onChange={e=>set('calibrated_by',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Source</label>
              <select className={inp + ' bg-white'} value={form.calibration_source} onChange={e=>set('calibration_source',e.target.value)}>
                {['NABL Lab','External Agency','Internal','OEM Service'].map(s=><option key={s}>{s}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Certificate Number</label>
              <input className={inp} placeholder="NABL/2024/001" value={form.certificate_number} onChange={e=>set('certificate_number',e.target.value)} /></div>
            <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Result</label>
              <select className={inp + ' bg-white'} value={form.result} onChange={e=>set('result',e.target.value)}>
                <option>Pass</option><option>Fail</option><option>Conditional</option>
              </select></div>
          </div>
          <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Remarks</label>
            <textarea className={inp} rows={2} placeholder="Any remarks or observations..." value={form.remarks} onChange={e=>set('remarks',e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-[#1e3a5f] block mb-1">Recorded By</label>
            <input className={inp} placeholder="Your name" value={form.created_by} onChange={e=>set('created_by',e.target.value)} /></div>
          {err && <div className="text-xs text-red-600 bg-red-50 border border-red-700/40 rounded-lg px-3 py-2">{err}</div>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-[#dbeafe] text-sm text-[#1e3a5f] hover:bg-white">Cancel</button>
            <button onClick={submit} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {saving ? 'Saving...' : '✅ Record Calibration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
function CalibrationContent() {
  const [equipment, setEquipment]     = useState<CalibrationEquipment[]>([]);
  const [summary, setSummary]         = useState<Summary>({ total:0, calibrated:0, dueSoon:0, overdue:0, inCal:0, notRequired:0 });
  const [overdueItems, setOverdue]    = useState<OverdueItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState<string>('all');
  const [search, setSearch]           = useState('');
  const [showRegister, setShowReg]    = useState(false);
  const [recordEquip, setRecordEquip] = useState<CalibrationEquipment | null>(null);
  const [toast, setToast]             = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/calibration');
      const d = await r.json();
      setEquipment(d.equipment ?? []);
      setSummary(d.summary ?? { total:0, calibrated:0, dueSoon:0, overdue:0, inCal:0, notRequired:0 });
      setOverdue(d.overdueItems ?? []);
    } catch { /* retain current data */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const displayed = equipment.filter(e => {
    const matchFilter = filter === 'all' || e.calibration_status.toLowerCase() === filter.toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = !q || e.instrument_id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const calibPct = summary.total > 0 ? Math.round((summary.calibrated / summary.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#eff6ff]">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Modals */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowReg(false)}
          onSave={() => { setShowReg(false); load(); showToast('✅ Instrument registered successfully'); }}
        />
      )}
      {recordEquip && (
        <RecordCalModal
          equip={recordEquip}
          onClose={() => setRecordEquip(null)}
          onSave={() => { setRecordEquip(null); load(); showToast('✅ Calibration recorded successfully'); }}
        />
      )}

      {/* Header */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-screen-xl mx-auto flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">🔧 Calibration Management</h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">IATF Cl.7.1.5</span>
            </div>
            <p className="text-[#1e3a5f] text-sm">Instrument register · Due dates · Calibration history · Traceability records</p>
          </div>
          <button
            onClick={() => setShowReg(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
          >
            + Register Instrument
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6 space-y-5">

        {/* KPI Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label:'Total Instruments', value: summary.total,        color:'#1e3a5f', bg:'#eff6ff', filter:'all' },
            { label:'Calibrated',        value: summary.calibrated,   color:'#15803d', bg:'#f0fdf4', filter:'calibrated' },
            { label:'Due Soon (≤30d)',   value: summary.dueSoon,      color:'#b45309', bg:'#fffbeb', filter:'due soon' },
            { label:'Overdue',           value: summary.overdue,      color:'#dc2626', bg:'#fef2f2', filter:'overdue' },
            { label:'Calibrated %',      value: calibPct+'%',         color: calibPct>=90?'#15803d':calibPct>=70?'#b45309':'#dc2626', bg:'#f8fafc', filter:'all' },
          ].map(t => (
            <button key={t.label} onClick={() => setFilter(t.filter)}
              style={{ background: filter === t.filter ? t.bg : '#0f1a2e', borderColor: filter === t.filter ? t.color+'44' : 'rgba(100,116,139,0.25)' }}
              className="rounded-xl border p-4 text-center cursor-pointer hover:shadow-sm transition-all">
              <div style={{ color: t.color }} className="text-3xl font-bold">{t.value}</div>
              <div className="text-xs text-[#1e3a5f] mt-1">{t.label}</div>
            </button>
          ))}
        </div>

        {/* Overdue Alert */}
        {overdueItems.length > 0 && (
          <div className="bg-red-50 border border-red-700/40 rounded-xl p-4">
            <div className="text-sm font-bold text-red-600 mb-2">🔴 Immediate Action Required — {overdueItems.length} Overdue Instrument{overdueItems.length>1?'s':''} (IATF Cl.7.1.5)</div>
            <div className="space-y-1.5">
              {overdueItems.slice(0,5).map(o => (
                <div key={o.instrument_id} className="flex items-center justify-between text-xs text-red-600 bg-red-900/20 rounded-lg px-3 py-2 border border-red-700/30">
                  <span><strong>{o.instrument_id}</strong> · {o.name} · {o.department}</span>
                  <span className="font-bold text-red-600">{o.days_overdue}d overdue</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters + Search */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-2 flex-wrap">
            {['all','calibrated','due soon','overdue','in calibration'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${filter===f?'bg-indigo-600 text-white':'bg-white border border-[#dbeafe] text-[#1e3a5f] hover:bg-[#eff6ff]'}`}>
                {f}
              </button>
            ))}
          </div>
          <input
            className="ml-auto border border-[#dbeafe] rounded-lg px-3 py-1.5 text-sm w-60 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Search instrument, department..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="bg-white border border-[#dbeafe] rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-[#1e3a5f] text-sm">Loading calibration register...</div>
          ) : displayed.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl mb-3">🔧</div>
              <div className="text-[#1e3a5f] font-medium mb-1">No instruments found</div>
              <div className="text-xs text-[#1e3a5f] mb-4">
                {equipment.length === 0
                  ? 'Run the SQL migration to create calibration tables, then register your first instrument.'
                  : 'Try changing the filter or search term.'}
              </div>
              {equipment.length === 0 && (
                <button onClick={() => setShowReg(true)} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                  + Register First Instrument
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#eff6ff] border-b border-[#dbeafe]">
                    {['Inst. ID','Name','Type','Department','Last Calibrated','Next Due','Frequency','Status','Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map(e => {
                    const days = daysUntilDue(e.next_due);
                    return (
                      <tr key={e.id} className="border-b border-[#dbeafe] hover:bg-white/[0.03] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-300">{e.instrument_id}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-[#1e3a5f]">{e.name}</div>
                          <div className="text-xs text-[#1e3a5f]">{e.make} {e.model} {e.serial_number ? `· SN:${e.serial_number}` : ''}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#1e3a5f]">{e.type || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="text-xs text-[#1e3a5f]">{e.department || '—'}</div>
                          <div className="text-xs text-[#1e3a5f]">{e.location}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#1e3a5f]">{fmtDate(e.last_calibrated)}</td>
                        <td className="px-4 py-3">
                          <div className={`text-xs font-semibold ${days !== null && days < 0 ? 'text-red-600' : days !== null && days <= 30 ? 'text-amber-600' : 'text-[#1e3a5f]'}`}>
                            {fmtDate(e.next_due)}
                          </div>
                          {days !== null && (
                            <div className="text-xs text-[#1e3a5f]">
                              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? 'Due today' : `${days}d left`}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[#1e3a5f]">{e.frequency_months}m</td>
                        <td className="px-4 py-3"><StatusBadge s={e.calibration_status} /></td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setRecordEquip(e)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            Record Cal
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* IATF Reference */}
        <div className="bg-indigo-50 border border-indigo-700/40 rounded-xl p-5">
          <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-3">📋 IATF 16949 Cl. 7.1.5 — Calibration Requirements</div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon:'📏', title:'Traceability', desc:'All calibration must be traceable to national/international standards (NABL accredited labs preferred). Certificate must show traceability chain.' },
              { icon:'📅', title:'Frequency', desc:'Calibration frequency must be defined based on measurement risk, stability, and usage. Review frequency if instruments fail repeatedly.' },
              { icon:'📄', title:'Records (Cl.7.5)', desc:'Retain calibration certificates, records of status, and identification of instruments. Records are objective evidence for auditors.' },
            ].map(r => (
              <div key={r.title} className="bg-white rounded-lg p-4 border border-indigo-700/30">
                <div className="text-2xl mb-2">{r.icon}</div>
                <div className="font-semibold text-sm text-indigo-700 mb-1">{r.title}</div>
                <div className="text-xs text-[#1e3a5f] leading-relaxed">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SQL Setup Notice */}
        {equipment.length === 0 && (
          <div className="bg-amber-950/30 border border-amber-200 rounded-xl p-5">
            <div className="text-sm font-bold text-amber-600 mb-2">⚙️ First-time Setup — Run SQL Migration</div>
            <div className="text-xs text-amber-600 mb-3">The calibration module requires two Supabase tables. Run the SQL below in your Supabase SQL Editor.</div>
            <pre className="bg-black/30 rounded-lg p-3 text-xs text-amber-600 overflow-x-auto whitespace-pre-wrap">{`-- 1. Calibration Equipment Register
CREATE TABLE calibration_equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  instrument_id VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  type VARCHAR(100),
  make VARCHAR(100),
  model VARCHAR(100),
  serial_number VARCHAR(100),
  range_min NUMERIC,
  range_max NUMERIC,
  unit VARCHAR(50),
  accuracy VARCHAR(100),
  location VARCHAR(200),
  department VARCHAR(100),
  custodian VARCHAR(100),
  status VARCHAR(50) DEFAULT 'Active',
  calibration_status VARCHAR(50) DEFAULT 'Calibrated',
  frequency_months INTEGER DEFAULT 12,
  last_calibrated DATE,
  next_due DATE,
  calibrated_by VARCHAR(200),
  calibration_source VARCHAR(100),
  certificate_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Calibration History Records
CREATE TABLE calibration_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES calibration_equipment(id),
  calibrated_on DATE NOT NULL,
  next_due DATE NOT NULL,
  calibrated_by VARCHAR(200),
  calibration_source VARCHAR(100),
  certificate_number VARCHAR(100),
  result VARCHAR(50) DEFAULT 'Pass',
  remarks TEXT,
  created_by VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (recommended)
ALTER TABLE calibration_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_records ENABLE ROW LEVEL SECURITY;`}</pre>
          </div>
        )}

      </div>
    </div>
  );
}

export default function CalibrationPage() {
  return (
    <RoleGuard minLevel={2} deniedMessage="Calibration management requires Auditor level access or above.">
      <CalibrationContent />
    </RoleGuard>
  );
}
