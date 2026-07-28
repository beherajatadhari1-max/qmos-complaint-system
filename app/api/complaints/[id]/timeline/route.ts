import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const events = getDB().prepare('SELECT * FROM complaint_timeline WHERE complaint_id = ? ORDER BY performed_at DESC').all(id);
  return NextResponse.json(events);
}
