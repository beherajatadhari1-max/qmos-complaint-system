'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface NavItem { href: string; icon: string; label: string; exact?: boolean; badge?: string }
interface NavGroup { group: string; icon: string; items: NavItem[]; defaultOpen?: boolean }

const NAV: NavGroup[] = [
  {
    group: 'DEPARTMENTS',
    icon: '🏢',
    defaultOpen: true,
    items: [
      { href: '/customer-quality', icon: '👥', label: 'Customer Quality' },
      { href: '/supplier-quality', icon: '🏭', label: 'Supplier Quality' },
      { href: '/incoming-quality', icon: '📦', label: 'Incoming Quality' },
      { href: '/process-quality', icon: '⚙️', label: 'Inprocess Quality' },
      { href: '/apqp', icon: '🚀', label: 'Development Quality' },
      { href: '/manufacturing', icon: '🏗️', label: 'Manufacturing Exc.' },
      { href: '/outgoing-quality', icon: '📤', label: 'Production Quality' },
      { href: '/qms', icon: '📑', label: 'QMS' },
      { href: '/tqm', icon: '🏆', label: 'TQM / TBEM' },
      { href: '/corporate', icon: '📊', label: 'Corporate Reports' },
      { href: '/managerial', icon: '👨‍💼', label: 'Managerial' },
    ],
  },
  {
    group: 'CORE TOOLS',
    icon: '🔧',
    defaultOpen: false,
    items: [
      { href: '/ppap', icon: '📦', label: 'PPAP' },
      { href: '/pfmea', icon: '⚠️', label: 'PFMEA' },
      { href: '/control-plan', icon: '🗂️', label: 'Control Plan' },
      { href: '/spc', icon: '📈', label: 'SPC' },
      { href: '/msa', icon: '🔬', label: 'MSA' },
      { href: '/audit', icon: '✅', label: 'Audit Management' },
    ],
  },
  {
    group: 'INTELLIGENCE',
    icon: '🧠',
    defaultOpen: false,
    items: [
      { href: '/ai-copilot', icon: '🤖', label: 'AI Assistant' },
      { href: '/training', icon: '📚', label: 'Learning Academy' },
      { href: '/analytics', icon: '📈', label: 'Analytics' },
        { href: '/ai-generator', icon: '🧬', label: 'AI Generator', badge: 'NEW' },
    ],
  },
  {
    group: 'MANAGEMENT',
    icon: '⚙️',
    defaultOpen: false,
    items: [
      { href: '/documents', icon: '📄', label: 'Document Center' },
      { href: '/calendar', icon: '📅', label: 'Calendar' },
      { href: '/tasks', icon: '✅', label: 'Tasks' },
      { href: '/notifications', icon: '🔔', label: 'Notifications' },
      { href: '/settings', icon: '⚙️', label: 'Settings' },
    ],
  },
];


function BranchBadge() {
  const [branch, setBranch] = useState('');
  useEffect(() => { fetch('/api/branch').then(r=>r.json()).then(d=>setBranch(d.branch)).catch(()=>{}); }, []);
  if (!branch) return null;
  const isMain = branch === 'main';
  return <span style={{fontSize:'9px',fontWeight:700,padding:'1px 6px',borderRadius:'4px',background:isMain?'#1e3a5f':'#14532d',color:isMain?'#93c5fd':'#86efac',marginLeft:'4px'}}>{branch.toUpperCase()}</span>;
}


// AI Generator collapsible nav (added by QMOS deploy)
export default function Sidebar() {
  const path = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(NAV.map(g => [g.group, g.defaultOpen ?? false]))
  );
  const [collapsed, setCollapsed] = useState(false);

  const toggleGroup = (group: string) =>
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));

  const isActive = (href: string, exact?: boolean) =>
    exact ? path === href : path === href || path.startsWith(href + '/');

  return (
    <aside className={`${collapsed ? 'w-14' : 'w-56'} bg-blue-950 text-white flex flex-col flex-shrink-0 h-full overflow-y-auto transition-all duration-200`}>
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-blue-800 flex-shrink-0">
        {!collapsed && (
          <div>
            <p className="text-sm font-bold tracking-tight">QMOS</p>
            <p className="text-blue-400 text-xs">Quality OS<BranchBadge /></p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(p => !p)}
          className="p-1.5 text-blue-400 hover:text-white hover:bg-blue-800 rounded-lg transition flex-shrink-0"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Dashboard Link */}
      <div className="px-2 pt-2">
        <Link href="/"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
            isActive('/', true) ? 'bg-blue-600 text-white font-semibold' : 'text-blue-200 hover:bg-blue-900 hover:text-white'
          }`}>
          <span className="text-base w-5 text-center flex-shrink-0">🏠</span>
          {!collapsed && <span className="text-xs font-semibold">Dashboard</span>}
        </Link>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 py-2 px-2 space-y-1">
        {NAV.map(group => (
          <div key={group.group}>
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.group)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-blue-900 transition group"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm w-5 text-center flex-shrink-0">{group.icon}</span>
                {!collapsed && (
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider group-hover:text-blue-200">
                    {group.group}
                  </span>
                )}
              </div>
              {!collapsed && (
                <span className="text-blue-500 text-xs">{openGroups[group.group] ? '▾' : '▸'}</span>
              )}
            </button>

            {/* Group Items */}
            {openGroups[group.group] && (
              <div className="mt-0.5 space-y-0.5 ml-1">
                {group.items.map(item => {
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link key={item.href} href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                        active
                          ? 'bg-blue-700 text-white font-semibold'
                          : 'text-blue-200 hover:bg-blue-900 hover:text-white'
                      }`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="text-sm w-5 text-center flex-shrink-0">{item.icon}</span>
                      {!collapsed && <span className="text-xs leading-tight">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="ml-auto text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold">{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-2 border-t border-blue-800 flex-shrink-0">
          <p className="text-xs text-blue-500">IATF 16949 · ISO 9001</p>
          <p className="text-xs text-blue-700">AIAG · VDA · CQI</p>
        </div>
      )}
    </aside>
  );
}
