'use client';
import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type UserRole = 'quality-head' | 'quality-engineer' | 'quality-inspector' | 'auditor' | 'supplier-quality' | 'viewer';
type UserStatus = 'active' | 'inactive';
type ApprovalStatus = 'approved' | 'conditional' | 'suspended' | 'new';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  lastLogin: string;
  modules: string[];
}

interface Plant {
  id: string;
  name: string;
  code: string;
  location: string;
  lines: string[];
  shifts: string[];
  certifications: string[];
}

interface CustomerMaster {
  id: string;
  name: string;
  code: string;
  contact: string;
  email: string;
  ppmTarget: number;
  currentPPM: number;
  csrDoc: string;
  status: 'active' | 'inactive';
}

interface SupplierMaster {
  id: string;
  name: string;
  code: string;
  commodity: string;
  contact: string;
  email: string;
  approvalStatus: ApprovalStatus;
  grade: 'A' | 'B' | 'C' | 'D';
}

interface PartMaster {
  id: string;
  partNumber: string;
  partName: string;
  customer: string;
  drawingRev: string;
  specification: string;
  ppapStatus: 'approved' | 'provisional' | 'pending' | 'na';
  criticality: 'safety' | 'functional' | 'standard';
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ROLE_META: Record<UserRole, { label: string; color: string; permissions: string[] }> = {
  'quality-head':      { label: 'Quality Head',      color: 'text-purple-400 bg-purple-900/40 border-purple-700/50',  permissions: ['All modules — Full Access', 'User Management', 'Settings Admin', 'Reports & Export', 'Approve PPAP/CAPA/FMEA', 'Management Review'] },
  'quality-engineer':  { label: 'Quality Engineer',   color: 'text-blue-400 bg-blue-900/40 border-blue-700/50',        permissions: ['FMEA / Control Plan — Edit', 'PPAP — Create & Submit', 'CAPA — Raise & Update', 'Supplier Quality — View/Edit', 'SPC / MSA — Full', 'Documents — Edit'] },
  'quality-inspector': { label: 'Quality Inspector',  color: 'text-emerald-400 bg-emerald-900/40 border-emerald-700/50',permissions: ['Incoming Inspection — Full', 'In-Process Inspection — Full', 'Outgoing Inspection — Full', 'NCR — Raise', 'Manufacturing — View', 'Documents — View'] },
  'auditor':           { label: 'Internal Auditor',   color: 'text-orange-400 bg-orange-900/40 border-orange-700/50',  permissions: ['Audit Module — Full', 'IATF / ISO Checklists', 'Findings — Raise & Close', 'CAPA — View', 'Documents — View', 'Reports — View'] },
  'supplier-quality':  { label: 'Supplier Quality',   color: 'text-cyan-400 bg-cyan-900/40 border-cyan-700/50',        permissions: ['Supplier Module — Full', 'NCR/SCAR — Raise & Close', 'Supplier Scorecard', 'Supplier Audit — Conduct', 'IQC — Full', 'Approve Suppliers'] },
  'viewer':            { label: 'Read-Only Viewer',   color: 'text-slate-400 bg-slate-700 border-slate-600',            permissions: ['All modules — View Only', 'Reports — View', 'Dashboards — View', 'No Edit / Approve rights'] },
};

const APPROVAL_COLOR: Record<ApprovalStatus, string> = {
  approved:    'text-emerald-400 bg-emerald-900/40',
  conditional: 'text-yellow-400 bg-yellow-900/40',
  suspended:   'text-red-400 bg-red-900/40',
  new:         'text-slate-400 bg-slate-700',
};

const PPAP_COLOR: Record<string, string> = {
  approved:    'text-emerald-400 bg-emerald-900/40',
  provisional: 'text-yellow-400 bg-yellow-900/40',
  pending:     'text-orange-400 bg-orange-900/40',
  na:          'text-slate-500 bg-slate-800',
};

const CRIT_COLOR: Record<string, string> = {
  safety:     'text-red-400 bg-red-900/40',
  functional: 'text-yellow-400 bg-yellow-900/40',
  standard:   'text-slate-400 bg-slate-800',
};

// ── Sample Data ───────────────────────────────────────────────────────────────
const SAMPLE_USERS: AppUser[] = [
  { id: 'U001', name: 'Priya Nair', email: 'priya.nair@plant.com', role: 'quality-head', department: 'Quality', status: 'active', lastLogin: '2025-01-28', modules: ['All'] },
  { id: 'U002', name: 'Kiran Desai', email: 'kiran.desai@plant.com', role: 'quality-engineer', department: 'Quality', status: 'active', lastLogin: '2025-01-27', modules: ['FMEA','PPAP','Supplier','SPC','CAPA'] },
  { id: 'U003', name: 'Deepak Yadav', email: 'deepak.yadav@plant.com', role: 'quality-inspector', department: 'Quality', status: 'active', lastLogin: '2025-01-28', modules: ['Inspection','NCR','Manufacturing'] },
  { id: 'U004', name: 'Amit Sharma', email: 'amit.sharma@plant.com', role: 'auditor', department: 'Quality', status: 'active', lastLogin: '2025-01-25', modules: ['Audit','CAPA','Documents'] },
  { id: 'U005', name: 'Suresh Patel', email: 'suresh.patel@plant.com', role: 'supplier-quality', department: 'SCM', status: 'active', lastLogin: '2025-01-26', modules: ['Supplier','NCR','IQC'] },
  { id: 'U006', name: 'Ravi Kumar', email: 'ravi.kumar@plant.com', role: 'viewer', department: 'Manufacturing', status: 'inactive', lastLogin: '2024-12-15', modules: ['Dashboard','Reports'] },
];

const SAMPLE_PLANTS: Plant[] = [
  { id: 'P001', name: 'Plant Alpha — Pune', code: 'PUNE-A', location: 'MIDC Chakan, Pune', lines: ['Line-1 (Machining)', 'Line-2 (Assembly)', 'Line-3 (Stamping)'], shifts: ['Shift A (06:00–14:00)', 'Shift B (14:00–22:00)', 'Shift C (22:00–06:00)'], certifications: ['IATF 16949:2016', 'ISO 9001:2015', 'ISO 14001:2015'] },
  { id: 'P002', name: 'Plant Beta — Nashik', code: 'NSK-B', location: 'MIDC Satpur, Nashik', lines: ['Line-4 (Welding)', 'Line-5 (Painting)'], shifts: ['Shift A (06:00–14:00)', 'Shift B (14:00–22:00)'], certifications: ['ISO 9001:2015'] },
];

const SAMPLE_CUSTOMERS: CustomerMaster[] = [
  { id: 'C001', name: 'Tata Motors Ltd', code: 'TML', contact: 'SQE Team', email: 'sqe@tatamotors.com', ppmTarget: 10, currentPPM: 18, csrDoc: 'TML-CSR-Rev4.pdf', status: 'active' },
  { id: 'C002', name: 'Maruti Suzuki India', code: 'MSIL', contact: 'Vendor Dev', email: 'vendordev@maruti.com', ppmTarget: 25, currentPPM: 12, csrDoc: 'MSIL-CSR-Rev2.pdf', status: 'active' },
  { id: 'C003', name: 'Mahindra & Mahindra', code: 'M&M', contact: 'SQA Dept', email: 'sqa@mahindra.com', ppmTarget: 50, currentPPM: 0, csrDoc: 'MM-CSR-Rev1.pdf', status: 'active' },
  { id: 'C004', name: 'Bosch India Ltd', code: 'BOSCH', contact: 'SQM Team', email: 'sqm@bosch.in', ppmTarget: 5, currentPPM: 3, csrDoc: 'BOSCH-CSR-Rev6.pdf', status: 'active' },
];

const SAMPLE_SUPPLIERS: SupplierMaster[] = [
  { id: 'S001', name: 'Apex Plastics Ltd', code: 'SUP-017', commodity: 'Injection Moulding', contact: 'Rajan Shah', email: 'rajan@apexplastics.com', approvalStatus: 'conditional', grade: 'C' },
  { id: 'S002', name: 'Precision Fasteners', code: 'SUP-023', commodity: 'Fasteners & Hardware', contact: 'Mohan Rao', email: 'mohan@precfast.com', approvalStatus: 'suspended', grade: 'D' },
  { id: 'S003', name: 'SteelForge Components', code: 'SUP-008', commodity: 'Forgings & Castings', contact: 'Anjali Mehta', email: 'anjali@steelforge.in', approvalStatus: 'approved', grade: 'A' },
  { id: 'S004', name: 'GlobalSeal India', code: 'SUP-031', commodity: 'Rubber Seals & Gaskets', contact: 'David Thomas', email: 'david@globalseal.in', approvalStatus: 'approved', grade: 'A' },
  { id: 'S005', name: 'Lakshmi Stampings', code: 'SUP-014', commodity: 'Sheet Metal Stampings', contact: 'Vijay Patil', email: 'vijay@lakshmi.co.in', approvalStatus: 'approved', grade: 'B' },
];

const SAMPLE_PARTS: PartMaster[] = [
  { id: 'PT001', partNumber: 'PN-9901', partName: 'Housing Assembly — TML', customer: 'TML', drawingRev: 'D', specification: 'TML-SPEC-9901-Rev4', ppapStatus: 'approved', criticality: 'functional' },
  { id: 'PT002', partNumber: 'PN-4421', partName: 'Bracket Assembly — MSIL', customer: 'MSIL', drawingRev: 'B', specification: 'MSIL-SPEC-4421-Rev2', ppapStatus: 'approved', criticality: 'standard' },
  { id: 'PT003', partNumber: 'PN-7734', partName: 'Caliper Pin — Bosch', customer: 'BOSCH', drawingRev: 'C', specification: 'BOSCH-SPEC-7734-Rev6', ppapStatus: 'approved', criticality: 'safety' },
  { id: 'PT004', partNumber: 'PN-5510', partName: 'Cover Plate — M&M', customer: 'M&M', drawingRev: 'A', specification: 'MM-SPEC-5510-Rev1', ppapStatus: 'provisional', criticality: 'functional' },
  { id: 'PT005', partNumber: 'PN-3380', partName: 'New Model Component', customer: 'TML', drawingRev: 'A', specification: 'TML-SPEC-3380-Rev1', ppapStatus: 'pending', criticality: 'safety' },
];

const ALERT_CONFIG = [
  { event: 'CAPA Overdue', recipients: 'Quality Head + CAPA Owner', frequency: 'Daily', channel: 'Email + Dashboard', status: true },
  { event: 'Calibration Due (30 days)', recipients: 'Quality Inspector + QH', frequency: 'Weekly', channel: 'Email', status: true },
  { event: 'Customer Complaint Received', recipients: 'Quality Head + Customer QE', frequency: 'Immediate', channel: 'Email + WhatsApp', status: true },
  { event: 'NCR Raised on Supplier', recipients: 'Supplier QE + SQH', frequency: 'Immediate', channel: 'Email', status: true },
  { event: 'IATF Certification Expiry (90 days)', recipients: 'Quality Head + Plant Head', frequency: 'Monthly', channel: 'Email', status: true },
  { event: 'PPAP Rejection by Customer', recipients: 'Quality Head + PPAP Owner', frequency: 'Immediate', channel: 'Email', status: true },
  { event: 'Document Review Due (60 days)', recipients: 'Document Owner + QH', frequency: 'Weekly', channel: 'Dashboard', status: true },
  { event: 'SPC Out of Control', recipients: 'Quality Engineer + Shift Supervisor', frequency: 'Immediate', channel: 'Dashboard Alert', status: false },
];

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Users & Roles
// ══════════════════════════════════════════════════════════════════════════════
function UsersTab({ users }: { users: AppUser[] }) {
  const [expandedRole, setExpandedRole] = useState<UserRole | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() =>
    users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())),
    [users, search]);

  if (users.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <div className="text-4xl mb-3">👥</div>
        <div>Load sample data to see Users & Roles</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Role permissions cards */}
      <div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Role Definitions & Permissions</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.entries(ROLE_META) as [UserRole, typeof ROLE_META[UserRole]][]).map(([role, meta]) => (
            <button key={role} onClick={() => setExpandedRole(expandedRole === role ? null : role)}
              className={`text-left rounded-xl border p-3 transition-colors hover:bg-slate-700/30 ${meta.color}`}>
              <div className="font-semibold text-sm">{meta.label}</div>
              <div className="text-xs opacity-70 mt-1">{meta.permissions.length} permission groups</div>
              {expandedRole === role && (
                <div className="mt-2 space-y-1">
                  {meta.permissions.map((p, i) => <div key={i} className="text-xs opacity-80">• {p}</div>)}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">User Register</div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..." className="ml-auto bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-1.5 w-48" />
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-700/50">
                  <th className="text-left text-xs text-slate-400 px-4 py-3">User</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Role</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Department</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Modules</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Last Login</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-slate-700/20">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{u.name}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium ${ROLE_META[u.role].color}`}>
                        {ROLE_META[u.role].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{u.department}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{u.modules.join(', ')}</td>
                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">{u.lastLogin}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded ${u.status === 'active' ? 'text-emerald-400 bg-emerald-900/40' : 'text-slate-500 bg-slate-800'}`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Plant, Customer & Supplier Masters
// ══════════════════════════════════════════════════════════════════════════════
function MastersTab({ plants, customers, suppliers, parts }: {
  plants: Plant[]; customers: CustomerMaster[]; suppliers: SupplierMaster[]; parts: PartMaster[];
}) {
  const [sub, setSub] = useState<'plant' | 'customer' | 'supplier' | 'part'>('plant');

  const empty = plants.length === 0;
  if (empty) return <div className="text-center py-16 text-slate-500"><div className="text-4xl mb-3">🏭</div><div>Load sample data to see master data</div></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['plant','customer','supplier','part'] as const).map(s => (
          <button key={s} onClick={() => setSub(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sub === s ? 'bg-teal-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {s === 'plant' ? '🏭 Plants' : s === 'customer' ? '🤝 Customers' : s === 'supplier' ? '🚚 Suppliers' : '🔩 Parts'}
          </button>
        ))}
      </div>

      {/* Plant */}
      {sub === 'plant' && (
        <div className="space-y-3">
          {plants.map(p => (
            <div key={p.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">🏭</span>
                <div>
                  <div className="font-semibold text-white">{p.name}</div>
                  <div className="text-xs text-slate-500">Code: <span className="font-mono text-teal-400">{p.code}</span> · {p.location}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-slate-500 mb-1.5 font-medium">Production Lines</div>
                  {p.lines.map((l, i) => <div key={i} className="text-slate-300">• {l}</div>)}
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-slate-500 mb-1.5 font-medium">Shifts</div>
                  {p.shifts.map((s, i) => <div key={i} className="text-slate-300">• {s}</div>)}
                </div>
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="text-slate-500 mb-1.5 font-medium">Certifications</div>
                  {p.certifications.map((c, i) => <div key={i} className="text-emerald-400">✅ {c}</div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customers */}
      {sub === 'customer' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-700/50">
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Customer</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Contact</th>
                  <th className="text-right text-xs text-slate-400 px-4 py-3">PPM Target</th>
                  <th className="text-right text-xs text-slate-400 px-4 py-3">Current PPM</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">CSR Doc</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {customers.map(c => {
                  const overPPM = c.currentPPM > c.ppmTarget;
                  return (
                    <tr key={c.id} className="hover:bg-slate-700/20">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{c.name}</div>
                        <div className="text-xs font-mono text-teal-400">{c.code}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        <div>{c.contact}</div>
                        <div className="text-slate-500">{c.email}</div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">{c.ppmTarget}</td>
                      <td className={`px-4 py-3 text-right font-bold ${overPPM ? 'text-red-400' : 'text-emerald-400'}`}>{c.currentPPM}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{c.csrDoc}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${c.status === 'active' ? 'text-emerald-400 bg-emerald-900/40' : 'text-slate-500 bg-slate-800'}`}>
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers */}
      {sub === 'supplier' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-700/50">
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Supplier</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Commodity</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Contact</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Grade</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-slate-700/20">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{s.name}</div>
                      <div className="text-xs font-mono text-teal-400">{s.code}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{s.commodity}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      <div>{s.contact}</div>
                      <div className="text-slate-500">{s.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                        s.grade === 'A' ? 'bg-emerald-900/40 text-emerald-400' :
                        s.grade === 'B' ? 'bg-blue-900/40 text-blue-400' :
                        s.grade === 'C' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}`}>
                        {s.grade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${APPROVAL_COLOR[s.approvalStatus]}`}>
                        {s.approvalStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Parts */}
      {sub === 'part' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-700/50">
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Part Number</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Part Name</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Customer</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Dwg Rev</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">Criticality</th>
                  <th className="text-left text-xs text-slate-400 px-4 py-3">PPAP Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {parts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-700/20">
                    <td className="px-4 py-3 font-mono text-teal-400 font-medium">{p.partNumber}</td>
                    <td className="px-4 py-3 text-white">{p.partName}</td>
                    <td className="px-4 py-3 text-slate-400">{p.customer}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono">Rev {p.drawingRev}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${CRIT_COLOR[p.criticality]}`}>
                        {p.criticality.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${PPAP_COLOR[p.ppapStatus]}`}>
                        {p.ppapStatus.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Alert Configuration
// ══════════════════════════════════════════════════════════════════════════════
function AlertsTab() {
  const [configs, setConfigs] = useState(ALERT_CONFIG.map((a, i) => ({ ...a, id: i })));
  const toggle = (id: number) => setConfigs(prev => prev.map(c => c.id === id ? { ...c, status: !c.status } : c));

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <p className="text-sm text-slate-400">Configure automated email and dashboard alerts for quality events. Toggle on/off per event type. Recipients and frequency are editable in the full implementation.</p>
      </div>
      <div className="space-y-2">
        {configs.map(c => (
          <div key={c.id} className={`flex flex-wrap items-center gap-4 bg-slate-800 rounded-xl border p-4 transition-colors ${c.status ? 'border-slate-700' : 'border-slate-700/40 opacity-60'}`}>
            <button onClick={() => toggle(c.id)}
              className={`shrink-0 w-10 h-6 rounded-full transition-colors relative ${c.status ? 'bg-teal-600' : 'bg-slate-600'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${c.status ? 'right-1' : 'left-1'}`} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm">{c.event}</div>
              <div className="text-xs text-slate-500 mt-0.5">Recipients: {c.recipients}</div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">⏱ {c.frequency}</span>
              <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded">📡 {c.channel}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-500 text-center">In production, changes are saved automatically and require Quality Head approval</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — System Info & Backup
// ══════════════════════════════════════════════════════════════════════════════
function SystemTab() {
  const systemInfo = [
    { label: 'Application', value: 'QMOS — Quality Management Operating System' },
    { label: 'Version', value: 'v1.0.0 (Build 2025-01)' },
    { label: 'Framework', value: 'Next.js 15 · React 19 · TypeScript · Tailwind CSS 4' },
    { label: 'Standards Alignment', value: 'IATF 16949:2016 · ISO 9001:2015 · AIAG APQP/PPAP/FMEA/MSA/SPC' },
    { label: 'Database', value: 'PostgreSQL (planned) · Currently: In-memory / JSON' },
    { label: 'Authentication', value: 'NextAuth.js (planned) · Currently: Open (Dev mode)' },
    { label: 'Environment', value: 'Development / Local (PM2 + Node.js)' },
    { label: 'Deployment', value: 'Windows Server · IIS Reverse Proxy · PM2 Process Manager' },
  ];

  const modules = [
    { name: 'Dashboard', status: 'live', priority: 'P0' },
    { name: 'Customer Complaints', status: 'live', priority: 'P1' },
    { name: 'Internal Quality', status: 'live', priority: 'P1' },
    { name: 'FMEA', status: 'live', priority: 'P1' },
    { name: 'Control Plan', status: 'live', priority: 'P1' },
    { name: 'MSA', status: 'live', priority: 'P1' },
    { name: 'SPC', status: 'live', priority: 'P1' },
    { name: 'PPAP', status: 'live', priority: 'P1' },
    { name: 'APQP', status: 'live', priority: 'P1' },
    { name: 'IATF Audit', status: 'live', priority: 'P1' },
    { name: 'CAPA', status: 'live', priority: 'P1' },
    { name: 'Incoming Inspection', status: 'live', priority: 'P1' },
    { name: 'Outgoing Inspection', status: 'live', priority: 'P1' },
    { name: 'Warranty', status: 'live', priority: 'P1' },
    { name: 'Training', status: 'live', priority: 'P2' },
    { name: 'Supplier Complaints', status: 'live', priority: 'P2' },
    { name: 'Documents', status: 'live', priority: 'P2' },
    { name: 'Manufacturing', status: 'live', priority: 'P2' },
    { name: 'TQM', status: 'live', priority: 'P2' },
    { name: 'Managerial', status: 'live', priority: 'P2' },
    { name: 'Tasks', status: 'live', priority: 'P2' },
    { name: 'Calendar', status: 'live', priority: 'P2' },
    { name: 'Notifications', status: 'planned', priority: 'P3' },
    { name: 'Settings', status: 'live', priority: 'P3' },
  ];

  const livePct = Math.round((modules.filter(m => m.status === 'live').length / modules.length) * 100);

  return (
    <div className="space-y-5">
      {/* System Info */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">System Information</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {systemInfo.map((s, i) => (
            <div key={i} className="flex gap-3 text-sm">
              <span className="text-slate-500 shrink-0 w-36">{s.label}</span>
              <span className="text-white">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Module Completion */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Module Build Status</div>
          <span className={`text-sm font-bold ${livePct >= 90 ? 'text-emerald-400' : livePct >= 70 ? 'text-yellow-400' : 'text-orange-400'}`}>{livePct}% Complete</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
          <div className="h-2 rounded-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all" style={{ width: `${livePct}%` }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
          {modules.map((m, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs p-1.5 rounded-lg ${m.status === 'live' ? 'text-emerald-400' : 'text-slate-500'}`}>
              <span>{m.status === 'live' ? '✅' : '⭕'}</span>
              <span className="flex-1 truncate">{m.name}</span>
              <span className="text-slate-600">{m.priority}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Backup & Export */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Data Management & Backup</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: '💾', title: 'Export All Data', desc: 'Download complete JSON / Excel export of all modules', color: 'border-blue-700/50 hover:bg-blue-900/20' },
            { icon: '🔄', title: 'Schedule Auto-Backup', desc: 'Configure daily/weekly automated backup to cloud storage', color: 'border-teal-700/50 hover:bg-teal-900/20' },
            { icon: '🗑', title: 'Purge Old Records', desc: 'Archive records older than retention period (requires QH approval)', color: 'border-red-700/50 hover:bg-red-900/20' },
          ].map((b, i) => (
            <div key={i} className={`rounded-xl border p-4 cursor-pointer transition-colors ${b.color} bg-slate-900/40`}>
              <div className="text-2xl mb-2">{b.icon}</div>
              <div className="font-semibold text-white text-sm">{b.title}</div>
              <div className="text-xs text-slate-400 mt-1">{b.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-500">Last backup: Never (configure auto-backup in production deployment)</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [customers, setCustomers] = useState<CustomerMaster[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierMaster[]>([]);
  const [parts, setParts] = useState<PartMaster[]>([]);
  const [loaded, setLoaded] = useState(false);

  const headerStats = useMemo(() => ({
    users:     users.filter(u => u.status === 'active').length,
    plants:    plants.length,
    customers: customers.length,
    suppliers: suppliers.length,
  }), [users, plants, customers, suppliers]);

  function loadSample() {
    setUsers(SAMPLE_USERS);
    setPlants(SAMPLE_PLANTS);
    setCustomers(SAMPLE_CUSTOMERS);
    setSuppliers(SAMPLE_SUPPLIERS);
    setParts(SAMPLE_PARTS);
    setLoaded(true);
  }

  function clearSample() {
    setUsers([]); setPlants([]); setCustomers([]); setSuppliers([]); setParts([]);
    setLoaded(false);
  }

  const tabs = ['👥 Users & Roles', '🏭 Master Data', '🔔 Alert Config', '⚙️ System Info'];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">⚙️</span>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
              </div>
              <p className="text-slate-400 text-sm">Users · Roles · Plant Setup · Customer & Supplier Master · Part Master · Alert Configuration</p>
            </div>
            <button
              onClick={() => loaded ? clearSample() : loadSample()}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg font-medium transition-colors"
            >
              {loaded ? '🗑 Clear Sample' : '⚡ Load Sample Data'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Active Users',    value: loaded ? `${headerStats.users}`     : '—', color: 'text-white' },
              { label: 'Plants',          value: loaded ? `${headerStats.plants}`    : '—', color: 'text-blue-400' },
              { label: 'Customers',       value: loaded ? `${headerStats.customers}` : '—', color: 'text-orange-400' },
              { label: 'Approved Suppliers', value: loaded ? `${SAMPLE_SUPPLIERS.filter(s => s.approvalStatus === 'approved').length}` : '—', color: 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 0 && <UsersTab users={users} />}
        {activeTab === 1 && <MastersTab plants={plants} customers={customers} suppliers={suppliers} parts={parts} />}
        {activeTab === 2 && <AlertsTab />}
        {activeTab === 3 && <SystemTab />}
      </div>
    </div>
  );
}
