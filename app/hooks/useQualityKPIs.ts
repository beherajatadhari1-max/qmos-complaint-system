'use client';
import { useState, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface KPIOverview {
  total: number; open: number; closed: number;
  critical: number; inProgress: number;
  ppm: number; totalRejected: number; totalSupplied: number;
}

export interface CustomerKPI {
  name: string;
  total: number; open: number; critical: number;
  rejected: number; supplied: number;
  ppm: number | null;
}

export interface WarrantyItem {
  id: string; complaint_number: string;
  customer: string; part_name: string; defect: string;
  severity: string; status: string;
  warranty_claim_no: string; vehicle_number: string; created_at: string;
}

export interface MonthlyTrend {
  month: string; label: string; complaints: number; closed: number; ppm: number;
}

export interface CategoryPareto {
  category: string; count: number;
}

export interface QualityKPIData {
  overview:       KPIOverview;
  byCustomer:     CustomerKPI[];
  warrantyItems:  WarrantyItem[];
  monthlyTrend:   MonthlyTrend[];
  categoryPareto: CategoryPareto[];
  bySeverity:     { severity: string; count: number }[];
  recentOpen:     { id: string; complaint_number: string; customer: string; part_name: string; severity: string; status: string; created_at: string }[];
  fetchedAt:      string;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useQualityKPIs() {
  const [data, setData]       = useState<QualityKPIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/quality-kpis')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
