import { NextRequest, NextResponse } from 'next/server';
import { getDB, logTimeline } from '@/lib/db';
import { generate8D } from '@/lib/generate8D';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDB();
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });

    const report = generate8D({
      customerName: complaint.customer_name as string,
      partNumber: complaint.part_number as string,
      partName: complaint.part_name as string,
      defectDescription: complaint.defect_description as string,
      quantityAffected: complaint.quantity_affected as number,
      severity: complaint.severity as string,
      assignedTo: complaint.assigned_to as string,
    });

    db.prepare(`
      UPDATE complaints SET
        d1_team = ?,
        d2_problem = ?,
        d3_containment = ?,
        d4_root_cause = ?,
        d4_why_made = ?,
        d4_why_shipped = ?,
        d5_corrective_actions = ?,
        d5_ca_why_made = ?,
        d5_ca_why_shipped = ?,
        d6_implementation = ?,
        d7_prevention = ?,
        d8_congratulations = ?,
        report_generated = 1,
        updated_at = datetime('now','localtime')
      WHERE id = ?
    `).run(
      report.d1, report.d2, report.d3,
      report.d4, report.d4_why_made, report.d4_why_shipped,
      report.d5, report.d5_ca_why_made, report.d5_ca_why_shipped,
      report.d6, report.d7, report.d8, id
    );

    logTimeline(parseInt(id), '8D_GENERATED', `8D report auto-generated — defect type detected and all D1–D8 sections populated`);

    const updated = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate 8D report' }, { status: 500 });
  }
}
