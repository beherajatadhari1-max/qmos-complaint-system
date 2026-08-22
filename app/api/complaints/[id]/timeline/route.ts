export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin
    .from('complaint_timeline')
    .select('*')
    .eq('complaint_id', id)
    .order('performed_at', { ascending: false });
  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}
