import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const processId = searchParams.get('processId');
    const db = getDB();
    const rows = processId
      ? db.prepare('SELECT * FROM process_documents WHERE process_id = ? ORDER BY uploaded_at DESC').all(processId)
      : db.prepare('SELECT * FROM process_documents ORDER BY uploaded_at DESC').all();
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { processId, documentName, fileName, uploadedBy, remarks } = body;
    const db = getDB();
    const result = db.prepare(`
      INSERT INTO process_documents (process_id, document_name, file_name, uploaded_by, remarks)
      VALUES (?, ?, ?, ?, ?)
    `).run(processId, documentName, fileName || '', uploadedBy || 'User', remarks || '');
    const row = db.prepare('SELECT * FROM process_documents WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const db = getDB();
    db.prepare('DELETE FROM process_documents WHERE id = ?').run(Number(id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
