export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  try {
    const db = getDB();
    const plans = db.prepare('SELECT * FROM audit_plans ORDER BY created_at DESC').all();

    const withCounts = plans.map((p: Record<string, unknown>) => {
      const counts = db.prepare(`
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN finding_type='MajorNC' THEN 1 ELSE 0 END) as major_nc,
          SUM(CASE WHEN finding_type='MinorNC' THEN 1 ELSE 0 END) as minor_nc,
          SUM(CASE WHEN finding_type='Observation' THEN 1 ELSE 0 END) as observation,
          SUM(CASE WHEN finding_type='OFI' THEN 1 ELSE 0 END) as ofi,
          SUM(CASE WHEN finding_type='Conforming' THEN 1 ELSE 0 END) as conforming
        FROM audit_findings WHERE plan_id = ?
      `).get(p.id as number) as Record<string, number>;
      return { ...p, counts };
    });

    return NextResponse.json({ plans: withCounts });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDB();
    const body = await req.json() as {
      title: string; department: string; auditor_name?: string;
      audit_date?: string; standard?: string; section_filter?: string; notes?: string;
    };

    const now = new Date().toISOString();
    const yr  = new Date().getFullYear();
    const seq = (db.prepare('SELECT COUNT(*)+1 as n FROM audit_plans').get() as { n: number }).n;
    const plan_number = `AUD-${yr}-${String(seq).padStart(3, '0')}`;

    const res = db.prepare(`
      INSERT INTO audit_plans (plan_number,title,department,auditor_name,audit_date,standard,section_filter,notes,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `).run(
      plan_number, body.title, body.department,
      body.auditor_name ?? '', body.audit_date ?? '',
      body.standard ?? 'Both', body.section_filter ?? 'All',
      body.notes ?? '', now, now
    );

    return NextResponse.json({ id: res.lastInsertRowid, plan_number });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
