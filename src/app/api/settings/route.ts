import { NextResponse } from 'next/server';
import fs from 'fs';

const CONFIG_PATH = '/Users/richardanderson/projects/discord-bridge/linkedin-apply-config.json';

export async function GET() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return NextResponse.json({});
    }
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let config: any = {};
    if (fs.existsSync(CONFIG_PATH)) {
      config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }

    if (body.jobTitles) config.jobTitles = body.jobTitles;
    if (body.searchQueries) config.searchQueries = body.searchQueries;
    if (body.salaryFloor) config.minSalary = parseInt(body.salaryFloor.replace(/[^0-9]/g, '')) || 175000;
    if (body.resumeTailoringEnabled !== undefined) config.resumeTailoringEnabled = body.resumeTailoringEnabled;
    
    if (body.defaultAnswers) {
      config.defaultAnswers = { ...config.defaultAnswers, ...body.defaultAnswers };
    }

    if (body.workplaceTypes) config.workplaceTypes = body.workplaceTypes;
    if (body.blacklistedKeywords) config.blacklistedKeywords = body.blacklistedKeywords;
    if (body.preferredKeywords) config.preferredKeywords = body.preferredKeywords;

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));

    return NextResponse.json({ success: true, config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
