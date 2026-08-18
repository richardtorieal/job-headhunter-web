import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .order('applied_at', { ascending: false });

    if (error) throw error;

    // Shape response to match original API contract expected by page.tsx
    const appliedJobs = (data || []).map(row => ({
      jobId:     row.job_id,
      title:     row.title,
      company:   row.company,
      url:       row.url,
      appliedAt: row.applied_at,
      method:    row.method,
      status:    row.status,
      salary:    row.salary,
      minSalary: row.min_salary,
      maxSalary: row.max_salary,
      location:  row.location,
      notes:     row.notes,
      logoUrl:   row.logo_url,
    }));

    return NextResponse.json({
      appliedJobs,
      totalApplications: appliedJobs.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Parse salary numbers out of formatted strings like "$180,000+"
    const parseSalary = (s: string | undefined): number | null => {
      if (!s) return null;
      const n = parseInt(s.replace(/[^0-9]/g, ''));
      return isNaN(n) ? null : n;
    };

    const jobId = body.jobId || `job_${Date.now()}`;

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .upsert({
        job_id:     jobId,
        title:      body.title,
        company:    body.company,
        url:        body.url,
        applied_at: new Date().toISOString(),
        method:     body.method || 'Headhunter Web App',
        status:     body.status || 'applied',
        salary:     body.salary || null,
        min_salary: body.minSalary ? parseSalary(String(body.minSalary)) : parseSalary(body.salary),
        max_salary: body.maxSalary ? parseSalary(String(body.maxSalary)) : null,
        location:   body.location || 'Remote, US',
        notes:      body.notes || 'Manually added via Headhunter Dashboard',
        logo_url:   body.logoUrl || null,
      }, { onConflict: 'job_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, job: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { jobId, ...updates } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    // Map camelCase fields to snake_case columns
    const colMap: Record<string, string> = {
      title: 'title', company: 'company', url: 'url',
      status: 'status', salary: 'salary', minSalary: 'min_salary',
      maxSalary: 'max_salary', location: 'location', notes: 'notes',
      logoUrl: 'logo_url', method: 'method',
    };

    const dbUpdates: Record<string, any> = {};
    for (const [key, val] of Object.entries(updates)) {
      const col = colMap[key];
      if (col) dbUpdates[col] = val;
    }

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update(dbUpdates)
      .eq('job_id', jobId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, job: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'jobId required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('jobs')
      .delete()
      .eq('job_id', jobId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
