'use client';
import { useRouter } from 'next/navigation';
import { useSession } from '../hooks/useSession';
import type { RBACRole } from '@/lib/rbac';
import { RBAC_ROLES, canAccess } from '@/lib/rbac';

// -- RoleGuard -----------------------------------------------------------------
// Wraps page content and enforces minimum RBAC level.
// Usage:
//   <RoleGuard minLevel={4}>    ← quality_head only
//     <UserManagementContent />
//   </RoleGuard>
//
//   <RoleGuard role="quality_manager">  ← named role or above
//     <ManagementReviewContent />
//   </RoleGuard>
// -----------------------------------------------------------------------------

interface RoleGuardProps {
  children: React.ReactNode;
  /** Minimum numeric level (1–4). Supersedes `role` if both provided. */
  minLevel?: number;
  /** Named minimum role. Equivalent to using minLevel of that role. */
  role?: RBACRole;
  /** Custom message shown on the Access Denied screen. */
  deniedMessage?: string;
}

export default function RoleGuard({ children, minLevel, role, deniedMessage }: RoleGuardProps) {
  const { session, loading } = useSession();
  const router = useRouter();

  // Compute effective minLevel
  const effectiveLevel = minLevel ?? (role ? RBAC_ROLES[role].level : 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-[#1e3a5f] text-sm">
          <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block"/>
          Verifying access…
        </div>
      </div>
    );
  }

  // Not authenticated — redirect to login
  if (!session || !session.authenticated) {
    router.push('/login');
    return null;
  }

  const userLevel = RBAC_ROLES[session.rbacRole].level;
  const allowed   = canAccess(session.rbacRole, effectiveLevel);

  if (!allowed) {
    const required = Object.values(RBAC_ROLES).find(r => r.level === effectiveLevel);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
        {/* Access denied card */}
        <div className="bg-white border border-red-700/50 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
          <div className="text-5xl">🔒</div>
          <div className="text-xl font-bold text-red-600">Access Restricted</div>
          <div className="text-sm text-[#1e3a5f]">
            {deniedMessage ?? 'You do not have permission to access this page.'}
          </div>

          {/* Your role */}
          <div className="bg-[#eff6ff] rounded-lg p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#1e3a5f]">Your role</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${RBAC_ROLES[session.rbacRole].bg}`}>
                {RBAC_ROLES[session.rbacRole].icon} {RBAC_ROLES[session.rbacRole].label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#1e3a5f]">Required minimum</span>
              <span className="text-xs px-2 py-0.5 rounded-full border font-bold bg-red-50 border-red-700/50 text-red-600">
                {required?.icon ?? '👑'} {required?.label ?? 'Quality Head'}
              </span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {[1,2,3,4].map(lvl => (
                <div key={lvl} className={`flex-1 h-1.5 rounded-full ${lvl <= userLevel ? 'bg-blue-500' : 'bg-[#f0f9ff]'}`}/>
              ))}
            </div>
            <div className="text-xs text-[#1e3a5f] text-center">
              Access Level {userLevel} of 4
            </div>
          </div>

          <div className="text-xs text-[#1e3a5f]">
            Contact your Quality Head or System Administrator to request elevated access.
          </div>

          <button
            onClick={() => router.back()}
            className="w-full px-4 py-2 rounded-lg bg-[#f0f9ff] hover:bg-[#dbeafe] text-sm text-white font-semibold transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
