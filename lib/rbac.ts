// ─────────────────────────────────────────────────────────────────────────────
// QMOS — Role-Based Access Control (RBAC)
// ─────────────────────────────────────────────────────────────────────────────
// 4 standardised roles sit on top of the existing ADMIN / USER type system.
// The role field on company_users stores the display role string; we map that
// to one of the 4 RBAC levels here. No DB schema change required.
// ─────────────────────────────────────────────────────────────────────────────

export type RBACRole = 'quality_head' | 'quality_manager' | 'auditor' | 'viewer';

export interface RoleConfig {
  label:       string;
  shortLabel:  string;
  description: string;
  color:       string;   // tailwind text class
  bg:          string;   // tailwind bg/border pill class
  level:       number;   // higher = more permissions
  icon:        string;
}

// ── Role definitions ──────────────────────────────────────────────────────────
export const RBAC_ROLES: Record<RBACRole, RoleConfig> = {
  quality_head: {
    label:       'Quality Head',
    shortLabel:  'QH',
    description: 'Full access — all pages, user management, management review, CAPA approval, exports',
    color:       'text-red-400',
    bg:          'bg-red-950/40 border-red-700/50 text-red-300',
    level:       4,
    icon:        '👑',
  },
  quality_manager: {
    label:       'Quality Manager',
    shortLabel:  'QM',
    description: 'All quality pages, add/edit complaints & CAPA, supplier development — no user management',
    color:       'text-amber-400',
    bg:          'bg-amber-950/40 border-amber-700/50 text-amber-300',
    level:       3,
    icon:        '🎯',
  },
  auditor: {
    label:       'Auditor / Inspector',
    shortLabel:  'AUD',
    description: 'Read all + raise NCRs + supplier audits + reports — no management review or admin',
    color:       'text-blue-400',
    bg:          'bg-blue-950/40 border-blue-700/50 text-blue-300',
    level:       2,
    icon:        '🔍',
  },
  viewer: {
    label:       'View Only',
    shortLabel:  'VIEW',
    description: 'Dashboards and reports only — read access; no create, edit, delete or exports',
    color:       'text-slate-400',
    bg:          'bg-slate-800 border-slate-600 text-slate-400',
    level:       1,
    icon:        '👁',
  },
};

// ── Ordered list for dropdowns ────────────────────────────────────────────────
export const RBAC_ROLE_ORDER: RBACRole[] = [
  'quality_head', 'quality_manager', 'auditor', 'viewer',
];

// ── Resolve RBAC role from session / DB fields ────────────────────────────────
// Reads the existing `type` (ADMIN|USER) + `role` string and returns the
// standardised RBAC role. No DB migration needed.
export function resolveRBACRole(type?: string, role?: string): RBACRole {
  if ((type ?? '').toUpperCase() === 'ADMIN') return 'quality_head';
  const r = (role ?? '').toLowerCase().trim();
  if (r === 'quality head'  || r.includes('head') || r.includes('director')) return 'quality_head';
  if (r === 'quality manager'|| r.includes('manager'))                        return 'quality_manager';
  if (r === 'auditor'       || r.includes('audit') || r.includes('inspector'))return 'auditor';
  return 'viewer';
}

// ── Permission helpers ────────────────────────────────────────────────────────

/** True when userRole meets the required minimum level. */
export function canAccess(userRole: RBACRole, minLevel: number): boolean {
  return RBAC_ROLES[userRole].level >= minLevel;
}

/** Named feature gates — use these in components instead of raw levels. */
export const FEATURE = {
  viewAll:          (r: RBACRole) => canAccess(r, 1),  // viewer+
  createComplaints: (r: RBACRole) => canAccess(r, 2),  // auditor+
  editComplaints:   (r: RBACRole) => canAccess(r, 2),  // auditor+
  supplierDev:      (r: RBACRole) => canAccess(r, 2),  // auditor+
  approveCAPA:      (r: RBACRole) => canAccess(r, 3),  // quality_manager+
  managementReview: (r: RBACRole) => canAccess(r, 3),  // quality_manager+
  exportPDF:        (r: RBACRole) => canAccess(r, 2),  // auditor+
  userManagement:   (r: RBACRole) => canAccess(r, 4),  // quality_head only
  systemAdmin:      (r: RBACRole) => canAccess(r, 4),  // quality_head only
} as const;

// ── Route-level minimum RBAC levels ──────────────────────────────────────────
export const ROUTE_MIN_LEVELS: Record<string, number> = {
  '/admin':              4,
  '/admin/users':        4,
  '/management-review':  3,
};

/** Minimum RBAC level required to access a given path. */
export function routeMinLevel(path: string): number {
  for (const [prefix, level] of Object.entries(ROUTE_MIN_LEVELS)) {
    if (path === prefix || path.startsWith(prefix + '/')) return level;
  }
  return 1; // default: all authenticated users
}
