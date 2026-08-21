export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('team_members')
    .select('*')
    .eq('complaint_id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const { data: member, error } = await supabaseAdmin
    .from('team_members')
    .insert({
      complaint_id:   id,
      name:           body.member_name,
      member_name:    body.member_name,
      designation:    body.designation || '',
      department:     body.department || '',
      role_in_team:   body.role_in_team || 'Member',
      contact_number: body.contact_number || '',
      email:          body.email || '',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from('complaint_timeline').insert({
    complaint_id: id,
    action:       `Team member added: ${body.member_name} (${body.role_in_team || 'Member'})`,
    performed_by: 'User',
  });

  return NextResponse.json(member, { status: 201 });
}
