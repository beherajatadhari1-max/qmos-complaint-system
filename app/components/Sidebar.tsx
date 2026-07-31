'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────
type ItemType = 'company' | 'free';
interface NavItem   { href: string; icon: string; label: string; badge?: string; type: ItemType }
interface NavSection { label?: string; items: NavItem[] }
interface NavGroup  { key: string; icon: string; title: string; sub: string; sections: NavSection[] }

// ── Theme: M2 + M5 mix ────────────────────────────────────────────────────────
// bg #f5f7ff · strip #edf0ff · border #dde3f5
// active navy #1e2a5a · active icon amber #fbbf24
// icon indigo #6366f1 · free icon emerald #10b981 · text #374151
const C = {
  bg:         '#f5f7ff',
  strip:      '#edf0ff',
  border:     '#dde3f5',
  active:     '#1e2a5a',
  activeIcon: '#fbbf24',
  icon:       '#6366f1',
  freeIcon:   '#10b981',
  text:       '#374151',
  muted:      '#9ca3af',
  section:    '#6366f1',
  hoverBg:    '#e8ecff',
  freeBadge:  { bg: '#ecfdf5', color: '#059669' },
  newBadge:   { bg: '#ede9fe', color: '#7c3aed' },
  adminBadge: { bg: '#fef3c7', color: '#92400e' },
};

// ── Navigation data ────────────────────────────────────────────────────────────
const GROUPS: NavGroup[] = [
  {
    key: 'dept', icon: 'ti-building', title: 'Departments', sub: 'Company data · Login required',
    sections: [{
      items: [
        { href: '/customer-quality',    icon: 'ti-users',              label: 'Customer Quality',    type: 'company' },
        { href: '/supplier-quality',    icon: 'ti-truck',              label: 'Supplier Quality',    type: 'company' },
        { href: '/supplier-complaints', icon: 'ti-alert-circle',       label: 'Supplier NCR / SCAR', type: 'company' },
        { href: '/incoming-quality',    icon: 'ti-package',            label: 'Incoming Quality',    type: 'company' },
        { href: '/process-quality',     icon: 'ti-settings-2',         label: 'Inprocess Quality',   type: 'company' },
        { href: '/internal-ncr',        icon: 'ti-circle-x',           label: 'Internal NCR',        type: 'company' },
        { href: '/manufacturing',       icon: 'ti-building-factory-2', label: 'Manufacturing',       type: 'company' },
        { href: '/outgoing-quality',    icon: 'ti-send',               label: 'Outgoing Quality',    type: 'company' },
        { href: '/tqm',                 icon: 'ti-trophy',             label: 'TQM / TBEM',          type: 'company' },
        { href: '/corporate',           icon: 'ti-chart-pie',          label: 'Corporate Reports',   type: 'company' },
        { href: '/managerial',          icon: 'ti-briefcase',          label: 'Managerial',          type: 'company' },
      ],
    }],
  },
  {
    key: 'tools', icon: 'ti-tool', title: 'Quality Tools', sub: 'Company tools + free calculators',
    sections: [
      {
        label: 'Company tools',
        items: [
          { href: '/apqp',         icon: 'ti-rocket',        label: 'APQP Tracker',     type: 'company' },
          { href: '/ppap',         icon: 'ti-package',       label: 'PPAP Tracker',     type: 'company' },
          { href: '/pfmea',        icon: 'ti-alert-triangle',label: 'PFMEA Generator',  type: 'company' },
          { href: '/control-plan', icon: 'ti-list-check',    label: 'Control Plan',     type: 'company' },
          { href: '/audit',        icon: 'ti-checkup-list',  label: 'Audit Checklists', type: 'company' },
        ],
      },
      {
        label: 'Free calculators',
        items: [
          { href: '/spc', icon: 'ti-chart-line', label: 'SPC Calculator',  type: 'free' },
          { href: '/msa', icon: 'ti-microscope', label: 'MSA / GRR Calc',  type: 'free' },
        ],
      },
    ],
  },
  {
    key: 'intel', icon: 'ti-brain', title: 'Intelligence', sub: 'AI tools + company analytics',
    sections: [
      {
        label: 'Free AI tools',
        items: [
          { href: '/ai-copilot',      icon: 'ti-robot',               label: 'AI Quality Copilot', type: 'free' },
          { href: '/ai-generator',    icon: 'ti-dna',                 label: 'AI Doc Generator',   type: 'free', badge: 'NEW' },
          { href: '/pfmea-converter', icon: 'ti-refresh',             label: 'FMEA Converter',     type: 'free', badge: 'NEW' },
          { href: '/8d',              icon: 'ti-file-text',           label: '8D Report',          type: 'free' },
          { href: '/pfd',             icon: 'ti-arrows-transfer-down',label: 'PFD Generator',      type: 'free' },
        ],
      },
      {
        label: 'Company analytics',
        items: [
          { href: '/analytics', icon: 'ti-chart-bar', label: 'Analytics Dashboard', type: 'company' },
          { href: '/capa',      icon: 'ti-tool',      label: 'CAPA Management',     type: 'company' },
        ],
      },
    ],
  },
  {
    key: 'learn', icon: 'ti-world', title: '🌍 Common Zone', sub: 'Free · No login required',
    sections: [
      {
        label: 'Training',
        items: [
          { href: '/training', icon: 'ti-school',         label: 'Training Academy', type: 'free' },
          { href: '/learning', icon: 'ti-book',           label: 'Learning Hub',     type: 'free' },
          { href: '/qms',      icon: 'ti-clipboard-list', label: 'IATF / QMS Guide', type: 'free' },
        ],
      },
    ],
  },
];

const MANAGE_ITEMS: NavItem[] = [
  { href: '/documents',   icon: 'ti-file',        label: 'Document Center',  type: 'company' },
  { href: '/calendar',    icon: 'ti-calendar',    label: 'Quality Calendar', type: 'company' },
  { href: '/settings',    icon: 'ti-adjustments', label: 'Settings',         type: 'company' },
  { href: '/admin/users', icon: 'ti-lock',        label: 'User Management',  type: 'company', badge: 'ADMIN' },
];

const TOP_PINS = [
  { href: '/dashboard',     icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { href: '/tasks',         icon: 'ti-check',            label: 'My Tasks' },
  { href: '/notifications', icon: 'ti-bell',             label: 'Notifications' },
];

// ── BranchBadge ───────────────────────────────────────────────────────────────
function BranchBadge() {
  const [branch, setBranch] = useState('');
  useEffect(() => {
    fetch('/api/branch').then(r => r.json()).then(d => setBranch(d.branch)).catch(() => {});
  }, []);
  if (!branch) return null;
  const isMain = branch === 'main';
  return (
    <span style={{
      fontSize: '8px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px',
      background: isMain ? '#dbeafe' : '#dcfce7',
      color: isMain ? '#1e40af' : '#166534',
      marginLeft: '6px', letterSpacing: '0.5px', verticalAlign: 'middle',
    }}>
      {branch.toUpperCase()}
    </span>
  );
}

// ── StripIcon ─────────────────────────────────────────────────────────────────
function StripIcon({
  icon, label, active, hasActive, onClick, isLink, href,
}: {
  icon: string; label: string; active?: boolean; hasActive?: boolean;
  onClick?: () => void; isLink?: boolean; href?: string;
}) {
  const style: React.CSSProperties = {
    width: '36px', height: '36px', borderRadius: '9px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: active ? C.active : hasActive ? C.hoverBg : 'transparent',
    color: active ? C.activeIcon : hasActive ? C.active : C.icon,
    border: 'none', cursor: 'pointer', position: 'relative',
    transition: 'all 0.15s', textDecoration: 'none', flexShrink: 0,
  };
  const indicator = (active || hasActive) && (
    <div style={{
      position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%)',
      width: '3px', height: '18px',
      background: active ? C.activeIcon : C.icon,
      borderRadius: '0 3px 3px 0',
    }} />
  );
  const iconEl = <i className={`ti ${icon}`} style={{ fontSize: '18px' }} aria-hidden="true" />;

  if (isLink && href) {
    return (
      <Link href={href} style={style} title={label}>
        {indicator}
        {iconEl}
      </Link>
    );
  }
  return (
    <button style={style} onClick={onClick} title={label}>
      {indicator}
      {iconEl}
    </button>
  );
}

// ── FlyoutItem ────────────────────────────────────────────────────────────────
function FlyoutItem({ item, active }: { item: NavItem; active: boolean }) {
  const badgeStyle = item.badge === 'NEW'
    ? C.newBadge
    : item.badge === 'ADMIN'
    ? C.adminBadge
    : null;

  return (
    <Link href={item.href}
      style={{
        display: 'flex', alignItems: 'center', gap: '9px',
        padding: '7px 9px', borderRadius: '8px', textDecoration: 'none',
        background: active ? C.active : 'transparent',
        color: active ? '#fff' : C.text,
        margin: '1px 0', transition: 'background 0.1s',
      }}
    >
      <i
        className={`ti ${item.icon}`}
        style={{
          fontSize: '15px', flexShrink: 0,
          color: active ? C.activeIcon : item.type === 'free' ? C.freeIcon : C.icon,
        }}
        aria-hidden="true"
      />
      <span style={{ fontSize: '11.5px', flex: 1, lineHeight: 1.3 }}>{item.label}</span>
      {item.badge && badgeStyle && (
        <span style={{
          fontSize: '8px', padding: '1px 5px', borderRadius: '3px', fontWeight: 700,
          background: active ? C.activeIcon : badgeStyle.bg,
          color: active ? C.active : badgeStyle.color,
          flexShrink: 0,
        }}>
          {item.badge}
        </span>
      )}
      {item.type === 'free' && !item.badge && !active && (
        <span style={{
          fontSize: '8px', padding: '1px 4px', borderRadius: '3px', fontWeight: 600,
          background: C.freeBadge.bg, color: C.freeBadge.color, flexShrink: 0,
        }}>
          FREE
        </span>
      )}
    </Link>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar() {
  const path = usePathname();
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const isActive   = (href: string) => path === href || path.startsWith(href + '/');
  const groupHasActive = (g: NavGroup) =>
    g.sections.some(s => s.items.some(i => isActive(i.href)));
  const manageHasActive = MANAGE_ITEMS.some(i => isActive(i.href));

  const toggle = (key: string) => setActiveKey(prev => prev === key ? null : key);

  const flyOpen    = activeKey !== null;
  const activeGroup = GROUPS.find(g => g.key === activeKey);
  const showManage  = activeKey === 'manage';

  return (
    <aside style={{
      width: flyOpen ? '258px' : '52px',
      background: C.bg,
      borderRight: `1px solid ${C.border}`,
      transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)',
      display: 'flex',
      flexShrink: 0,
      height: '100%',
      overflow: 'hidden',
      boxShadow: flyOpen ? '2px 0 12px rgba(99,102,241,0.06)' : 'none',
    }}>

      {/* ══ ICON STRIP ═══════════════════════════════════════════════════════ */}
      <div style={{
        width: '52px', flexShrink: 0,
        background: C.strip,
        borderRight: `1px solid ${C.border}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        height: '100%',
      }}>

        {/* Logo mark */}
        <div style={{
          width: '100%', padding: '13px 0 11px',
          borderBottom: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <div style={{
            width: '30px', height: '30px', background: C.active,
            borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '9px', fontWeight: 800, color: C.activeIcon, letterSpacing: '0.5px' }}>QM</span>
          </div>
        </div>

        {/* Top pinned — Dashboard, Tasks, Notifications */}
        <div style={{ padding: '10px 0 4px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', width: '100%' }}>
          {TOP_PINS.map(p => (
            <StripIcon
              key={p.href} icon={p.icon} label={p.label}
              active={isActive(p.href)} isLink href={p.href}
            />
          ))}
        </div>

        {/* Divider */}
        <div style={{ width: '28px', height: '1px', background: C.border, margin: '6px 0' }} />

        {/* Group icons */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', padding: '2px 0' }}>
          {GROUPS.map(g => (
            <StripIcon
              key={g.key} icon={g.icon} label={g.title}
              active={activeKey === g.key}
              hasActive={activeKey !== g.key && groupHasActive(g)}
              onClick={() => toggle(g.key)}
            />
          ))}
        </div>

        {/* Bottom — Manage */}
        <div style={{
          padding: '8px 0 10px', borderTop: `1px solid ${C.border}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%',
        }}>
          <StripIcon
            icon="ti-settings-2" label="Manage"
            active={activeKey === 'manage'}
            hasActive={activeKey !== 'manage' && manageHasActive}
            onClick={() => toggle('manage')}
          />
        </div>
      </div>

      {/* ══ FLYOUT PANEL ═════════════════════════════════════════════════════ */}
      <div style={{
        width: '206px', flexShrink: 0,
        background: C.bg,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        opacity: flyOpen ? 1 : 0,
        transition: 'opacity 0.18s',
        pointerEvents: flyOpen ? 'auto' : 'none',
      }}>

        {/* Flyout header */}
        <div style={{
          padding: '12px 14px 10px',
          background: C.strip,
          borderBottom: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          {/* QMOS brand */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: C.active, letterSpacing: '1px' }}>QMOS</span>
            <BranchBadge />
          </div>
          {/* Section title */}
          <div style={{ fontSize: '11px', fontWeight: 700, color: C.active }}>
            {showManage ? '⚙️ Manage' : activeGroup?.title ?? ''}
          </div>
          <div style={{ fontSize: '9px', color: C.muted, marginTop: '2px' }}>
            {showManage ? 'Documents · Settings · Admin'
              : activeGroup?.key === 'learn' ? '🌍 Free · No login required'
              : activeGroup?.sub ?? ''}
          </div>
        </div>

        {/* Flyout body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>

          {/* Manage items */}
          {showManage && MANAGE_ITEMS.map(item => (
            <FlyoutItem key={item.href} item={item} active={isActive(item.href)} />
          ))}

          {/* Group sections */}
          {!showManage && activeGroup?.sections.map((sec, si) => (
            <div key={si}>
              {sec.label && (
                <div style={{
                  fontSize: '8.5px', fontWeight: 700, color: C.section,
                  letterSpacing: '1px', textTransform: 'uppercase',
                  padding: '10px 8px 4px', opacity: 0.65,
                }}>
                  {sec.label}
                </div>
              )}
              {sec.items.map(item => (
                <FlyoutItem key={item.href} item={item} active={isActive(item.href)} />
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 14px 10px',
          borderTop: `1px solid ${C.border}`,
          flexShrink: 0,
        }}>
          <p style={{ fontSize: '9px', color: C.muted, lineHeight: 1.6 }}>
            IATF 16949 · ISO 9001<br />
            AIAG · VDA · CQI
          </p>
        </div>
      </div>
    </aside>
  );
}
