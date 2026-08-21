'use client';
import { useState, useEffect } from 'react';
import type { RBACRole } from '@/lib/rbac';
import { FEATURE } from '@/lib/rbac';

// ── Session type ──────────────────────────────────────────────────────────────
export interface QMOSSession {
  authenticated: boolean;
  name:          string;
  email:         string;
  type:          'ADMIN' | 'USER';
  role:          string;          // display string from DB
  rbacRole:      RBACRole;        // resolved standardised role
  department:    string;
  plant:         string;
  company_id:    string | null;
  company_code:  string;
  loginAt:       string;
  // Convenience permission booleans
  can: {
    viewAll:          boolean;
    createComplaints: boolean;
    editComplaints:   boolean;
    supplierDev:      boolean;
    approveCAPA:      boolean;
    managementReview: boolean;
    exportPDF:        boolean;
    userManagement:   boolean;
    systemAdmin:      boolean;
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────
let _cache: QMOSSession | null = null; // module-level cache — one fetch per page load

export function useSession() {
  const [session, setSession] = useState<QMOSSession | null>(_cache);
  const [loading, setLoading] = useState<boolean>(_cache === null);

  useEffect(() => {
    if (_cache !== null) { setSession(_cache); setLoading(false); return; }
    let cancelled = false;
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        if (!d.authenticated) {
          _cache = null;
          setSession(null);
          setLoading(false);
          return;
        }
        const role: RBACRole = d.rbacRole;
        const s: QMOSSession = {
          ...d,
          can: {
            viewAll:          FEATURE.viewAll(role),
            createComplaints: FEATURE.createComplaints(role),
            editComplaints:   FEATURE.editComplaints(role),
            supplierDev:      FEATURE.supplierDev(role),
            approveCAPA:      FEATURE.approveCAPA(role),
            managementReview: FEATURE.managementReview(role),
            exportPDF:        FEATURE.exportPDF(role),
            userManagement:   FEATURE.userManagement(role),
            systemAdmin:      FEATURE.systemAdmin(role),
          },
        };
        _cache = s;
        setSession(s);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setSession(null); setLoading(false); }
      });
    return () => { cancelled = true; };
  }, []);

  return { session, loading };
}

/** Call this after logout to clear the module cache. */
export function clearSessionCache() { _cache = null; }
