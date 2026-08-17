import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST() {
  try {
    const output = execSync('python3 /Users/richardanderson/projects/discord-bridge/email_scanner.py', { encoding: 'utf-8' });
    return NextResponse.json({ success: true, output });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
