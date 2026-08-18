import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const SETTINGS_ROW_ID = 1;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('id', SETTINGS_ROW_ID)
      .single();

    if (error) throw error;

    // Shape to match original linkedin-apply-config.json contract
    return NextResponse.json({
      fullName:               data.full_name,
      email:                  data.email,
      jobTitles:              data.job_titles || [],
      searchQueries:          data.search_queries || [],
      minSalary:              data.min_salary || 175000,
      resumeTailoringEnabled: data.resume_tailoring_enabled,
      workplaceTypes:         data.workplace_types || [],
      blacklistedKeywords:    data.blacklisted_keywords || [],
      preferredKeywords:      data.preferred_keywords || [],
      defaultAnswers:         data.default_answers || {},
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const updates: Record<string, any> = {};

    if (body.fullName !== undefined)               updates.full_name               = body.fullName;
    if (body.email !== undefined)                  updates.email                   = body.email;
    if (body.jobTitles !== undefined)              updates.job_titles              = body.jobTitles;
    if (body.searchQueries !== undefined)          updates.search_queries          = body.searchQueries;
    if (body.salaryFloor !== undefined)            updates.min_salary              = parseInt(String(body.salaryFloor).replace(/[^0-9]/g, '')) || 175000;
    if (body.minSalary !== undefined)              updates.min_salary              = body.minSalary;
    if (body.resumeTailoringEnabled !== undefined) updates.resume_tailoring_enabled = body.resumeTailoringEnabled;
    if (body.workplaceTypes !== undefined)         updates.workplace_types         = body.workplaceTypes;
    if (body.blacklistedKeywords !== undefined)    updates.blacklisted_keywords    = body.blacklistedKeywords;
    if (body.preferredKeywords !== undefined)      updates.preferred_keywords      = body.preferredKeywords;
    if (body.defaultAnswers !== undefined)         updates.default_answers         = body.defaultAnswers;

    const { data, error } = await supabaseAdmin
      .from('settings')
      .update(updates)
      .eq('id', SETTINGS_ROW_ID)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, config: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
