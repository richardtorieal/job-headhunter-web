import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TRACKER_PATH = '/Users/richardanderson/projects/discord-bridge/linkedin-applied-jobs.json';

export async function GET() {
  try {
    if (!fs.existsSync(TRACKER_PATH)) {
      return NextResponse.json({ appliedJobs: [], totalApplications: 0 });
    }
    const data = JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf8'));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let data = { appliedJobs: [], totalApplications: 0, lastRunAt: new Date().toISOString() };
    if (fs.existsSync(TRACKER_PATH)) {
      data = JSON.parse(fs.readFileSync(TRACKER_PATH, 'utf8'));
    }

    const newJob = {
      jobId: body.jobId || `job_${Date.now()}`,
      title: body.title,
      company: body.company,
      url: body.url,
      appliedAt: new Date().toISOString(),
      method: body.method || 'Headhunter Web App',
      status: body.status || 'applied',
      salary: body.salary || '$180,000+',
      location: body.location || 'Remote, US',
      notes: body.notes || 'Manually added via Headhunter Dashboard'
    };

    data.appliedJobs.unshift(newJob as never);
    data.totalApplications = data.appliedJobs.length;
    data.lastRunAt = new Date().toISOString();

    fs.writeFileSync(TRACKER_PATH, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true, job: newJob });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
