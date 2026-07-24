'use client';
import { useState } from 'react';

export type LogType = 'Warranty' | 'Customer Rejection' | 'Customer Concern';

interface Props {
  type: LogType;
  onClose: () => void;
  onSuccess: (id: number, complaintNumber: string) => void;
}

const TYPE_CONFIG = {
  'Warranty': {
    icon: '🔄', color: 'bg-blue-900',
    title: 'Log Warranty Claim',
    subtitle: 'Customer warranty return / field failure',
    sourceOptions: ['Warranty Return', 'Dealer Complaint', 'Field Visit', 'Customer Portal', 'Email'],
    defectCategories: ['Functional Failure', 'Noise / Vibration', 'Appearance', 'Fitment Issue', 'Premature Wear', 'Material Failure', 'Assembly Defect', 'Other'],
  },
  'Customer Rejection': {
    icon: '❌', color: 'bg-red-700',
    title: 'Log Customer Rejection',
    subtitle: 'Customer line rejection / PDI rejection / audit rejection',
    sourceOptions: ['Customer Line Rejection', 'PDI Rejection', 'Customer Audit', 'Incoming Inspection', 'Field Return'],
    defectCategories: ['Dimensional', 'Surface Defect', 'Welding', 'Assembly', 'Material', 'Coating/Plating', 'Mixed Parts', 'Functional', 'Packaging', 'Other'],
  },
  'Customer Concern': {
    icon: '📋', color: 'bg-orange-700',
    title: 'Log Customer Concern / PRR',
    subtitle: 'TML PRR / Customer concern / NCR from customer',
    sourceOptions: ['TML Portal', 'TMBSL Portal', 'Email', 'Phone Call', 'Customer Visit', 'Production Line Stoppage'],
    defectCategories: ['Dimensional', 'Surface Defect', 'Welding', 'Assembly', 'Material', 'Functional', 'Safety', 'Regulatory', 'Other'],
  },
};

const today = () => new Date().toISOString().slice(0, 10);

export default function CustomerLogModal({ type, onClose, onSuccess }: Props) {
  const config = TYPE_CONFIG[type];
  const [step, setStep] = useState<'form' | 'generating' | 'done'>('form');
  const [newId, setNewId] = useState<number | null>(null);
  const [newNo, setNewNo] = useState('');
  const [autoGenerate8D, setAutoGenerate8D] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customerName: '', customerContact: '', customerRef: '', complaintSource: config.sourceOptions[0],
    complaintDate: today(), partNumber: '', partName: '', defectDescription: '',
    defectCategory: config.defectCategories[0], quantityAffected: '', totalSupplied: '',
    batchNumber: '', severity: 'High', assignedTo: '', remarks: '',
    // Type-specific
    vehicleNumber: '', warrantyClaimNo: '', prrNumber: '', responseDeadline: '', rejectionStage: 'Customer Line',
  });

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.customerName || !form.defectDescription) return;
    setSubmitting(true);

    // 1. Create complaint
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form, complaintType: type,
        quantityAffected: Number(form.quantityAffected) || 0,
        totalSupplied: Number(form.totalSupplied) || 0,
      }),
    });
    const complaint = await res.json();
    const id = complaint.id;
    const no = complaint.complaint_number;
    setNewId(id); setNewNo(no);

    // 2. Auto-generate 8D if checked
    if (autoGenerate8D) {
      setStep('generating');
      await fetch(`/api/complaints/${id}/8d`, { method: 'POST' });
    }

    setStep('done');
    setSubmitting(false);
    onSuccess(id, no);
  };

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const lbl = 'block text-xs font-semibold text-gray-600 mb-1';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className={`${config.color} text-white px-6 py-4 rounded-t-2xl flex items-center justify-between`}>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{config.icon}</span>
              <h2 className="font-bold text-base">{config.title}</h2>
            </div>
            <p className="text-white/70 text-xs mt-0.5">{config.subtitle}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl">✕</button>
        </div>

        {/* Generating State */}
        {step === 'generating' && (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4 animate-spin">⚙️</div>
            <p className="font-bold text-gray-800 text-lg">Generating 8D Report...</p>
            <p className="text-gray-500 text-sm mt-2">AI is analysing defect and generating D1–D8 automatically</p>
          </div>
        )}

        {/* Done State */}
        {step === 'done' && (
          <div className="p-10 text-center space-y-4">
            <div className="text-5xl">✅</div>
            <p className="font-bold text-gray-800 text-xl">Logged Successfully!</p>
            <p className="text-gray-500 text-sm">{type} logged as <span className="font-mono font-bold text-blue-900">{newNo}</span></p>
            {autoGenerate8D && <p className="text-green-600 text-sm font-semibold">8D Report auto-generated ✓</p>}
            <div className="flex gap-3 justify-center pt-2">
              <a href={`/complaints/${newId}`}
                className="bg-blue-900 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition">
                Open 8D Report →
              </a>
              <button onClick={onClose} className="border border-gray-200 text-gray-600 px-6 py-2.5 rounded-lg text-sm hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        {step === 'form' && (
          <div className="p-6 space-y-5">

            {/* Type-specific fields */}
            {type === 'Warranty' && (
              <div>
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2 border-b border-blue-100 pb-1">Warranty Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Warranty Claim No.</label>
                    <input className={inp} value={form.warrantyClaimNo} onChange={e => set('warrantyClaimNo', e.target.value)} placeholder="e.g. WC-2026-001" /></div>
                  <div><label className={lbl}>Vehicle Number</label>
                    <input className={inp} value={form.vehicleNumber} onChange={e => set('vehicleNumber', e.target.value)} placeholder="e.g. MH12AB1234" /></div>
                </div>
              </div>
            )}

            {type === 'Customer Concern' && (
              <div>
                <p className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-2 border-b border-orange-100 pb-1">PRR / Concern Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>PRR / Reference No.</label>
                    <input className={inp} value={form.prrNumber} onChange={e => set('prrNumber', e.target.value)} placeholder="e.g. TML-PRR-2026-0045" /></div>
                  <div><label className={lbl}>D3 Response Deadline</label>
                    <input type="date" className={inp} value={form.responseDeadline} onChange={e => set('responseDeadline', e.target.value)} /></div>
                </div>
              </div>
            )}

            {type === 'Customer Rejection' && (
              <div>
                <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2 border-b border-red-100 pb-1">Rejection Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Rejection Stage</label>
                    <select className={inp} value={form.rejectionStage} onChange={e => set('rejectionStage', e.target.value)}>
                      {['Customer Line', 'PDI', 'Customer Audit', 'Field / In-use', 'Incoming Inspection'].map(o => <option key={o}>{o}</option>)}
                    </select></div>
                  <div><label className={lbl}>Total Supplied (for PPM)</label>
                    <input type="number" className={inp} value={form.totalSupplied} onChange={e => set('totalSupplied', e.target.value)} placeholder="0" /></div>
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div>
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2 border-b border-blue-100 pb-1">Customer Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Customer Name *</label>
                  <input className={inp} value={form.customerName} onChange={e => set('customerName', e.target.value)} placeholder="e.g. Tata Motors Ltd" /></div>
                <div><label className={lbl}>Complaint / Issue Date *</label>
                  <input type="date" className={inp} value={form.complaintDate} onChange={e => set('complaintDate', e.target.value)} /></div>
                <div><label className={lbl}>Source</label>
                  <select className={inp} value={form.complaintSource} onChange={e => set('complaintSource', e.target.value)}>
                    {config.sourceOptions.map(o => <option key={o}>{o}</option>)}
                  </select></div>
                <div><label className={lbl}>Customer Ref / NCR No.</label>
                  <input className={inp} value={form.customerRef} onChange={e => set('customerRef', e.target.value)} placeholder="Customer reference number" /></div>
              </div>
            </div>

            {/* Part Info */}
            <div>
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2 border-b border-blue-100 pb-1">Part Information</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lbl}>Part Number</label>
                  <input className={inp} value={form.partNumber} onChange={e => set('partNumber', e.target.value)} placeholder="e.g. BRK-0421-LH" /></div>
                <div><label className={lbl}>Part Name</label>
                  <input className={inp} value={form.partName} onChange={e => set('partName', e.target.value)} placeholder="e.g. Seat Assembly LH" /></div>
                <div><label className={lbl}>Batch / Lot Number</label>
                  <input className={inp} value={form.batchNumber} onChange={e => set('batchNumber', e.target.value)} placeholder="e.g. LOT-2026-07-A" /></div>
                <div><label className={lbl}>Defect Category</label>
                  <select className={inp} value={form.defectCategory} onChange={e => set('defectCategory', e.target.value)}>
                    {config.defectCategories.map(o => <option key={o}>{o}</option>)}
                  </select></div>
                <div><label className={lbl}>Qty Rejected (pcs)</label>
                  <input type="number" className={inp} value={form.quantityAffected} onChange={e => set('quantityAffected', e.target.value)} placeholder="0" /></div>
                <div><label className={lbl}>Severity *</label>
                  <select className={inp} value={form.severity} onChange={e => set('severity', e.target.value)}>
                    <option value="Critical">🔴 Critical — Line stoppage / Safety</option>
                    <option value="High">🟠 High — Functional / Major defect</option>
                    <option value="Medium">🟡 Medium — Non-functional / Cosmetic</option>
                    <option value="Low">🟢 Low — Minor</option>
                  </select></div>
              </div>
            </div>

            {/* Defect */}
            <div>
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-2 border-b border-blue-100 pb-1">Defect Details</p>
              <div className="space-y-3">
                <div><label className={lbl}>Defect Description *</label>
                  <textarea className={`${inp} resize-none`} rows={3} value={form.defectDescription}
                    onChange={e => set('defectDescription', e.target.value)}
                    placeholder="Describe the defect — what, where, customer impact, how detected..." /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>Assigned To (Engineer)</label>
                    <input className={inp} value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)} placeholder="Engineer name" /></div>
                  <div><label className={lbl}>Remarks</label>
                    <input className={inp} value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Additional notes" /></div>
                </div>
              </div>
            </div>

            {/* 8D Auto-Generate Toggle */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="font-bold text-sm">Auto-Generate 8D Report</p>
                    <p className="text-blue-200 text-xs">AI will generate D1–D8 automatically after logging</p>
                  </div>
                </div>
                <button
                  onClick={() => setAutoGenerate8D(p => !p)}
                  className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${autoGenerate8D ? 'bg-green-400' : 'bg-blue-700'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${autoGenerate8D ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
              {autoGenerate8D && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {['D1 Team', 'D2 Problem', 'D3 Containment', 'D4 Root Cause', 'D5 CAPA', 'D6 Verify', 'D7 Prevention', 'D8 Closure'].map(d => (
                    <div key={d} className="bg-blue-700/50 rounded-lg px-2 py-1.5 text-center">
                      <span className="text-xs text-blue-100">{d}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={onClose} className="text-gray-500 px-5 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit}
                disabled={submitting || !form.customerName || !form.defectDescription}
                className={`${config.color} text-white px-6 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition disabled:opacity-40`}>
                {submitting ? '⏳ Saving...' : autoGenerate8D ? `${config.icon} Log & Generate 8D` : `${config.icon} Log ${type}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
