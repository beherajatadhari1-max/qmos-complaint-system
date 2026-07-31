'use client';
import { useState, useMemo } from 'react';

type NotifCategory = 'complaint' | 'capa' | 'audit' | 'calibration' | 'training' | 'ppap' | 'certification' | 'supplier' | 'document' | 'spc';
type NotifPriority = 'critical' | 'high' | 'medium' | 'low';
type NotifStatus   = 'unread' | 'read' | 'actioned' | 'snoozed';

interface Notification {
  id: string; category: NotifCategory; priority: NotifPriority; status: NotifStatus;
  title: string; message: string; source: string; recipient: string;
  createdAt: string; dueDate?: string; linkedRef?: string;
  escalated: boolean; escalationLevel: 0 | 1 | 2;
}

const CAT_META: Record<NotifCategory, { label: string; icon: string; color: string; bg: string }> = {
  complaint:    { label:'Customer Complaint', icon:'🚨', color:'text-red-400',     bg:'bg-red-900/40 border-red-700/50' },
  capa:         { label:'CAPA',               icon:'🔧', color:'text-orange-400',  bg:'bg-orange-900/40 border-orange-700/50' },
  audit:        { label:'Audit',              icon:'🔍', color:'text-blue-400',    bg:'bg-blue-900/40 border-blue-700/50' },
  calibration:  { label:'Calibration',        icon:'📏', color:'text-yellow-400',  bg:'bg-yellow-900/40 border-yellow-700/50' },
  training:     { label:'Training',           icon:'🎓', color:'text-emerald-400', bg:'bg-emerald-900/40 border-emerald-700/50' },
  ppap:         { label:'PPAP / Launch',      icon:'🚀', color:'text-cyan-400',    bg:'bg-cyan-900/40 border-cyan-700/50' },
  certification:{ label:'Certification',      icon:'🏅', color:'text-pink-400',    bg:'bg-pink-900/40 border-pink-700/50' },
  supplier:     { label:'Supplier Quality',   icon:'🚚', color:'text-purple-400',  bg:'bg-purple-900/40 border-purple-700/50' },
  document:     { label:'Document Review',    icon:'📄', color:'text-slate-300',   bg:'bg-slate-700 border-slate-600' },
  spc:          { label:'SPC / Process',      icon:'📈', color:'text-teal-400',    bg:'bg-teal-900/40 border-teal-700/50' },
};

const PRIORITY_META: Record<NotifPriority, { label: string; color: string; ring: string }> = {
  critical: { label:'CRITICAL', color:'text-red-400 bg-red-900/40',       ring:'ring-1 ring-red-600' },
  high:     { label:'HIGH',     color:'text-orange-400 bg-orange-900/40', ring:'ring-1 ring-orange-700' },
  medium:   { label:'MEDIUM',   color:'text-yellow-400 bg-yellow-900/40', ring:'' },
  low:      { label:'LOW',      color:'text-slate-400 bg-slate-700',      ring:'' },
};

const STATUS_META: Record<NotifStatus, { label: string; color: string }> = {
  unread:   { label:'Unread',   color:'text-white bg-blue-600' },
  read:     { label:'Read',     color:'text-slate-400 bg-slate-700' },
  actioned: { label:'Actioned', color:'text-emerald-400 bg-emerald-900/40' },
  snoozed:  { label:'Snoozed',  color:'text-yellow-400 bg-yellow-900/30' },
};

const SAMPLE_NOTIFICATIONS: Notification[] = [
  { id:'N001', category:'complaint', priority:'critical', status:'unread', title:'CRITICAL Complaint — TML Line Stoppage', message:'TML has raised a critical complaint (CC-2025-047) — brake bracket dimensional deviation causing line stoppage at their assembly plant. Immediate containment action required within 4 hours per CSR.', source:'Customer Quality', recipient:'Priya Nair', createdAt:'2025-01-28 08:15', dueDate:'2025-01-28', linkedRef:'CC-2025-047', escalated:true, escalationLevel:1 },
  { id:'N002', category:'capa', priority:'high', status:'unread', title:'CAPA Overdue — CAPA-2025-003 (Plating Thickness)', message:'CAPA-2025-003 was due on 2025-01-25 and is now 3 days overdue. Owner: Kiran Desai. Root cause: Plating bath temp out of spec. Verification of effectiveness pending.', source:'CAPA Module', recipient:'Priya Nair', createdAt:'2025-01-28 07:00', dueDate:'2025-01-25', linkedRef:'CAPA-2025-003', escalated:true, escalationLevel:1 },
  { id:'N003', category:'calibration', priority:'high', status:'unread', title:'Calibration Overdue — 8 Instruments Past Due', message:'CAL Batch 1 (VC-01 to VC-04, MC-01 to MC-04) is 13 days past calibration due date. Instruments remain in production service — non-conformance risk per IATF 7.1.5. Remove from service immediately.', source:'Calibration Register', recipient:'Deepak Yadav', createdAt:'2025-01-28 06:00', dueDate:'2025-01-15', linkedRef:'CAL-2025-JAN-B1', escalated:true, escalationLevel:1 },
  { id:'N004', category:'supplier', priority:'high', status:'unread', title:'SCAR Overdue — Precision Fasteners (SNCR-004)', message:'SCAR issued to Precision Fasteners (SUP-023) on 2025-01-14 for M10 Bolt tensile failure. Response was due 2025-01-21. Now 7 days overdue. No response received. Escalate to supplier management and raise alternate source RFQ.', source:'Supplier Quality', recipient:'Kiran Desai', createdAt:'2025-01-28 07:30', dueDate:'2025-01-21', linkedRef:'SNCR-004', escalated:true, escalationLevel:2 },
  { id:'N005', category:'audit', priority:'high', status:'read', title:'Customer Visit in 1 Day — TML SQE Audit', message:'TML SQE team customer audit is scheduled tomorrow (2025-01-29). All preparation checklist items must be completed today. Key items pending: control plan at workstation, sample inspection, PPAP file verification.', source:'Calendar', recipient:'Priya Nair', createdAt:'2025-01-28 06:00', dueDate:'2025-01-29', linkedRef:'CUST-AUDIT-TML-2025-01', escalated:false, escalationLevel:0 },
  { id:'N006', category:'ppap', priority:'high', status:'read', title:'PPAP Submission Due in 17 Days — PN-9901', message:'Level 3 PPAP for PN-9901 (TML Housing Assembly) is due 2025-02-14. Current completion: 6/10 elements done. Pending: Capability study, PSW sign-off, sample dispatch. Assign responsible and expedite.', source:'PPAP Module', recipient:'Priya Nair', createdAt:'2025-01-27 09:00', dueDate:'2025-02-14', linkedRef:'PPAP-PN9901-2025', escalated:false, escalationLevel:0 },
  { id:'N007', category:'certification', priority:'high', status:'read', title:'IATF Surveillance Audit in 13 Days — BSI', message:'BSI IATF 16949 surveillance audit is scheduled 2025-02-10 to 2025-02-11. Ensure all major NC from last audit are closed with objective evidence. Management review must be completed before audit.', source:'Calendar', recipient:'Priya Nair', createdAt:'2025-01-27 08:00', dueDate:'2025-02-10', linkedRef:'CERT-IATF-BSI-2025-SA2', escalated:false, escalationLevel:0 },
  { id:'N008', category:'training', priority:'medium', status:'read', title:'Training Validity Expiring — 3 Operators (Line-1)', message:'Operators OP-14, OP-18, OP-22 on Line-1 have quality awareness training expiring within 30 days. Schedule refresher training before expiry to maintain IATF 7.2 compliance.', source:'Training Module', recipient:'Priya Nair', createdAt:'2025-01-26 10:00', dueDate:'2025-02-15', linkedRef:'TRG-REFRESHER-2025-JAN', escalated:false, escalationLevel:0 },
  { id:'N009', category:'document', priority:'medium', status:'actioned', title:'Document Review Due — WI-Line1-03 (Torque Tightening)', message:'Work Instruction WI-Line1-03 is due for periodic review on 2025-01-31. Document owner: Amit Sharma. Review and update for 4M changes on Line-1 since last revision.', source:'Document Control', recipient:'Amit Sharma', createdAt:'2025-01-25 09:00', dueDate:'2025-01-31', linkedRef:'WI-LINE1-03', escalated:false, escalationLevel:0 },
  { id:'N010', category:'spc', priority:'medium', status:'actioned', title:'SPC Out-of-Control — Bore Dia (Line-2, Station 4)', message:'SPC chart for Bore Diameter (PN-4421, Line-2, Station 4) shows 8 consecutive points on one side of centreline — Rule 2 violation. Cpk dropped to 0.98. Check tool wear, fixture, and material batch.', source:'SPC Module', recipient:'Kiran Desai', createdAt:'2025-01-24 14:30', linkedRef:'SPC-LINE2-S4-BoreDia', escalated:false, escalationLevel:0 },
  { id:'N011', category:'audit', priority:'medium', status:'actioned', title:'Internal Audit Findings Issued — IA-2025-001', message:'2 Minor NCs issued from Internal Audit IA-2025-001. NC-1: Control plan not updated for 4M change on Line-3. NC-2: Calibration records incomplete for BG-03. CAPA to be raised within 7 days per procedure.', source:'Audit Module', recipient:'Priya Nair', createdAt:'2025-01-22 16:00', dueDate:'2025-01-29', linkedRef:'AUDIT-2025-IA-001', escalated:false, escalationLevel:0 },
  { id:'N012', category:'complaint', priority:'low', status:'snoozed', title:'Customer Satisfaction Survey Due — Bosch India Q4', message:'Q4 2024 customer satisfaction survey due to be sent to Bosch India by end of January. Prepare survey form covering quality, delivery, response, and technical support dimensions.', source:'Customer Quality', recipient:'Priya Nair', createdAt:'2025-01-20 10:00', dueDate:'2025-01-31', linkedRef:'CSAT-BOSCH-Q4-2024', escalated:false, escalationLevel:0 },
];

const ESCALATION_RULES = [
  { trigger:'Critical Customer Complaint Not Acknowledged', l1:{ role:'Quality Head', after:'2 hours' }, l2:{ role:'Plant Head', after:'4 hours' }, l3:{ role:'COO / VP Quality', after:'8 hours' }, applicable:'CC-Critical' },
  { trigger:'CAPA Overdue (Past Due Date)', l1:{ role:'Quality Head', after:'Day 1' }, l2:{ role:'Plant Head', after:'Day 3' }, l3:{ role:'Management Team', after:'Day 7' }, applicable:'All CAPA' },
  { trigger:'SCAR No Response from Supplier', l1:{ role:'SQE / Supplier QH', after:'24 hours' }, l2:{ role:'Quality Head', after:'3 days' }, l3:{ role:'Procurement + Plant Head', after:'7 days' }, applicable:'Critical / Major NCR' },
  { trigger:'Calibration Overdue & In Service', l1:{ role:'Quality Inspector', after:'Day 1' }, l2:{ role:'Quality Head', after:'Day 3' }, l3:{ role:'Plant Head', after:'Day 7' }, applicable:'All gauges' },
  { trigger:'PPAP Submission Deadline Not Met', l1:{ role:'Quality Engineer', after:'Day 1' }, l2:{ role:'Quality Head', after:'Day 3' }, l3:{ role:'Plant Head + Customer', after:'Day 5' }, applicable:'All PPAP' },
  { trigger:'Audit NC Not Closed by Due Date', l1:{ role:'Audit Owner', after:'Day 1' }, l2:{ role:'Quality Head', after:'Day 3' }, l3:{ role:'Plant Head', after:'Day 7' }, applicable:'Internal & External NC' },
  { trigger:'SPC Out-of-Control Not Actioned', l1:{ role:'Quality Engineer', after:'2 hours' }, l2:{ role:'Quality Head', after:'4 hours' }, l3:{ role:'Production Head', after:'8 hours' }, applicable:'Safety / Critical CTQ' },
  { trigger:'Certification Expiry < 30 Days No Action', l1:{ role:'Quality Head', after:'Day 1' }, l2:{ role:'Plant Head', after:'Day 3' }, l3:{ role:'MD / Director', after:'Day 7' }, applicable:'IATF / ISO cert' },
];

const RESPONSE_TIMES = [
  { event:'Critical Customer Complaint', containment:'4 hrs',  rca:'24 hrs', ca:'7 days',  close:'30 days' },
  { event:'Major Customer Complaint',    containment:'24 hrs', rca:'48 hrs', ca:'14 days', close:'45 days' },
  { event:'Minor Customer Complaint',    containment:'48 hrs', rca:'5 days', ca:'21 days', close:'60 days' },
  { event:'Critical Supplier NCR (SCAR)',containment:'4 hrs',  rca:'24 hrs', ca:'14 days', close:'30 days' },
  { event:'Major Supplier NCR (SCAR)',   containment:'24 hrs', rca:'48 hrs', ca:'21 days', close:'45 days' },
  { event:'Internal NCR (Audit Finding)',containment:'24 hrs', rca:'3 days', ca:'30 days', close:'45 days' },
  { event:'Calibration Overdue',         containment:'Immediate', rca:'Same day', ca:'7 days', close:'14 days' },
  { event:'PPAP Deadline Risk',          containment:'Notify customer', rca:'24 hrs', ca:'Recovery plan', close:'Per agreement' },
];

function timeAgo(dt: string) {
  const h = Math.floor((Date.now() - new Date(dt).getTime()) / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

function FeedTab({ notifications, onUpdate }: { notifications: Notification[]; onUpdate: (id: string, s: NotifStatus) => void }) {
  const [filterCat, setFilterCat]       = useState('all');
  const [filterPri, setFilterPri]       = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expanded, setExpanded]         = useState<string | null>(null);

  const filtered = useMemo(() =>
    notifications.filter(n =>
      (filterCat === 'all' || n.category === filterCat) &&
      (filterPri === 'all' || n.priority === filterPri) &&
      (filterStatus === 'all' || n.status === filterStatus)
    ).sort((a, b) => {
      const po: Record<NotifPriority, number> = { critical:0, high:1, medium:2, low:3 };
      return po[a.priority] !== po[b.priority] ? po[a.priority] - po[b.priority] : b.createdAt.localeCompare(a.createdAt);
    }), [notifications, filterCat, filterPri, filterStatus]);

  const unread = notifications.filter(n => n.status === 'unread').length;

  return (
    <div className="space-y-4">
      {unread > 0 && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-3 flex items-center gap-3">
          <span className="text-red-400 text-lg">🔔</span>
          <span className="text-red-400 font-medium text-sm">{unread} unread notification{unread > 1 ? 's' : ''} require your attention</span>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Categories</option>
          {Object.entries(CAT_META).map(([v,m]) => <option key={v} value={v}>{m.icon} {m.label}</option>)}
        </select>
        <select value={filterPri} onChange={e => setFilterPri(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Priority</option>
          <option value="critical">🔴 Critical</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">⚪ Low</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="actioned">Actioned</option>
          <option value="snoozed">Snoozed</option>
        </select>
        <span className="text-xs text-slate-500 ml-auto self-center">{filtered.length} notifications</span>
      </div>
      <div className="space-y-2">
        {filtered.map(n => {
          const cat = CAT_META[n.category];
          const pri = PRIORITY_META[n.priority];
          const sta = STATUS_META[n.status];
          const isOpen = expanded === n.id;
          return (
            <div key={n.id} className={`bg-slate-800 rounded-xl border transition-all ${n.status === 'unread' ? 'border-slate-600 ' + pri.ring : 'border-slate-700/50'}`}>
              <button className="w-full text-left p-4" onClick={() => { setExpanded(isOpen ? null : n.id); if (n.status === 'unread') onUpdate(n.id, 'read'); }}>
                <div className="flex flex-wrap items-start gap-2">
                  <span className="text-xl mt-0.5 shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${pri.color}`}>{pri.label}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium border ${cat.bg} ${cat.color}`}>{cat.label}</span>
                      {n.escalated && <span className="text-xs bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded border border-red-700/50">⬆ ESC L{n.escalationLevel}</span>}
                      <span className={`text-xs px-1.5 py-0.5 rounded ${sta.color}`}>{sta.label}</span>
                    </div>
                    <div className={`font-semibold text-sm ${n.status === 'unread' ? 'text-white' : 'text-slate-300'}`}>{n.title}</div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                      <span>👤 {n.recipient}</span>
                      <span>⏱ {timeAgo(n.createdAt)}</span>
                      {n.dueDate && <span className="text-orange-400">📅 Due: {n.dueDate}</span>}
                      {n.linkedRef && <span className="font-mono">{n.linkedRef}</span>}
                    </div>
                  </div>
                  <span className="text-slate-600 text-lg shrink-0">{isOpen ? '▲' : '▼'}</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
                  <p className="text-sm text-slate-300">{n.message}</p>
                  <div className="flex flex-wrap gap-2">
                    {n.status !== 'actioned' && <button onClick={() => onUpdate(n.id, 'actioned')} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded-lg font-medium transition-colors">✅ Mark Actioned</button>}
                    {n.status !== 'snoozed' && n.status !== 'actioned' && <button onClick={() => onUpdate(n.id, 'snoozed')} className="px-3 py-1.5 bg-yellow-800 hover:bg-yellow-700 text-white text-xs rounded-lg font-medium transition-colors">⏰ Snooze</button>}
                    {n.status === 'actioned' && <span className="text-xs text-emerald-400 self-center">✅ Actioned — no further action needed</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-center py-12 text-slate-500">No notifications match the selected filters.</div>}
      </div>
    </div>
  );
}

function EscalationTab() {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <p className="text-sm text-slate-400">Escalation matrix defines who gets notified and when if quality actions are not taken within required timeframes. Aligned to IATF 16949 Cl. 10.2 and customer CSR response time requirements.</p>
      </div>
      {ESCALATION_RULES.map((rule, i) => (
        <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="font-semibold text-white text-sm mb-3">⚠️ {rule.trigger}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            {[
              { label:'Level 1', data:rule.l1, color:'border-yellow-700/50 bg-yellow-900/20' },
              { label:'Level 2', data:rule.l2, color:'border-orange-700/50 bg-orange-900/20' },
              { label:'Level 3', data:rule.l3, color:'border-red-700/50 bg-red-900/20' },
            ].map(lvl => (
              <div key={lvl.label} className={`rounded-lg border p-3 ${lvl.color}`}>
                <div className="font-bold text-slate-400 mb-1">{lvl.label}</div>
                <div className="text-white font-medium">{lvl.data.role}</div>
                <div className="text-slate-400 mt-0.5">After: <span className="text-yellow-400">{lvl.data.after}</span></div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-slate-500">Applicable: {rule.applicable}</div>
        </div>
      ))}
    </div>
  );
}

function ResponseTimesTab() {
  const clauses = [
    { clause:'8.7.1.4', title:'Customer Notification', text:'Notify customer immediately when nonconforming product is shipped.' },
    { clause:'10.2.1',  title:'Nonconformity & CAPA',  text:'React to NC, take action to control and correct. Conduct RCA using appropriate methods.' },
    { clause:'8.4.2.4', title:'Supplier Monitoring',   text:'Monitor supplier performance. React when targets not met. Require corrective action from supplier.' },
    { clause:'7.1.5.1', title:'Calibration',           text:'All monitoring and measuring equipment to be calibrated on schedule. Records to be maintained.' },
    { clause:'9.2.2.4', title:'Internal Audit',        text:'NCs from internal audit to be addressed without undue delay. Corrective action to be completed.' },
    { clause:'5.3.1',   title:'Escalation',            text:'Customer quality concerns to be escalated at appropriate levels within the organization.' },
  ];
  return (
    <div className="space-y-5">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <p className="text-sm text-slate-400">Mandatory response timelines for quality events. Non-compliance triggers escalation per the matrix. These are maximum allowed times — best practice is to close faster.</p>
      </div>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-700/50">
                <th className="text-left text-xs text-slate-400 px-4 py-3">Quality Event</th>
                <th className="text-center text-xs text-slate-400 px-4 py-3">Containment</th>
                <th className="text-center text-xs text-slate-400 px-4 py-3">Root Cause</th>
                <th className="text-center text-xs text-slate-400 px-4 py-3">Corrective Action</th>
                <th className="text-center text-xs text-slate-400 px-4 py-3">Closeout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {RESPONSE_TIMES.map((r, i) => (
                <tr key={i} className="hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-medium text-white">{r.event}</td>
                  <td className="px-4 py-3 text-center text-red-400 font-bold">{r.containment}</td>
                  <td className="px-4 py-3 text-center text-orange-400 font-medium">{r.rca}</td>
                  <td className="px-4 py-3 text-center text-yellow-400">{r.ca}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{r.close}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="text-xs font-bold text-teal-400 uppercase tracking-wide mb-3">IATF 16949 Clause References</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clauses.map((c, i) => (
            <div key={i} className="bg-slate-900/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono bg-teal-900/40 text-teal-400 px-2 py-0.5 rounded border border-teal-700/50">{c.clause}</span>
                <span className="font-medium text-white text-sm">{c.title}</span>
              </div>
              <p className="text-xs text-slate-400">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);

  function handleUpdate(id: string, status: NotifStatus) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status } : n));
  }

  const stats = useMemo(() => ({
    total:     notifications.length,
    unread:    notifications.filter(n => n.status === 'unread').length,
    critical:  notifications.filter(n => n.priority === 'critical' && n.status !== 'actioned').length,
    escalated: notifications.filter(n => n.escalated && n.status !== 'actioned').length,
  }), [notifications]);

  const tabs = ['🔔 Feed', '⬆ Escalation Matrix', '⏱ Response Times'];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-gradient-to-r from-red-950/50 to-slate-900 border-b border-slate-700 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">🔔</span>
                <h1 className="text-2xl font-bold text-white">Notifications</h1>
                {stats.unread > 0 && <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">{stats.unread}</span>}
              </div>
              <p className="text-slate-400 text-sm">Real-time alerts · Escalation management · Response timelines · CAPA & complaint notifications</p>
            </div>
            <button onClick={() => { if (!loaded) { setNotifications(SAMPLE_NOTIFICATIONS); setLoaded(true); } else { setNotifications([]); setLoaded(false); } }}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg font-medium transition-colors">
              {loaded ? '🗑 Clear Sample' : '⚡ Load Sample Data'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label:'Total Alerts',  value: loaded ? `${stats.total}` : '—',     color:'text-white' },
              { label:'Unread',        value: loaded ? `${stats.unread}` : '—',    color: stats.unread > 0 ? 'text-blue-400' : 'text-emerald-400' },
              { label:'Critical Open', value: loaded ? `${stats.critical}` : '—',  color: stats.critical > 0 ? 'text-red-400' : 'text-emerald-400' },
              { label:'Escalated',     value: loaded ? `${stats.escalated}` : '—', color: stats.escalated > 0 ? 'text-orange-400' : 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-700 bg-slate-800/50 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 0 && <FeedTab notifications={notifications} onUpdate={handleUpdate} />}
        {activeTab === 1 && <EscalationTab />}
        {activeTab === 2 && <ResponseTimesTab />}
      </div>
    </div>
  );
}
