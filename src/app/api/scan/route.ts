import { NextResponse } from 'next/server';

// Email scanning via Python execSync is not available on Vercel's serverless environment.
// This stub returns a clear message — the local discord-bridge scanner still runs on your machine
// and can sync results to Supabase via the POST /api/emails endpoint.
export async function POST() {
  return NextResponse.json({
    success: false,
    message: 'Direct email scanning is only available when running locally. Use the discord-bridge scanner locally and it will sync to Supabase.',
  }, { status: 501 });
}
