'use client';
import { useState, useEffect, useCallback } from 'react';
import PageTitle from '../components/PageTitle';
import Link from 'next/link';
import RoleGuard from '../components/RoleGuard';
import { useSession } from '../hooks/useSession';
import { RBAC_ROLES } from '@/lib/rbac';

// -- Types ---------------------------------------------------------------------
interface ApprovalComplaint {
  id: number;
  complaint_number: string;
  customer_name: string;
  severity: string;
  status: string;
  created_at: string;
  assigned_to: string;
  defect_description: string;
  defect_category: string;
  part_number: string;
  part_name: string;
  approval_status: string;
  approved_by: string;
  approved_at: string;
}

interface ApprovalData {
  pending: ApprovalComplaint[];
  approved: ApprovalComplaint[];
  rejected: ApprovalComplaint[];
  counts: { pending: number; approved: number; rejected: number };
}

const SEV_COLOR: Record<string, string> = {
  Critical: 'bg-red-50 text-red-600 border-red-700/50',
  High:     'bg-orange-900/40 text-orange-600 border-orange-700/50',
  Medium:   'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  Low:      'bg-green-900/40 text-[#15803d] border-green-700/50',
};

const STATUS_DOT: Record<string, string> = {
  'Pending Closure':     'bg-orange-400',
  'Pending Verification':'bg-amber-400',
  'CAPA In Progress':    'bg-blue-400',
};

function daysAgo(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function fmtDate(dateStr: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// -- Reject Modal ---------------------------------------------------------------
function RejectModal({
  complaint, onClose, onConfirm, loading,
}: {
  complaint: ApprovalComplaint;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');
  return (
      <>
      <PageTitle title="Approvals" />
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl">❌</span>
          <div>
            <h3 className="font-bold text-white text-lg">Reject for Revision</h3>
            <p className="text-sm text-[#1e3a5f]">{complaint.complaint_number} — {complaint.customer_name}</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#1e3a5f] mb-1">Reason for rejection <span className="text-red-500">*</span></label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="e.g. Root cause analysis incomplete — please attach 5-Why and fishbone before resubmitting."
            className="w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-[#dbeafe] text-sm text-[#1e3a5f] hover:bg-[#eff6ff] transition"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Rejecting…' : '❌ Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
      </>
  );
}

// -- Pending Card ---------------------------------------------------------------
function PendingCard({
  c, canApprove, onApprove, onReject, actioning,
}: {
  c: ApprovalComplaint;
  canApprove: boolean;
  onApprove: (id: number) => void;
  onReject: (c: ApprovalComplaint) => void;
  actioning: number | null;
}) {
  const days = daysAgo(c.created_at);
  const urgent = days > 7;
  return (
    <div className={`bg-white rounded-xl border-2 ${urgent ? 'border-orange-300 shadow-orange-100' : 'border-[#dbeafe]'} shadow-sm p-5 space-y-3`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/complaints/${c.id}`} className="font-mono text-[#1d4ed8] font-bold text-sm hover:underline text-[#1d4ed8]">
            {c.complaint_number}
          </Link>
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV_COLOR[c.severity] ?? 'bg-white text-[#1e3a5f] border-[#dbeafe]'}`}>
            {c.severity}
          </span>
          <span className="flex items-center gap-1 text-xs text-[#1e3a5f]">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[c.status] ?? 'bg-gray-400'}`} />
            {c.status}
          </span>
        </div>
        <div className={`text-xs font-bold ${urgent ? 'text-orange-600' : 'text-[#1e3a5f]'}`}>
          {urgent ? `⚠️ ${days}d waiting` : `${days}d ago`}
        </div>
      </div>

      {/* Details */}
      <div>
        <p className="font-semibold text-[#0f172a]">{c.customer_name}</p>
        <p className="text-sm text-[#1e3a5f] mt-0.5 line-clamp-2">{c.defect_description}</p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[#1e3a5f]">
        {c.part_number && <span>Part: <span className="font-mono text-[#1e3a5f]">{c.part_number}</span></span>}
        {c.defect_category && <span>Category: <span className="text-[#1e3a5f]">{c.defect_category}</span></span>}
        {c.assigned_to && <span>Assigned: <span className="text-[#1e3a5f]">{c.assigned_to}</span></span>}
      </div>

      {/* IATF note */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
        <strong>IATF 16949 §10.2.3</strong> — Quality Head sign-off required before complaint closure. Verify 8D completion, root cause analysis, CAPA effectiveness, and no recurrence evidence.
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link href={`/complaints/${c.id}`}
          className="px-3 py-1.5 border border-[#dbeafe] rounded-lg text-xs font-medium text-[#1e3a5f] hover:bg-[#eff6ff] transition">
          View 8D Report →
        </Link>
        {canApprove ? (
          <>
            <button
              onClick={() => onApprove(c.id)}
              disabled={actioning === c.id}
              className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
            >
              {actioning === c.id ? 'Processing…' : '✅ Approve for Closure'}
            </button>
            <button
              onClick={() => onReject(c)}
              disabled={actioning === c.id}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
            >
              ❌ Reject
            </button>
          </>
        ) : (
          <div className="flex-1 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <span className="text-amber-600">🔒</span>
            <span className="text-xs text-amber-700">Approval requires Quality Head role</span>
          </div>
        )}
      </div>
    </div>
  );
}

// -- Main Page -----------------------------------------------------------------
export default function ApprovalsPage() {
  return (
    <RoleGuard minLevel={2} deniedMessage="Approval queue requires Auditor access or above.">
      <ApprovalsContent />
    </RoleGuard>
  );
}

function ApprovalsContent() {
  const { session } = useSession();
  const canApprove = !session || session.rbacRole === 'quality_head';
  const approverName = session?.name || session?.email || 'Quality Head';
  const rbacCfg = session ? RBAC_ROLES[session.rbacRole] : null;

  const [data, setData] = useState<ApprovalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [actioning, setActioning] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ApprovalComplaint | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/approvals');
      const d = await r.json();
      setData(d);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg: string, type: 'ok' | 'err') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (id: number) => {
    setActioning(id);
    try {
      const r = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId: id, action: 'approved', approvedBy: approverName }),
      });
      if (!r.ok) throw new Error();
      showToast('✅ Complaint approved for closure — email sent', 'ok');
      await fetchData();
    } catch {
      showToast('❌ Failed to approve — please try again', 'err');
    }
    setActioning(null);
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setActioning(rejectTarget.id);
    try {
      const r = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId: rejectTarget.id, action: 'rejected', approvedBy: approverName, reason }),
      });
      if (!r.ok) throw new Error();
      showToast('Complaint rejected — team notified to revise', 'ok');
      setRejectTarget(null);
      await fetchData();
    } catch {
      showToast('❌ Failed to reject — please try again', 'err');
    }
    setActioning(null);
  };

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      {/* -- Toast -- */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.type === 'ok' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      {/* -- Reject Modal -- */}
      {rejectTarget && (
        <RejectModal
          complaint={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          loading={actioning === rejectTarget.id}
        />
      )}

      {/* -- Header -- */}
      <div className="bg-white border-b border-[#dbeafe] px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-2xl font-bold text-[#1e3a5f]">✅ Approval Queue</h1>
              {data && data.counts.pending > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                  {data.counts.pending} pending
                </span>
              )}
            </div>
            <p className="text-sm text-[#1e3a5f]">Digital Approval Workflow — IATF 16949 Cl. 10.2.3 &amp; Cl. 5.3</p>
          </div>
          <div className="flex items-center gap-3">
            {rbacCfg && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${rbacCfg.bg}`}>
                {rbacCfg.icon} {rbacCfg.label}
              </span>
            )}
            <button onClick={fetchData} className="px-3 py-1.5 border border-[#dbeafe] rounded-lg text-xs text-[#1e3a5f] hover:bg-white/[0.03] transition">
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* -- KPI tiles -- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Pending Approval', value: data?.counts.pending ?? '—', icon: '⏳', cls: 'border-orange-300 text-orange-600', bg: 'bg-orange-900/30', key: 'pending' },
            { label: 'Approved (30d)',   value: data?.counts.approved ?? '—', icon: '✅', cls: 'border-green-300 text-green-600',  bg: 'bg-green-900/30',  key: 'approved' },
            { label: 'Rejected (30d)',   value: data?.counts.rejected ?? '—', icon: '❌', cls: 'border-red-300 text-red-600',     bg: 'bg-red-50',    key: 'rejected' },
          ].map(k => (
            <button key={k.key} onClick={() => setTab(k.key as typeof tab)}
              className={`${k.bg} rounded-xl border-2 ${k.cls} p-4 text-left transition hover:shadow-md ${tab === k.key ? 'ring-2 ring-offset-1 ring-blue-400' : ''}`}>
              <p className="text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide">{k.icon} {k.label}</p>
              <p className={`text-3xl font-bold mt-1 ${k.cls.split(' ')[1]}`}>{k.value}</p>
            </button>
          ))}
        </div>

        {/* -- IATF Compliance banner -- */}
        <div className="bg-[#eff6ff] border border-blue-700/50 rounded-xl px-5 py-4 flex items-start gap-3">
          <span className="text-2xl mt-0.5">📋</span>
          <div className="text-sm text-blue-200 space-y-1">
            <p className="font-bold">IATF 16949 §10.2.3 — Approval Requirement</p>
            <p className="text-[#1d4ed8]">Before closing a complaint, verify: <strong>8D completion</strong> · <strong>root cause confirmed</strong> · <strong>CAPA implemented &amp; effective</strong> · <strong>no recurrence evidence</strong>. Quality Head sign-off is mandatory objective evidence for audit.</p>
          </div>
        </div>

        {/* -- Content -- */}
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3" />
            <span className="text-[#1e3a5f] text-sm">Loading approval queue…</span>
          </div>
        ) : (
          <>
            {/* Pending */}
            {tab === 'pending' && (
              <div className="animate-fadeIn space-y-4">
                {(data?.pending ?? []).length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#dbeafe] p-16 text-center">
                    <p className="text-4xl mb-3">🎉</p>
                    <p className="font-semibold text-[#1e3a5f]">All clear — no pending approvals</p>
                    <p className="text-sm text-[#1e3a5f] mt-1">Complaints at "Pending Closure" status will appear here for sign-off.</p>
                  </div>
                ) : (
                  (data?.pending ?? []).map(c => (
                    <PendingCard
                      key={c.id}
                      c={c}
                      canApprove={canApprove}
                      onApprove={handleApprove}
                      onReject={setRejectTarget}
                      actioning={actioning}
                    />
                  ))
                )}
              </div>
            )}

            {/* Approved */}
            {tab === 'approved' && (
              <div className="animate-fadeIn bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
                {(data?.approved ?? []).length === 0 ? (
                  <div className="p-16 text-center text-[#1e3a5f]">No approvals in the last 30 days.</div>
                ) : (
                  <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead className="bg-[#eff6ff] border-b">
                      <tr>
                        {['Complaint', 'Customer', 'Severity', 'Approved By', 'Approved At'].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbeafe]">
                      {(data?.approved ?? []).map(c => (
                        <tr key={c.id} className="hover:bg-white/[0.03]">
                          <td className="px-4 py-3">
                            <Link href={`/complaints/${c.id}`} className="font-mono text-[#1d4ed8] font-bold hover:underline">{c.complaint_number}</Link>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#1e3a5f]">{c.customer_name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV_COLOR[c.severity] ?? 'bg-white text-[#1e3a5f] border-[#dbeafe]'}`}>{c.severity}</span>
                          </td>
                          <td className="px-4 py-3 text-[#1e3a5f]">{c.approved_by || '—'}</td>
                          <td className="px-4 py-3 text-[#1e3a5f]">{fmtDate(c.approved_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
              </div>
            )}

            {/* Rejected */}
            {tab === 'rejected' && (
              <div className="animate-fadeIn bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
                {(data?.rejected ?? []).length === 0 ? (
                  <div className="p-16 text-center text-[#1e3a5f]">No rejections in the last 30 days.</div>
                ) : (
                  <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead className="bg-[#eff6ff] border-b border-[#dbeafe]">
                      <tr>
                        {['Complaint', 'Customer', 'Severity', 'Status', 'Created'].map((h, i) => (
                          <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-[#1e3a5f] uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dbeafe]">
                      {(data?.rejected ?? []).map(c => (
                        <tr key={c.id} className="hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <Link href={`/complaints/${c.id}`} className="font-mono text-[#1d4ed8] font-bold hover:underline">{c.complaint_number}</Link>
                          </td>
                          <td className="px-4 py-3 font-medium text-[#1e3a5f]">{c.customer_name}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${SEV_COLOR[c.severity] ?? 'bg-white text-[#1e3a5f] border-[#dbeafe]'}`}>{c.severity}</span>
                          </td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-red-900/40 text-red-600 border border-red-700/40 text-xs font-semibold">Rejected</span></td>
                          <td className="px-4 py-3 text-[#1e3a5f]">{fmtDate(c.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                )}
              </div>
            )}
          </>
        )}

        {/* -- Audit Reference -- */}
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5">
          <h3 className="font-bold text-[#1e3a5f] mb-3 text-sm">📎 Audit Checklist — Before Approving</h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              'D1 team formed and documented',
              'D2 problem statement (IS / IS NOT) complete',
              'D3 containment actions implemented with verification',
              'D4 root cause identified (5-Why / Fishbone)',
              'D4 escape point identified and addressed',
              'D5 corrective actions planned with responsibility',
              'D6 corrective actions implemented and verified',
              'D7 recurrence prevention — standard updated',
              'D8 team recognition documented',
              'No same complaint in last 6 months (no recurrence)',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[#1e3a5f]">
                <span className="text-green-500 mt-0.5 shrink-0">☐</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
