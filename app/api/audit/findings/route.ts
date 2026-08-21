import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    const { searchParams } = new URL(req.url);
    const plan_id = searchParams.get('plan_id');
    const status  = searchParams.get('status') || 'All';
    const type    = searchParams.get('type')   || 'All';

    let sql = 'SELECT * FROM audit_findings WHERE 1=1';
    const params: (string | number)[] = [];

    if (plan_id) { sql += ' AND plan_id = ?'; params.push(plan_id); }
    if (status !== 'All') { sql += ' AND status = ?'; params.push(status); }
    if (type   !== 'All') { sql += ' AND finding_type = ?'; params.push(type); }
    sql += ' ORDER BY id DESC';

    const rows = db.prepare(sql).all(...params);

    // Summary counts
    const summary = db.prepare(`
      SELECT
        SUM(CASE WHEN finding_type='MajorNC' THEN 1 ELSE 0 END) as major_nc,
        SUM(CASE WHEN finding_type='MinorNC' THEN 1 ELSE 0 END) as minor_nc,
        SUM(CASE WHEN finding_type='Observation' THEN 1 ELSE 0 END) as observation,
        SUM(CASE WHEN finding_type='OFI' THEN 1 ELSE 0 END) as ofi,
        SUM(CASE WHEN status='Open' THEN 1 ELSE 0 END) as open_count,
        COUNT(*) as total
      FROM audit_findings
    `).get();

    return NextResponse.json({ findings: rows, summary });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDB();
    const body = await req.json() as {
      plan_id: number; clause_id?: number; clause_no: string; clause_title: string;
      finding_type: string; finding_notes?: string; evidence?: string; capa_ref?: string;
    };
    const now = new Date().toISOString();

    // Skip if Conforming or NA — only store actual findings
    const res = db.prepare(`
      INSERT INTO audit_findings
        (plan_id,clause_id,clause_no,clause_title,finding_type,finding_notes,evidence,capa_ref,status,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      body.plan_id, body.clause_id ?? 0, body.clause_no, body.clause_title,
      body.finding_type, body.finding_notes ?? '', body.evidence ?? '',
      body.capa_ref ?? '', 'Open', now, now
    );

    return NextResponse.json({ id: res.lastInsertRowid });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
