import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
export async function GET() {
  // In production (npm start), always show MAIN
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ branch: 'main' });
  }
  // In dev (npm run dev), show actual git branch
  try {
    const branch = execSync('git branch --show-current', { cwd: process.cwd() }).toString().trim();
    return NextResponse.json({ branch });
  } catch {
    return NextResponse.json({ branch: 'dev' });
  }
}
