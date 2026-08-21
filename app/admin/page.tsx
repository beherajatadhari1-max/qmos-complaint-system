'use client';
import Link from 'next/link';
import RoleGuard from '../components/RoleGuard';

const ADMIN_CARDS = [
  {
    href: '/admin/users',
    icon: 'ti-users',
    color: 'blue',
    title: 'User Management',
    desc: 'Add, edit, deactivate users. Assign roles and set access levels for your team.',
    badge: null,
  },
  {
    href: '/admin/rbac',
    icon: 'ti-lock',
    color: 'purple',
    title: 'RBAC Permission Matrix',
    desc: 'View all role permissions, route access levels, and IATF 16949 alignment for access control.',
    badge: 'IATF Cl.5.3',
  },
  {
    href: '/audit-trail',
    icon: 'ti-history',
    color: 'slate',
    title: 'System Audit Trail',
    desc: 'Complete revision history of all system actions — objective evidence for IATF Cl. 7.5.3 audits.',
    badge: 'IATF Cl.7.5.3',
  },
];

const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-500/10 border-[#bfdbfe] text-[#1d4ed8]',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  slate:  'bg-slate-500/10 border-[#dbeafe]/30 text-[#1e3a5f]',
};

export default function AdminPage() {
  return (
    <RoleGuard minLevel={4} deniedMessage="System administration requires Quality Head access.">
      <div className="min-h-screen bg-[#eff6ff] text-[#0f172a]">
        <div className="bg-gradient-to-r from-[#0f1a2e] to-[#0b1220] border-b border-[#dbeafe] px-6 py-5">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#f0f9ff]/50 border border-[#dbeafe] flex items-center justify-center">
                <i className="ti ti-settings text-[#1e3a5f] text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Administration</h1>
                <p className="text-xs text-[#1e3a5f]">System settings — Quality Head only</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid sm:grid-cols-2 gap-4">
            {ADMIN_CARDS.map(card => (
              <Link key={card.href} href={card.href}>
                <div className="bg-white border border-[#dbeafe] rounded-xl p-5 hover:border-[#dbeafe] hover:bg-[#eff6ff] transition-all group cursor-pointer">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${COLOR_MAP[card.color]}`}>
                      <i className={`ti ${card.icon} text-lg`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-bold text-white group-hover:text-[#1d4ed8] transition-colors">{card.title}</h2>
                        {card.badge && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-600 font-mono">
                            {card.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#1e3a5f] leading-relaxed">{card.desc}</p>
                    </div>
                    <i className="ti ti-chevron-right text-[#1e3a5f] group-hover:text-[#1e3a5f] transition-colors mt-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
