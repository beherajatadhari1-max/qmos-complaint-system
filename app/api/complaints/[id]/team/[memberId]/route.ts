import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const { id, memberId } = await params;

  const { data: member } = await supabaseAdmin
    .from('team_members')
    .select('name, member_name')
    .eq('id', memberId)
    .single();

  const { error } = await supabaseAdmin
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('complaint_id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const memberName = member?.name ?? member?.member_name ?? 'Unknown';
  await supabaseAdmin.from('complaint_timeline').insert({
    complaint_id: id,
    action: `Team member removed: ${memberName}`,
    performed_by: 'User',
  });

  return NextResponse.json({ success: true });
}
