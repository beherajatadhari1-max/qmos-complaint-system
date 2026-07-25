import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'pfd');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  try {
    ensureDir();
    const body = await req.json();
    const ts = Date.now();
    const item = body?.header?.item?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'PFD';
    const file = path.join(DATA_DIR, `${item}_${ts}.json`);
    fs.writeFileSync(file, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true, file: path.basename(file) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    ensureDir();
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const records = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
      } catch { return null; }
    }).filter(Boolean);
    return NextResponse.json(records);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
