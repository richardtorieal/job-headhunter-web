import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('emails')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const emails = (data || []).map(row => ({
      id:             row.id,
      from:           row.from_address,
      subject:        row.subject,
      date:           row.date,
      classification: row.classification,
      jobTitle:       row.job_title,
      company:        row.company,
      fullBody:       row.full_body,
    }));

    return NextResponse.json({ emails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const emails = Array.isArray(body) ? body : [body];

    const rows = emails.map(e => ({
      id:             e.id,
      from_address:   e.from || e.from_address,
      subject:        e.subject,
      date:           e.date,
      classification: e.classification,
      job_title:      e.jobTitle || e.job_title,
      company:        e.company,
      full_body:      e.fullBody || e.full_body,
    }));

    const { error } = await supabaseAdmin
      .from('emails')
      .upsert(rows, { onConflict: 'id' });

    if (error) throw error;

    return NextResponse.json({ success: true, count: rows.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
