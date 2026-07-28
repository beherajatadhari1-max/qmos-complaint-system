import os
os.makedirs('app/api/pfmea', exist_ok=True)
content = """import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // TODO: save to DB (MongoDB/Prisma)
    console.log('PFMEA saved:', JSON.stringify(body).slice(0, 200));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: 'Save failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ records: [] });
}
"""
open('app/api/pfmea/route.ts', 'w', encoding='utf-8').write(content)
print('API route created')
