import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// ── GET — equipment detail + calibration history ──────────────────────────────
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [{ data: equip, error: eErr }, { data: history, error: hErr }] = await Promise.all([
      supabaseAdmin.from('calibration_equipment').select('*').eq('id', id).single(),
      supabaseAdmin.from('calibration_records')
        .select('*').eq('equipment_id', id)
        .order('calibrated_on', { ascending: false }),
    ]);

    if (eErr) throw eErr;
    if (hErr) throw hErr;

    return NextResponse.json({ equipment: equip, history: history ?? [] });
  } catch (err) {
    console.error('[calibration/:id GET]', err);
    return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 });
  }
}

// ── PATCH — record a new calibration ─────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      calibrated_on, next_due, calibrated_by, calibration_source,
      certificate_number, result, remarks, created_by,
      frequency_months,
    } = body;

    if (!calibrated_on || !next_due) {
      return NextResponse.json({ error: 'calibrated_on and next_due are required' }, { status: 400 });
    }

    // Insert history record
    const { error: hErr } = await supabaseAdmin.from('calibration_records').insert({
      equipment_id: id,
      calibrated_on, next_due, calibrated_by, calibration_source,
      certificate_number,
      result: result || 'Pass',
      remarks, created_by,
    });
    if (hErr) throw hErr;

    // Update equipment
    const updatePayload: Record<string, unknown> = {
      last_calibrated: calibrated_on,
      next_due,
      calibrated_by,
      calibration_source,
      certificate_number,
      calibration_status: 'Calibrated',
      updated_at: new Date().toISOString(),
    };
    if (frequency_months) updatePayload.frequency_months = frequency_months;

    const { data, error: uErr } = await supabaseAdmin
      .from('calibration_equipment')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (uErr) throw uErr;

    return NextResponse.json({ equipment: data });
  } catch (err) {
    console.error('[calibration/:id PATCH]', err);
    return NextResponse.json({ error: 'Failed to update calibration' }, { status: 500 });
  }
}
