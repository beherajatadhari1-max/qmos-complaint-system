import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
export async function GET() {
  // Port 5000 = DEV environment, Port 3000 = MAIN
  const port = process.env.PORT ?? '3000';
  if (port === '5000') {
    return NextResponse.json({ branch: 'dev' });
  }
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ branch: 'main' });
  }
  // npm run dev — show actual git branch
  try {
    const branch = execSync('git branch --show-current', { cwd: process.cwd() }).toString().trim();
    return NextResponse.json({ branch });
  } catch {
    return NextResponse.json({ branch: 'dev' });
  }
}
