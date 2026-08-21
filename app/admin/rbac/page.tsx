'use client';
import { useState } from 'react';
import RoleGuard from '../../components/RoleGuard';
import { RBAC_ROLES, RBAC_ROLE_ORDER, FEATURE, type RBACRole } from '@/lib/rbac';

// -- Feature gate definitions for the matrix ----------------------------------
const FEATURE_MATRIX: {
  group: string;
  features: { key: keyof typeof FEATURE; label: string; description: string }[];
}[] = [
  {
    group: 'Dashboards & Reports',
    features: [
      { key: 'viewAll', label: 'View Dashboards', description: 'Access all dashboards, KPI tiles, trend charts' },
      { key: 'exportPDF', label: 'Export PDF / CSV', description: 'Export reports, complaints, CAPA records' },
    ],
  },
  {
    group: 'Complaint Management',
    features: [
      { key: 'createComplaints', label: 'Create Complaints', description: 'Raise new customer complaints and NCRs' },
      { key: 'editComplaints', label: 'Edit / Close Complaints', description: 'Update complaint details, status, remarks' },
    ],
  },
  {
    group: 'CAPA & Quality Actions',
    features: [
      { key: 'createComplaints', label: 'Raise CAPA Actions', description: 'Add corrective/preventive actions to complaints' },
      { key: 'approveCAPA', label: 'Approve / Verify CAPA', description: 'Mark CAPA as approved and verified effective' },
    ],
  },
  {
    group: 'Supplier Quality',
    features: [
      { key: 'supplierDev', label: 'Supplier Development', description: 'Raise SCARs, scorecards, supplier audits' },
      { key: 'approveCAPA', label: 'Approve Supplier Actions', description: 'Approve supplier corrective action plans' },
    ],
  },
  {
    group: 'Management & Governance',
    features: [
      { key: 'managementReview', label: 'Management Review', description: 'Access and edit Management Review Meetings (MRM)' },
      { key: 'userManagement', label: 'User Management', description: 'Add, edit, deactivate users and assign roles' },
      { key: 'systemAdmin', label: 'System Administration', description: 'Full admin — RBAC, system settings, audit trail' },
    ],
  },
];

// -- Route access table ---------------------------------------------------------
const ROUTE_ACCESS: {
  route: string;
  label: string;
  icon: string;
  minLevel: number;
}[] = [
  { route: '/dashboard',           label: 'Dashboard',              icon: 'ti-dashboard',         minLevel: 1 },
  { route: '/analytics',           label: 'Analytics',              icon: 'ti-chart-bar',         minLevel: 1 },
  { route: '/ppm-analytics',       label: 'PPM Analytics (AI)',     icon: 'ti-trending-up',       minLevel: 1 },
  { route: '/iatf-analyser',       label: 'IATF 16949 Analyser',    icon: 'ti-clipboard-check',   minLevel: 1 },
  { route: '/complaints',          label: 'Complaints',             icon: 'ti-alert-triangle',    minLevel: 1 },
  { route: '/complaints/new',      label: 'New Complaint',          icon: 'ti-plus',              minLevel: 2 },
  { route: '/capa',                label: 'CAPA',                   icon: 'ti-refresh',           minLevel: 1 },
  { route: '/supplier-complaints', label: 'Supplier Complaints',    icon: 'ti-truck',             minLevel: 1 },
  { route: '/management-review',   label: 'Management Review',      icon: 'ti-file-certificate',  minLevel: 3 },
  { route: '/admin/users',         label: 'User Management',        icon: 'ti-users',             minLevel: 4 },
  { route: '/admin/rbac',          label: 'RBAC Matrix (this page)', icon: 'ti-lock',             minLevel: 4 },
];

// -- Cell component -------------------------------------------------------------
function Cell({ allowed }: { allowed: boolean }) {
  return allowed ? (
    <div className="flex items-center justify-center">
      <span className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
        <i className="ti ti-check text-[#15803d] text-xs" />
      </span>
    </div>
  ) : (
    <div className="flex items-center justify-center">
      <span className="w-6 h-6 rounded-full bg-[#f0f9ff] border border-[#dbeafe] flex items-center justify-center">
        <i className="ti ti-minus text-[#1e3a5f] text-xs" />
      </span>
    </div>
  );
}

// -- Level dot bar --------------------------------------------------------------
function LevelBar({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4].map(l => (
        <div key={l} className={`w-3 h-1.5 rounded-full ${l <= level ? 'bg-blue-500' : 'bg-[#f0f9ff]'}`} />
      ))}
    </div>
  );
}

// -- Route level badge ----------------------------------------------------------
function RouteCell({ minLevel, roleLevel }: { minLevel: number; roleLevel: number }) {
  const allowed = roleLevel >= minLevel;
  return allowed ? (
    <div className="flex justify-center">
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-[#15803d] border border-emerald-500/30">
        <i className="ti ti-lock-open text-[10px]" /> Access
      </span>
    </div>
  ) : (
    <div className="flex justify-center">
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-[#f0f9ff] text-[#1e3a5f] border border-[#dbeafe]">
        <i className="ti ti-lock text-[10px]" /> Blocked
      </span>
    </div>
  );
}

// -----------------------------------------------------------------------------
export default function RBACMatrixPage() {
  const [activeTab, setActiveTab] = useState<'matrix'|'routes'|'guide'>('matrix');

  return (
    <RoleGuard minLevel={4} deniedMessage="RBAC administration requires Quality Head access.">
      <div className="min-h-screen bg-[#eff6ff] text-[#0f172a]">
        {/* -- Header ------------------------------------------------------- */}
        <div className="bg-gradient-to-r from-[#0f1a2e] to-[#0b1220] border-b border-[#dbeafe] px-6 py-5">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <i className="ti ti-lock text-purple-400 text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">RBAC Permission Matrix</h1>
                <p className="text-xs text-[#1e3a5f]">Role-Based Access Control — IATF 16949 Cl.7.3.2 &amp; Cl.5.3</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

          {/* -- Role Summary Cards --------------------------------------- */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {RBAC_ROLE_ORDER.map(role => {
              const cfg = RBAC_ROLES[role];
              return (
                <div key={role} className="bg-white border border-[#dbeafe] rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cfg.icon}</span>
                    <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <LevelBar level={cfg.level} />
                  <p className="text-xs text-[#1e3a5f] leading-relaxed">{cfg.description}</p>
                  <div className="text-xs text-[#1e3a5f]">Level {cfg.level} / 4</div>
                </div>
              );
            })}
          </div>

          {/* -- Tabs ----------------------------------------------------- */}
          <div className="flex gap-1 bg-white border border-[#dbeafe] rounded-xl p-1 w-fit">
            {(['matrix','routes','guide'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                  activeTab === t ? 'bg-blue-600 text-white' : 'text-[#1e3a5f] hover:text-white'
                }`}
              >
                {t === 'matrix' ? '🔐 Feature Matrix' : t === 'routes' ? '🗺 Route Access' : '📖 RBAC Guide'}
              </button>
            ))}
          </div>

          {/* -- Tab: Feature Matrix --------------------------------------- */}
          {activeTab === 'matrix' && (
            <div className="animate-fadeIn bg-white border border-[#dbeafe] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dbeafe] bg-[#eff6ff]">
                    <th className="text-left px-5 py-3 text-[#1e3a5f] font-medium w-64">Feature / Permission</th>
                    {RBAC_ROLE_ORDER.map(role => (
                      <th key={role} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-base">{RBAC_ROLES[role].icon}</span>
                          <span className={`text-xs font-bold ${RBAC_ROLES[role].color}`}>{RBAC_ROLES[role].shortLabel}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_MATRIX.map((group, gi) => (
                    <>
                      <tr key={`g-${gi}`} className="bg-[#eff6ff] border-t border-[#dbeafe]">
                        <td colSpan={5} className="px-5 py-2 text-xs font-bold text-[#1e3a5f] uppercase tracking-widest">
                          {group.group}
                        </td>
                      </tr>
                      {group.features.map((feat, fi) => (
                        <tr key={`${gi}-${fi}`} className="border-t border-[#dbeafe] hover:bg-[#eff6ff] transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-medium text-[#1e3a5f] text-sm">{feat.label}</div>
                            <div className="text-xs text-[#1e3a5f] mt-0.5">{feat.description}</div>
                          </td>
                          {RBAC_ROLE_ORDER.map(role => (
                            <td key={role} className="px-4 py-3">
                              <Cell allowed={FEATURE[feat.key](role)} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* -- Tab: Route Access --------------------------------------- */}
          {activeTab === 'routes' && (
            <div className="animate-fadeIn bg-white border border-[#dbeafe] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#dbeafe] bg-[#eff6ff]">
                    <th className="text-left px-5 py-3 text-[#1e3a5f] font-medium">Page / Route</th>
                    <th className="px-3 py-3 text-center text-[#1e3a5f] text-xs">Min.<br/>Level</th>
                    {RBAC_ROLE_ORDER.map(role => (
                      <th key={role} className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-base">{RBAC_ROLES[role].icon}</span>
                          <span className={`text-xs font-bold ${RBAC_ROLES[role].color}`}>{RBAC_ROLES[role].shortLabel}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROUTE_ACCESS.map((r, i) => (
                    <tr key={i} className="border-t border-[#dbeafe] hover:bg-[#eff6ff] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <i className={`${r.icon} text-[#1e3a5f] text-sm`} />
                          <div>
                            <div className="font-medium text-[#1e3a5f]">{r.label}</div>
                            <div className="text-xs text-[#1e3a5f] font-mono">{r.route}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="text-xs font-bold text-[#1e3a5f]">L{r.minLevel}</span>
                      </td>
                      {RBAC_ROLE_ORDER.map(role => (
                        <td key={role} className="px-4 py-3">
                          <RouteCell minLevel={r.minLevel} roleLevel={RBAC_ROLES[role].level} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* -- Tab: RBAC Guide ------------------------------------------ */}
          {activeTab === 'guide' && (
            <div className="animate-fadeIn grid md:grid-cols-2 gap-4">
              {/* How roles are assigned */}
              <div className="bg-white border border-[#dbeafe] rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <i className="ti ti-user-plus text-[#1d4ed8]" /> How Roles Are Assigned
                </h3>
                <ol className="space-y-3 text-sm text-[#1e3a5f]">
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                    <span>Navigate to <strong className="text-white">Admin → User Management</strong> and click a user row.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                    <span>Set the <strong className="text-white">Role</strong> field to one of: <em>Quality Head, Quality Manager, Auditor, Viewer</em>.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                    <span>The RBAC engine maps the role text to a level (1–4) using <code className="text-xs bg-[#f0f9ff] px-1 rounded">resolveRBACRole()</code>.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                    <span>ADMIN type users are automatically granted Level 4 regardless of role text.</span>
                  </li>
                </ol>
              </div>

              {/* IATF alignment */}
              <div className="bg-white border border-[#dbeafe] rounded-xl p-5 space-y-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <i className="ti ti-certificate text-amber-600" /> IATF 16949 Alignment
                </h3>
                <div className="space-y-3 text-sm text-[#1e3a5f]">
                  <div className="bg-[#eff6ff] rounded-lg p-3 border border-[#dbeafe]">
                    <div className="text-xs font-bold text-amber-600 mb-1">Cl.5.3 — Organisational Roles</div>
                    <p className="text-xs text-[#1e3a5f]">Top management must assign responsibilities and communicate roles. RBAC matrix is objective evidence of defined responsibilities.</p>
                  </div>
                  <div className="bg-[#eff6ff] rounded-lg p-3 border border-[#dbeafe]">
                    <div className="text-xs font-bold text-amber-600 mb-1">Cl.7.3.2 — Awareness</div>
                    <p className="text-xs text-[#1e3a5f]">Personnel must be aware of their roles and impact on quality. Role labels and descriptions ensure this is documented and accessible.</p>
                  </div>
                  <div className="bg-[#eff6ff] rounded-lg p-3 border border-[#dbeafe]">
                    <div className="text-xs font-bold text-amber-600 mb-1">Cl.9.2.2 — Internal Audit</div>
                    <p className="text-xs text-[#1e3a5f]">Audit findings must be accessible to relevant parties. Auditor role gets read access without create/edit rights — maintaining independence.</p>
                  </div>
                </div>
              </div>

              {/* Quick reference */}
              <div className="bg-white border border-[#dbeafe] rounded-xl p-5 space-y-3 md:col-span-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <i className="ti ti-info-circle text-green-400" /> Role Quick Reference
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {RBAC_ROLE_ORDER.map(role => {
                    const cfg = RBAC_ROLES[role];
                    const allowedFeatures = Object.entries(FEATURE).filter(([, fn]) => fn(role)).length;
                    return (
                      <div key={role} className="bg-[#eff6ff] border border-[#dbeafe] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{cfg.icon}</span>
                          <span className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <div className="text-xs text-[#1e3a5f] space-y-1">
                          <div>Level: <span className="text-white font-bold">{cfg.level}/4</span></div>
                          <div>Permissions: <span className="text-white font-bold">{allowedFeatures}/{Object.keys(FEATURE).length}</span></div>
                        </div>
                        <div className="mt-2 flex gap-0.5">
                          {[1,2,3,4].map(l => (
                            <div key={l} className={`flex-1 h-1.5 rounded-full ${l <= cfg.level ? 'bg-blue-500' : 'bg-[#f0f9ff]'}`} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Audit questions */}
              <div className="bg-white border border-amber-200 rounded-xl p-5 space-y-3 md:col-span-2">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <i className="ti ti-clipboard-check text-amber-600" /> Common IATF Audit Questions
                </h3>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  {[
                    'How do you ensure only authorised personnel can approve CAPA?',
                    'Show me evidence that roles and responsibilities are communicated to all staff.',
                    'What prevents a viewer-role user from modifying quality records?',
                    'How is access reviewed when an employee changes department?',
                    'Can you demonstrate the management review access control in the system?',
                    'What is the process for revoking access when an employee leaves?',
                  ].map((q, i) => (
                    <div key={i} className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <span className="text-amber-600 font-bold text-xs mt-0.5">Q{i+1}.</span>
                      <span className="text-[#1e3a5f] text-xs">{q}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#1e3a5f]">
                  <i className="ti ti-info-circle mr-1" />
                  This RBAC Matrix page itself serves as objective evidence for Cl.5.3 during an audit.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </RoleGuard>
  );
}
