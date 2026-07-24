import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET() {
  const db = getDB();
  const total = (db.prepare("SELECT COUNT(*) as c FROM complaints").get() as { c: number }).c;
  const open = (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status NOT IN ('Closed','Cancelled')").get() as { c: number }).c;
  const closed = (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status = 'Closed'").get() as { c: number }).c;
  const critical = (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE severity = 'Critical' AND status NOT IN ('Closed','Cancelled')").get() as { c: number }).c;
  const inProgress = (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE status IN ('Under Investigation','CAPA In Progress','Pending Verification','Pending Closure')").get() as { c: number }).c;

  // Customer PPM
  const ppmData = db.prepare("SELECT SUM(quantity_affected) as rej, SUM(total_supplied) as sup FROM complaints WHERE status != 'Cancelled'").get() as { rej: number; sup: number };
  const ppm = ppmData.sup > 0 ? Math.round((ppmData.rej / ppmData.sup) * 1000000) : 0;

  // Monthly trend (last 6 months)
  const trend = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as opened,
    SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed
    FROM complaints
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC LIMIT 6
  `).all().reverse();

  // Pareto by defect category
  const pareto = db.prepare(`
    SELECT defect_category, COUNT(*) as count FROM complaints
    WHERE defect_category != '' GROUP BY defect_category ORDER BY count DESC LIMIT 6
  `).all();

  // By severity
  const bySeverity = db.prepare(`
    SELECT severity, COUNT(*) as count FROM complaints GROUP BY severity
  `).all();

  // By status
  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count FROM complaints GROUP BY status
  `).all();

  // Recent open complaints
  const recentOpen = db.prepare(`
    SELECT id, complaint_number, customer_name, part_name, severity, status, created_at, defect_description
    FROM complaints WHERE status NOT IN ('Closed','Cancelled')
    ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, created_at ASC
    LIMIT 8
  `).all();

  return NextResponse.json({ total, open, closed, critical, inProgress, ppm, trend, pareto, bySeverity, byStatus, recentOpen });
}
