export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  // Clear the session cookie
  response.cookies.set('qmos_session', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}
