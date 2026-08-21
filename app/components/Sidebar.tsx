'use client';
import React, { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '../hooks/useSession';

// -- Types ---------------------------------------------------------------------
type ItemType = 'company' | 'common';
interface NavItem   { href: string; icon: string; label: string; badge?: string; type: ItemType }
interface NavSection { label?: string; items: NavItem[] }
interface NavGroup  { key: string; icon: string; title: string; short: string; sub: string; sections: NavSection[] }

// -- Theme ---------------------------------------------------------------------
const C = {
  // -- Frozen brand colours (DO NOT CHANGE) ----------------------------------
  bg:          '#eff6ff',   // blue-50
  border:      '#93c5fd',   // blue-300
  active:      '#15803d',   // green-700
  activeIcon:  '#ffffff',
  icon:        '#1d4ed8',   // blue-700
  commonIcon:  '#15803d',   // green-700 — common tool icon
  text:        '#0f172a',   // slate-900
  muted:       '#1e3a5f',   // custom navy
  section:     '#1e40af',   // blue-800
  hoverBg:     '#dbeafe',   // blue-100
  commonBadge: { bg: '#ede9fe', color: '#7c3aed' },
  newBadge:    { bg: '#ede9fe', color: '#7c3aed' },
  adminBadge:  { bg: '#fef9c3', color: '#d97706' },

  // -- Zone colours (3-section icon strip) -----------------------------------
  zone1:       '#dcfce7',   // green-100 — QM Workspace
  zone1Border: '#86efac',   // green-300
  zone1Text:   '#15803d',   // green-700
  zone2:       '#dbeafe',   // blue-100  — Company
  zone2Border: '#93c5fd',   // blue-300
  zone2Text:   '#1d4ed8',   // blue-700
  zone3:       '#ede9fe',   // violet-100 — Common
  zone3Border: '#c4b5fd',   // violet-300
  zone3Text:   '#7c3aed',   // violet-700
};

// -- Navigation data -----------------------------------------------------------
const GROUPS: NavGroup[] = [
  // -- ZONE 2: Company ------------------------------------------------------
  {
    key: 'dept', icon: 'ti-building', title: 'Departments', short: 'Depts', sub: 'Company data · Login required',
    sections: [
      {
        label: 'Core Quality Ops',
        items: [
          { href: '/complaints',          icon: 'ti-alert-triangle',   label: 'Complaints Register', type: 'company' },
          { href: '/customer-quality',    icon: 'ti-users',            label: 'Customer Quality',    type: 'company' },
          { href: '/supplier-quality',    icon: 'ti-truck',            label: 'Supplier Quality',    type: 'company' },
          { href: '/incoming-quality',    icon: 'ti-package',          label: 'Incoming Quality',    type: 'company' },
          { href: '/process-quality',     icon: 'ti-settings-2',       label: 'Inprocess Quality',   type: 'company' },
          { href: '/internal-ncr',        icon: 'ti-circle-x',         label: 'Internal NCR',        type: 'company' },
          { href: '/supplier-complaints', icon: 'ti-alert-circle',     label: 'Supplier NCR / SCAR', type: 'company' },
          { href: '/outgoing-quality',    icon: 'ti-send',             label: 'Outgoing Quality',    type: 'company' },
        ],
      },
      {
        label: 'CAPA & Actions',
        items: [
          { href: '/capa',        icon: 'ti-tool',         label: 'CAPA Management', type: 'company' },
          { href: '/approvals',   icon: 'ti-circle-check', label: 'Approval Queue',  type: 'company', badge: 'NEW' },
          { href: '/sla',         icon: 'ti-clock',        label: 'SLA Tracker',     type: 'company', badge: 'NEW' },
          { href: '/audit-trail', icon: 'ti-history',      label: 'Audit Trail',     type: 'company', badge: 'NEW' },
        ],
      },
      {
        label: 'Risk & Scorecards',
        items: [
          { href: '/customer-risk',      icon: 'ti-user-exclamation',   label: 'Customer Risk AI',   type: 'company', badge: 'AI' },
          { href: '/supplier-risk',      icon: 'ti-building-factory-2', label: 'Supplier Risk AI',   type: 'company', badge: 'AI' },
          { href: '/customer-scorecard', icon: 'ti-trophy',             label: 'Customer Scorecard', type: 'company', badge: 'NEW' },
          { href: '/warranty',           icon: 'ti-shield-check',       label: 'Warranty & Field',   type: 'company', badge: 'NEW' },
        ],
      },
      {
        label: 'Programs & Review',
        items: [
          { href: '/management-review',    icon: 'ti-users-group',        label: 'Management Review', type: 'company', badge: 'NEW' },
          { href: '/calibration',          icon: 'ti-ruler-measure',      label: 'Calibration',       type: 'company', badge: 'NEW' },
          { href: '/quality-goals',        icon: 'ti-target',             label: 'Quality Goals',     type: 'company', badge: 'NEW' },
          { href: '/lessons-learned',      icon: 'ti-brain',              label: 'Lessons Learned',   type: 'company', badge: 'NEW' },
          { href: '/training-needs',       icon: 'ti-school',             label: 'Training Needs',    type: 'company', badge: 'NEW' },
          { href: '/supplier-development', icon: 'ti-building-factory-2', label: 'Supplier Dev',      type: 'company', badge: 'NEW' },
          { href: '/manufacturing',        icon: 'ti-building-factory-2', label: 'Manufacturing',     type: 'company' },
          { href: '/portal',               icon: 'ti-world',              label: 'Customer Portal',   type: 'company', badge: 'NEW' },
          { href: '/tqm',                  icon: 'ti-trophy',             label: 'TQM / TBEM',        type: 'company' },
          { href: '/corporate',            icon: 'ti-chart-pie',          label: 'Corporate Reports', type: 'company' },
          { href: '/managerial',           icon: 'ti-briefcase',          label: 'Managerial',        type: 'company' },
        ],
      },
    ],
  },
  {
    key: 'intel', icon: 'ti-brain', title: 'Intelligence', short: 'Intel', sub: 'AI Analytics · Login required',
    sections: [
      {
        label: 'AI Analytics',
        items: [
          { href: '/daily-brief',     icon: 'ti-sun',                label: 'Quality Daily Brief',  type: 'company', badge: 'AI' },
          { href: '/quality-health',  icon: 'ti-heart-rate-monitor', label: 'Quality Health Check', type: 'company', badge: 'AI' },
          { href: '/iatf-compliance', icon: 'ti-shield-check',       label: 'IATF Audit Readiness', type: 'company', badge: 'AI' },
          { href: '/copq',            icon: 'ti-currency-rupee',     label: 'COPQ Dashboard',       type: 'company', badge: 'AI' },
          { href: '/8d-generator',    icon: 'ti-report-analytics',   label: '8D Report Generator',  type: 'company', badge: 'AI' },
          { href: '/analytics',       icon: 'ti-chart-bar',          label: 'Analytics Dashboard',  type: 'company' },
        ],
      },
    ],
  },

  // -- ZONE 3: Common -------------------------------------------------------
  {
    key: 'tools', icon: 'ti-tool', title: 'Quality Tools', short: 'Tools', sub: 'Common · No login required',
    sections: [
      {
        label: 'Core Tools',
        items: [
          { href: '/apqp',         icon: 'ti-rocket',         label: 'APQP',         type: 'common' },
          { href: '/ppap',         icon: 'ti-package',        label: 'PPAP',         type: 'common' },
          { href: '/pfmea',        icon: 'ti-alert-triangle', label: 'PFMEA',        type: 'common' },
          { href: '/control-plan', icon: 'ti-list-check',     label: 'Control Plan', type: 'common' },
          { href: '/spc',          icon: 'ti-chart-line',     label: 'SPC',          type: 'common' },
          { href: '/msa',          icon: 'ti-microscope',     label: 'MSA',          type: 'common' },
        ],
      },
      {
        label: 'Generators & Analysers',
        items: [
          { href: '/apqp-generator',         icon: 'ti-rocket',          label: 'APQP Generator',      type: 'common', badge: 'NEW' },
          { href: '/ppap-generator',         icon: 'ti-package',         label: 'PPAP Generator',      type: 'common', badge: 'NEW' },
          { href: '/pfmea-generator',        icon: 'ti-alert-triangle',  label: 'PFMEA Generator',     type: 'common', badge: 'NEW' },
          { href: '/control-plan-generator', icon: 'ti-list-check',      label: 'Control Plan Gen',    type: 'common', badge: 'NEW' },
          { href: '/spc-analyser',           icon: 'ti-chart-line',      label: 'SPC Analyser',        type: 'common', badge: 'NEW' },
          { href: '/msa-analyser',           icon: 'ti-microscope',      label: 'MSA Analyser',        type: 'common', badge: 'NEW' },
          { href: '/iatf-analyser',          icon: 'ti-clipboard-check', label: 'IATF 16949 Analyser', type: 'common', badge: 'AI' },
          { href: '/ppm-analytics',          icon: 'ti-trending-up',     label: 'Predictive PPM',      type: 'company', badge: 'AI' },
        ],
      },
      {
        label: 'AI Copilots',
        items: [
          { href: '/ai-apqp-copilot',         icon: 'ti-robot', label: 'APQP Copilot',         type: 'common', badge: 'AI' },
          { href: '/ai-ppap-copilot',         icon: 'ti-robot', label: 'PPAP Copilot',         type: 'common', badge: 'AI' },
          { href: '/ai-pfmea-copilot',        icon: 'ti-robot', label: 'PFMEA Copilot',        type: 'common', badge: 'AI' },
          { href: '/ai-control-plan-copilot', icon: 'ti-robot', label: 'Control Plan Copilot', type: 'common', badge: 'AI' },
          { href: '/ai-spc-copilot',          icon: 'ti-robot', label: 'SPC Copilot',          type: 'common', badge: 'AI' },
          { href: '/ai-msa-copilot',          icon: 'ti-robot', label: 'MSA Copilot',          type: 'common', badge: 'AI' },
        ],
      },
    ],
  },
  {
    key: 'learn', icon: 'ti-world', title: '🌍 Common Zone', short: 'Common', sub: 'Common · No login required',
    sections: [
      {
        label: 'Training & Knowledge',
        items: [
          { href: '/training', icon: 'ti-school',         label: 'Training Academy', type: 'common' },
          { href: '/learning', icon: 'ti-book',           label: 'Learning Hub',     type: 'common' },
          { href: '/qms',      icon: 'ti-clipboard-list', label: 'IATF / QMS Guide', type: 'common' },
        ],
      },
    ],
  },
];

// -- Company-zone groups (Depts + Intel) --------------------------------------
const COMPANY_KEYS = ['dept', 'intel'];
// -- Common-zone groups (Tools + Learn) ---------------------------------------
const COMMON_KEYS  = ['tools', 'learn'];

const MANAGE_ITEMS: NavItem[] = [
  { href: '/documents',   icon: 'ti-file',        label: 'Document Center',  type: 'company' },
  { href: '/calendar',    icon: 'ti-calendar',    label: 'Quality Calendar', type: 'company' },
  { href: '/settings',    icon: 'ti-adjustments', label: 'Settings',         type: 'company' },
  { href: '/admin/users', icon: 'ti-users',       label: 'User Management',  type: 'company', badge: 'ADMIN' },
  { href: '/admin/rbac',  icon: 'ti-lock',        label: 'RBAC Matrix',      type: 'company', badge: 'ADMIN' },
];

// -- QM Workspace top pins (Zone 1) -------------------------------------------
const TOP_PINS = [
  { href: '/dashboard',      icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { href: '/internal-audit', icon: 'ti-checklist',        label: 'Int. Audit', badge: 'NEW' },
  { href: '/tasks',          icon: 'ti-check',            label: 'Tasks' },
  { href: '/notifications',  icon: 'ti-bell',             label: 'Notifications' },
];

// -- NotifBadge ----------------------------------------------------------------
function NotifBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    fetch('/api/notifications?count=true')
      .then(r => r.json()).then(d => setCount(d.unreadCount ?? 0)).catch(() => {});
    const t = setInterval(() => {
      fetch('/api/notifications?count=true')
        .then(r => r.json()).then(d => setCount(d.unreadCount ?? 0)).catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  if (!count) return null;
  return (
    <span style={{
      position: 'absolute', top: '4px', right: '8px',
      minWidth: '14px', height: '14px',
      background: '#dc2626', color: '#fff',
      fontSize: '8px', fontWeight: 800,
      borderRadius: '7px', padding: '0 3px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
    }}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

// -- ApprovalCount -------------------------------------------------------------
function ApprovalCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const load = () =>
      fetch('/api/approvals')
        .then(r => r.json())
        .then(d => setCount(d.counts?.pending ?? 0))
        .catch(() => {});
    load();
    const t = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);
  if (!count) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: '16px', height: '16px',
      background: '#dc2626', color: '#fff',
      fontSize: '9px', fontWeight: 800, borderRadius: '8px', padding: '0 4px',
      marginLeft: '4px', lineHeight: 1,
    }}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

// -- BranchBadge ---------------------------------------------------------------
function BranchBadge() {
  const [branch, setBranch] = useState('');
  useEffect(() => {
    fetch('/api/branch').then(r => r.json()).then(d => setBranch(d.branch)).catch(() => {});
  }, []);
  if (!branch) return null;
  const isMain = branch === 'main';
  const isDev  = branch === 'dev';
  const bg    = isMain ? '#dbeafe' : isDev ? '#ffedd5' : '#dcfce7';
  const color = isMain ? '#1e40af' : isDev ? '#c2410c' : '#166534';
  return (
    <span style={{
      fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px',
      background: bg, color,
      marginLeft: '6px', letterSpacing: '0.5px', verticalAlign: 'middle',
    }}>
      {branch.toUpperCase()}
    </span>
  );
}

// -- ZoneLabel — small section divider text ------------------------------------
function ZoneLabel({ text, color }: { text: string; color: string }) {
  return (
    <div style={{
      fontSize: '7px', fontWeight: 800, color, letterSpacing: '0.9px',
      textTransform: 'uppercase', padding: '1px 0 3px', textAlign: 'center',
      width: '100%', userSelect: 'none',
    }}>{text}</div>
  );
}

// -- StripIcon -----------------------------------------------------------------
const StripIcon = memo(function StripIcon({ icon, label, active, hasActive, onClick, isLink, href }: {
  icon: string; label: string; active?: boolean; hasActive?: boolean;
  onClick?: () => void; isLink?: boolean; href?: string;
}) {
  const wrapStyle: React.CSSProperties = {
    width: '72px', minHeight: '44px', borderRadius: '10px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    gap: '2px', paddingTop: '4px', paddingBottom: '4px',
    background: active ? C.active : hasActive ? C.hoverBg : 'transparent',
    color: active ? C.activeIcon : hasActive ? C.active : C.icon,
    border: 'none', cursor: 'pointer', position: 'relative',
    transition: 'all 0.15s', textDecoration: 'none', flexShrink: 0,
  };
  const indicator = (active || hasActive) && (
    <div style={{
      position: 'absolute', left: '-6px', top: '50%', transform: 'translateY(-50%)',
      width: '3px', height: '20px',
      background: active ? C.activeIcon : C.icon,
      borderRadius: '0 3px 3px 0',
    }} />
  );
  const inner = (
    <>
      {indicator}
      <i className={`ti ${icon}`} style={{ fontSize: '18px' }} aria-hidden="true" />
      <span style={{
        fontSize: '9px', fontWeight: 600, lineHeight: 1.2, textAlign: 'center',
        color: active ? C.activeIcon : hasActive ? C.active : '#0f172a',
        maxWidth: '68px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        letterSpacing: '0.2px',
      }}>{label}</span>
    </>
  );
  if (isLink && href) return <Link href={href} style={wrapStyle} title={label} aria-label={label}>{inner}</Link>;
  return <button style={wrapStyle} onClick={onClick} title={label} aria-label={label}>{inner}</button>;
});

// -- FlyoutItem ----------------------------------------------------------------
const FlyoutItem = memo(function FlyoutItem({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate?: () => void }) {
  const badgeStyle = item.badge === 'NEW' || item.badge === 'AI' ? C.newBadge
    : item.badge === 'ADMIN' ? C.adminBadge : null;
  return (
    <Link href={item.href} onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '7px 9px', borderRadius: '8px', textDecoration: 'none',
        background: active ? C.active : 'transparent',
        color: active ? '#fff' : C.text,
        margin: '1px 0', transition: 'background 0.1s',
      }}
    >
      <i className={`ti ${item.icon}`} style={{
        fontSize: '15px', flexShrink: 0,
        color: active ? C.activeIcon : item.type === 'common' ? C.commonIcon : C.icon,
      }} aria-hidden="true" />
      <span style={{ fontSize: '11.5px', flex: 1, lineHeight: 1.3, fontWeight: 600, color: active ? '#fff' : '#0f172a' }}>{item.label}</span>
      {item.href === '/approvals' && <ApprovalCount />}
      {item.badge && badgeStyle && (
        <span style={{
          fontSize: '8px', padding: '1px 5px', borderRadius: '3px', fontWeight: 700,
          background: active ? C.activeIcon : badgeStyle.bg,
          color: active ? C.active : badgeStyle.color, flexShrink: 0,
        }}>{item.badge}</span>
      )}
      {item.type === 'common' && !item.badge && !active && (
        <span style={{
          fontSize: '8px', padding: '1px 4px', borderRadius: '3px', fontWeight: 600,
          background: C.commonBadge.bg, color: C.commonBadge.color, flexShrink: 0,
        }}>COMMON</span>
      )}
    </Link>
  );
});

// -- RolePill ------------------------------------------------------------------
function RolePill({ role, label }: { role: string; label: string }) {
  const pillColors: Record<string, { bg: string; color: string }> = {
    quality_head:    { bg: '#fee2e2', color: '#dc2626' },
    quality_manager: { bg: '#fef9c3', color: '#d97706' },
    auditor:         { bg: '#dbeafe', color: '#1d4ed8' },
    viewer:          { bg: '#f1f5f9', color: '#475569' },
  };
  const c = pillColors[role] ?? { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '4px',
      background: c.bg, color: c.color, letterSpacing: '0.3px',
    }}>{label}</span>
  );
}

// -- Sidebar inner content -----------------------------------------------------
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { session } = useSession();

  const visibleManageItems = MANAGE_ITEMS.filter(item => {
    if (item.href === '/admin/users' || item.href === '/admin' || item.href === '/admin/rbac') {
      return !session || session.type === 'ADMIN';
    }
    return true;
  });

  const defaultKey = (() => {
    for (const g of GROUPS) {
      if (g.sections.some(s => s.items.some(i => path === i.href || path.startsWith(i.href + '/')))) return g.key;
    }
    if (visibleManageItems.some(i => path === i.href || path.startsWith(i.href + '/'))) return 'manage';
    return 'dept';
  })();

  const [activeKey, setActiveKey] = useState<string>(defaultKey);
  const isActive       = (href: string) => path === href || path.startsWith(href + '/');
  const groupHasActive = (g: NavGroup) => g.sections.some(s => s.items.some(i => isActive(i.href)));
  const manageHasActive = visibleManageItems.some(i => isActive(i.href));
  const select = (key: string) => setActiveKey(key);
  const activeGroup = GROUPS.find(g => g.key === activeKey);
  const showManage  = activeKey === 'manage';

  const companyGroups = GROUPS.filter(g => COMPANY_KEYS.includes(g.key));
  const commonGroups  = GROUPS.filter(g => COMMON_KEYS.includes(g.key));

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ══════════════════════════════════════════════════════════════════════
          ICON STRIP — 3 coloured zones
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{
        width: '84px', flexShrink: 0,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      }}>

        {/* -- ZONE 1 — QM Workspace (green) ------------------------------- */}
        <div style={{
          background: C.zone1,
          borderBottom: `2px solid ${C.zone1Border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
        }}>
          {/* Logo */}
          <div style={{
            width: '100%', padding: '8px 0 6px',
            borderBottom: `1px solid #86efac`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
          }}>
            <div style={{
              width: '30px', height: '30px', background: C.active,
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: C.activeIcon, letterSpacing: '0.5px' }}>QM</span>
            </div>
            <span style={{ fontSize: '8px', fontWeight: 700, color: C.muted, letterSpacing: '0.5px' }}>QMOS</span>
          </div>

          {/* QM pins: Dashboard · Tasks · Notifications */}
          <div style={{ padding: '3px 0 1px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', width: '100%' }}>
            {TOP_PINS.map(p => (
              <div key={p.href} style={{ position: 'relative' }}>
                <StripIcon icon={p.icon} label={p.label} active={isActive(p.href)} isLink href={p.href} />
                {p.href === '/notifications' && <NotifBadge />}
              </div>
            ))}
          </div>
          <ZoneLabel text="QM Workspace" color={C.zone1Text} />
        </div>

        {/* -- ZONE 2 — Company (blue) -------------------------------------- */}
        <div style={{
          background: C.zone2,
          borderBottom: `2px solid ${C.zone2Border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
        }}>
          <div style={{ padding: '3px 0 1px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', width: '100%' }}>
            {companyGroups.map(g => (
              <StripIcon key={g.key} icon={g.icon} label={g.short}
                active={activeKey === g.key}
                hasActive={activeKey !== g.key && groupHasActive(g)}
                onClick={() => select(g.key)}
              />
            ))}
          </div>
          <ZoneLabel text="Company" color={C.zone2Text} />
        </div>

        {/* -- ZONE 3 — Common (violet) ------------------------------------- */}
        <div style={{
          background: C.zone3,
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <div style={{ flex: 1, padding: '3px 0 1px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', width: '100%' }}>
            {commonGroups.map(g => (
              <StripIcon key={g.key} icon={g.icon} label={g.short}
                active={activeKey === g.key}
                hasActive={activeKey !== g.key && groupHasActive(g)}
                onClick={() => select(g.key)}
              />
            ))}
          </div>
          <ZoneLabel text="Common" color={C.zone3Text} />

          {/* Manage — pinned at bottom of Zone 3 */}
          <div style={{
            borderTop: `1px solid ${C.zone3Border}`,
            width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '3px 0 6px',
          }}>
            <StripIcon icon="ti-settings-2" label="Manage"
              active={activeKey === 'manage'}
              hasActive={activeKey !== 'manage' && manageHasActive}
              onClick={() => select('manage')}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FLYOUT PANEL
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ width: '206px', flexShrink: 0, background: C.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header — colour-coded to match active zone */}
        <div style={{
          padding: '12px 14px 10px',
          background: COMPANY_KEYS.includes(activeKey) ? C.zone2 : COMMON_KEYS.includes(activeKey) ? C.zone3 : '#dbeafe',
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: C.active, letterSpacing: '1px' }}>QMOS</span>
            <BranchBadge />
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.active }}>
            {showManage ? '⚙️ Manage' : activeGroup?.title ?? ''}
          </div>
          <div style={{ fontSize: '9px', color: '#334155', marginTop: '2px', fontWeight: 500 }}>
            {showManage
              ? 'Documents · Settings · Admin'
              : activeGroup?.sub ?? ''}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {showManage && visibleManageItems.map(item => (
            <FlyoutItem key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
          ))}
          {!showManage && activeGroup?.sections.map((sec, si) => (
            <div key={si}>
              {sec.label && (
                <div style={{
                  fontSize: '8.5px', fontWeight: 800, color: C.section,
                  letterSpacing: '1px', textTransform: 'uppercase',
                  padding: '10px 8px 4px',
                }}>
                  {sec.label}
                </div>
              )}
              {sec.items.map(item => (
                <FlyoutItem key={item.href} item={item} active={isActive(item.href)} onNavigate={onNavigate} />
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 14px 10px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          {session && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: '#334155', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.name}
              </span>
              <RolePill role={session.rbacRole} label={
                session.rbacRole === 'quality_head' ? 'QH' :
                session.rbacRole === 'quality_manager' ? 'QM' :
                session.rbacRole === 'auditor' ? 'AUD' : 'VIEW'
              } />
            </div>
          )}
          <p style={{ fontSize: '9px', color: C.muted, lineHeight: 1.6 }}>
            IATF 16949 · ISO 9001<br />
            AIAG · VDA · CQI
          </p>
        </div>
      </div>
    </div>
  );
}

// -- Main Sidebar export --------------------------------------------------------
export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = useCallback(() => setMobileOpen(v => !v), []);
  useEffect(() => {
    window.addEventListener('toggle-sidebar', toggleMobile);
    return () => window.removeEventListener('toggle-sidebar', toggleMobile);
  }, [toggleMobile]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* -- DESKTOP sidebar ----------------------------------------------- */}
      <aside
        aria-label="Main navigation"
        className="hidden md:flex"
        style={{
          width: '290px', flexShrink: 0,
          background: C.bg, borderRight: `1px solid ${C.border}`,
          height: '100%', overflow: 'hidden',
          boxShadow: '2px 0 12px rgba(99,102,241,0.06)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* -- MOBILE backdrop ----------------------------------------------- */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* -- MOBILE slide-in drawer ---------------------------------------- */}
      <aside
        aria-label="Main navigation"
        aria-modal={mobileOpen}
        className="md:hidden fixed inset-y-0 left-0 z-50 flex"
        style={{
          width: '290px',
          background: C.bg, borderRight: `1px solid ${C.border}`,
          boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <button
          onClick={closeMobile}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-500 hover:text-slate-900 shadow-sm transition"
          aria-label="Close menu"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{ width: '290px', height: '100%', overflow: 'hidden' }}>
          <SidebarContent onNavigate={closeMobile} />
        </div>
      </aside>
    </>
  );
}
