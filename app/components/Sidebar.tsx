'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavItem { href: string; icon: string; label: string; badge?: string }
interface NavGroup { group: string; icon: string; items: NavItem[]; defaultOpen?: boolean }

// ── COMMON ZONE — Free access, no company data needed ─────────────────────────
// Any quality professional worldwide can use these tools without logging in to a company.
const COMMON_NAV: NavGroup[] = [
  {
    group: 'KNOWLEDGE & TRAINING',
    icon: '🎓',
    defaultOpen: false,
    items: [
      { href: '/training',   icon: '🎓', label: 'Training Academy' },
      { href: '/learning',   icon: '📚', label: 'Learning Hub' },
      { href: '/qms',        icon: '📋', label: 'IATF / QMS Guide' },
      { href: '/ai-copilot', icon: '🤖', label: 'AI Quality Copilot' },
    ],
  },
  {
    group: 'QUALITY TOOLS',
    icon: '🔧',
    defaultOpen: false,
    items: [
      { href: '/spc',          icon: '📈', label: 'SPC Calculator' },
      { href: '/msa',          icon: '🔬', label: 'MSA / GRR Calculator' },
      { href: '/pfmea',        icon: '⚠️', label: 'PFMEA Generator' },
      { href: '/control-plan', icon: '📋', label: 'Control Plan Generator' },
      { href: '/apqp',         icon: '🚀', label: 'APQP Tracker' },
      { href: '/ppap',         icon: '📦', label: 'PPAP Tracker' },
      { href: '/audit',        icon: '✅', label: 'Audit Checklists' },
    ],
  },
  {
    group: 'DOCUMENT GENERATORS',
    icon: '🧬',
    defaultOpen: false,
    items: [
      { href: '/8d',              icon: '📝', label: '8D Report Generator' },
      { href: '/pfd',             icon: '🔄', label: 'PFD Generator' },
      { href: '/ai-generator',    icon: '🧬', label: 'AI Doc Generator', badge: 'NEW' },
      { href: '/pfmea-converter', icon: '🔁', label: 'FMEA Converter',   badge: 'NEW' },
    ],
  },
];

// ── COMPANY ZONE — Requires company login / real company data ─────────────────
const COMPANY_NAV: NavGroup[] = [
  {
    group: 'DEPARTMENTS',
    icon: '🏢',
    defaultOpen: false,
    items: [
      { href: '/customer-quality',    icon: '👥', label: 'Customer Quality' },
      { href: '/supplier-quality',    icon: '🏭', label: 'Supplier Quality' },
      { href: '/supplier-complaints', icon: '🚚', label: 'Supplier NCR / SCAR' },
      { href: '/incoming-quality',    icon: '📦', label: 'Incoming Quality' },
      { href: '/process-quality',     icon: '⚙️', label: 'Inprocess Quality' },
      { href: '/internal-ncr',        icon: '🔴', label: 'Internal NCR' },
      { href: '/manufacturing',       icon: '🏗️', label: 'Manufacturing' },
      { href: '/outgoing-quality',    icon: '📤', label: 'Production Quality' },
      { href: '/tqm',                 icon: '🏆', label: 'TQM / TBEM' },
      { href: '/corporate',           icon: '📊', label: 'Corporate Reports' },
      { href: '/managerial',          icon: '👨‍💼', label: 'Managerial' },
    ],
  },
  {
    group: 'ANALYTICS & CAPA',
    icon: '📊',
    defaultOpen: false,
    items: [
      { href: '/analytics', icon: '📈', label: 'Analytics Dashboard' },
      { href: '/capa',      icon: '🔧', label: 'CAPA Management' },
    ],
  },
  {
    group: 'MANAGE',
    icon: '⚙️',
    defaultOpen: false,
    items: [
      { href: '/documents',    icon: '📄', label: 'Document Center' },
      { href: '/calendar',     icon: '📅', label: 'Quality Calendar' },
      { href: '/tasks',        icon: '✅', label: 'Tasks' },
      { href: '/notifications',icon: '🔔', label: 'Notifications' },
      { href: '/settings',     icon: '⚙️', label: 'Settings' },
      { href: '/admin/users',  icon: '🔐', label: 'User Management', badge: 'ADMIN' },
    ],
  },
];

function BranchBadge() {
  const [branch, setBranch] = useState('');
  useEffect(() => { fetch('/api/branch').then(r => r.json()).then(d => setBranch(d.branch)).catch(() => {}); }, []);
  if (!branch) return null;
  const isMain = branch === 'main';
  return (
    <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', background: isMain ? '#1e3a5f' : '#14532d', color: isMain ? '#93c5fd' : '#86efac', marginLeft: '4px' }}>
      {branch.toUpperCase()}
    </span>
  );
}

function NavGroupSection({
  group, collapsed, isActive, openGroups, toggleGroup, accentClass, activeClass,
}: {
  group: NavGroup; collapsed: boolean; isActive: (h: string) => boolean;
  openGroups: Record<string, boolean>; toggleGroup: (g: string) => void;
  accentClass: string; activeClass: string;
}) {
  return (
    <div>
      <button
        onClick={() => toggleGroup(group.group)}
        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition group hover:bg-white/5`}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm w-5 text-center flex-shrink-0">{group.icon}</span>
          {!collapsed && (
            <span className={`text-xs font-bold uppercase tracking-wider ${accentClass} group-hover:opacity-100 opacity-80`}>
              {group.group}
            </span>
          )}
        </div>
        {!collapsed && (
          <span className="text-slate-500 text-xs">{openGroups[group.group] ? '▾' : '▸'}</span>
        )}
      </button>
      {openGroups[group.group] && (
        <div className="mt-0.5 space-y-0.5 ml-1">
          {group.items.map(item => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all ${active ? activeClass : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-sm w-5 text-center flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="text-xs leading-tight">{item.label}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const path = usePathname();
  const allGroups = [...COMMON_NAV, ...COMPANY_NAV];
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(allGroups.map(g => [g.group, false]))
  );
  const [collapsed, setCollapsed] = useState(false);

  const toggleGroup = (group: string) =>
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  const isActive = (href: string) =>
    path === href || path.startsWith(href + '/');

  return (
    <aside className={`${collapsed ? 'w-14' : 'w-60'} bg-slate-900 text-white flex flex-col flex-shrink-0 h-full overflow-y-auto transition-all duration-200 border-r border-slate-800`}>

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-800 flex-shrink-0">
        {!collapsed && (
          <div>
            <p className="text-sm font-bold tracking-tight text-white">QMOS</p>
            <p className="text-teal-400 text-xs">Quality Operating System<BranchBadge /></p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition flex-shrink-0"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* ── Company Quick Links (always visible) ─────────────────────────── */}
      <div className="px-2 pt-2 pb-1 space-y-0.5">
        <Link href="/dashboard"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${isActive('/dashboard') ? 'bg-teal-700 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
          <span className="text-base w-5 text-center flex-shrink-0">🏠</span>
          {!collapsed && <span className="text-xs font-semibold">Quality Head Dashboard</span>}
        </Link>
        <Link href="/tasks"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${isActive('/tasks') ? 'bg-teal-700 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
          <span className="text-base w-5 text-center flex-shrink-0">✅</span>
          {!collapsed && <span className="text-xs font-semibold">My Tasks</span>}
        </Link>
        <Link href="/notifications"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${isActive('/notifications') ? 'bg-teal-700 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
          <span className="text-base w-5 text-center flex-shrink-0">🔔</span>
          {!collapsed && <span className="text-xs font-semibold">Notifications</span>}
        </Link>
      </div>

      <nav className="flex-1 py-1 px-2 space-y-0.5 overflow-y-auto">

        {/* ══ COMMON ZONE ══════════════════════════════════════════════════ */}
        {!collapsed && (
          <div className="mx-1 mt-2 mb-1 px-2 py-1.5 rounded-lg bg-teal-900/40 border border-teal-800/60">
            <p className="text-xs font-bold text-teal-400 uppercase tracking-widest">🌍 Common Zone</p>
            <p className="text-xs text-teal-600 leading-tight mt-0.5">Free tools · Any quality professional</p>
          </div>
        )}
        {collapsed && <div className="mx-1 my-2 h-px bg-teal-800/60" />}

        {COMMON_NAV.map(g => (
          <NavGroupSection key={g.group} group={g} collapsed={collapsed} isActive={isActive}
            openGroups={openGroups} toggleGroup={toggleGroup}
            accentClass="text-teal-400" activeClass="bg-teal-800/60 text-teal-100 font-semibold" />
        ))}

        {/* ══ COMPANY ZONE ═════════════════════════════════════════════════ */}
        {!collapsed && (
          <div className="mx-1 mt-3 mb-1 px-2 py-1.5 rounded-lg bg-blue-900/40 border border-blue-800/60">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">🏢 Your Company</p>
            <p className="text-xs text-blue-600 leading-tight mt-0.5">Live data · Company-specific</p>
          </div>
        )}
        {collapsed && <div className="mx-1 my-2 h-px bg-blue-800/60" />}

        {COMPANY_NAV.map(g => (
          <NavGroupSection key={g.group} group={g} collapsed={collapsed} isActive={isActive}
            openGroups={openGroups} toggleGroup={toggleGroup}
            accentClass="text-blue-400" activeClass="bg-blue-700/60 text-blue-100 font-semibold" />
        ))}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-4 py-2 border-t border-slate-800 flex-shrink-0">
          <p className="text-xs text-slate-500">IATF 16949 · ISO 9001</p>
          <p className="text-xs text-slate-700">AIAG · VDA · CQI</p>
        </div>
      )}
    </aside>
  );
}
