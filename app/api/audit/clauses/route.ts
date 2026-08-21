export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const db = getDB();
    const { searchParams } = new URL(req.url);
    const standard = searchParams.get('standard') || 'All';
    const section  = searchParams.get('section')  || 'All';
    const q        = searchParams.get('q')         || '';

    let sql = 'SELECT * FROM audit_clauses WHERE standard != ?';
    const params: (string | number)[] = ['SEC'];

    if (standard !== 'All') { sql += ' AND standard = ?'; params.push(standard); }
    if (section  !== 'All') { sql += ' AND section = ?';  params.push(section); }
    if (q) {
      sql += ' AND (clause_no LIKE ? OR clause_title LIKE ? OR simple_meaning LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like);
    }
    sql += ' ORDER BY id ASC';

    const rows = db.prepare(sql).all(...params);
    const count = (db.prepare('SELECT COUNT(*) as c FROM audit_clauses WHERE standard != ?').get('SEC') as { c: number }).c;
    return NextResponse.json({ clauses: rows, total: count });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
