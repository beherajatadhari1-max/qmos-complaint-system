import { NextRequest, NextResponse } from 'next/server';
import { getDB, logTimeline } from '@/lib/db';

export async function GET() {
  try {
    const db = getDB();
    const complaints = db.prepare(
      'SELECT * FROM complaints ORDER BY created_at DESC'
    ).all();
    return NextResponse.json(complaints);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch complaints' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, partNumber, partName, defectDescription, quantityAffected, severity } = body;

    if (!customerName || !defectDescription) {
      return NextResponse.json({ error: 'Customer name and defect description are required' }, { status: 400 });
    }

    const db = getDB();
    const { customerContact, customerRef, complaintSource, complaintDate, complaintType,
      defectCategory, totalSupplied, batchNumber, assignedTo, remarks,
      vehicleNumber, warrantyClaimNo, prrNumber, responseDeadline, rejectionStage } = body;
    const createdAt = complaintDate ? `${complaintDate} 00:00:00` : null;
    const result = db.prepare(`
      INSERT INTO complaints (customer_name, customer_contact, customer_ref, complaint_source, part_number, part_name,
        defect_description, defect_category, quantity_affected, total_supplied, batch_number,
        severity, assigned_to, remarks, complaint_type, vehicle_number, warranty_claim_no,
        prr_number, response_deadline, rejection_stage${createdAt ? ', created_at' : ''})
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?${createdAt ? ', ?' : ''})
    `).run(
      ...[customerName, customerContact || '', customerRef || '', complaintSource || 'Email',
      partNumber || '', partName || '', defectDescription, defectCategory || 'General',
      quantityAffected || 0, totalSupplied || 0, batchNumber || '',
      severity || 'Medium', assignedTo || '', remarks || '',
      complaintType || 'Customer Complaint',
      vehicleNumber || '', warrantyClaimNo || '', prrNumber || '',
      responseDeadline || '', rejectionStage || '',
      ...(createdAt ? [createdAt] : [])]
    );
    const newId = Number(result.lastInsertRowid);
    // Generate complaint number: CC-YYYY-MM-NNNNN
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const monthCount = (db.prepare(`SELECT COUNT(*) as c FROM complaints WHERE complaint_number LIKE 'CC-${ym}-%'`).get() as { c: number }).c;
    const complaintNumber = `CC-${ym}-${String(monthCount).padStart(5,'0')}`;
    db.prepare('UPDATE complaints SET complaint_number = ? WHERE id = ?').run(complaintNumber, newId);
    logTimeline(newId, 'CREATED', `Complaint ${complaintNumber} created — Customer: ${customerName} | Severity: ${severity || 'Medium'}`);
    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(newId);
    return NextResponse.json(complaint, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create complaint' }, { status: 500 });
  }
}
