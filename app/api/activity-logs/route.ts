import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const processId = searchParams.get('processId');

    let query = supabaseAdmin
      .from('activity_logs')
      .select('*')
      .order('log_date', { ascending: false })
      .order('id', { ascending: false });

    // Filter by process_label (process_id column does not exist in schema)
    if (processId) query = query.eq('process_label', processId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { processId, processLabel, activityStep, logDate, owner, status, remarks, evidence } = body;

    if (!processId || !processLabel) {
      return NextResponse.json({ error: 'processId and processLabel required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .insert({
        process_label:  processLabel,   // process_id column does not exist in schema
        activity_step:  activityStep || '',
        log_date:       logDate || null,
        owner:          owner || '',
        status:         status || 'Done',
        remarks:        remarks || '',
        evidence:       evidence || '',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save activity log' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('activity_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
