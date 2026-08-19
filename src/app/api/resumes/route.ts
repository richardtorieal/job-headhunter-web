import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const RESUMES_DIR = '/Users/richardanderson/projects/job-headhunter-web/resumes';
const BASE_RESUME = '/Users/richardanderson/projects/job-headhunter-web/resumes/Richard_Anderson_Resume.pdf';

export async function GET() {
  try {
    const list = [
      {
        name: "Base Resume (M.S. FIU / Senior Lead)",
        filename: "Richard_Anderson_Resume.pdf",
        path: BASE_RESUME,
        type: "base"
      }
    ];

    if (fs.existsSync(RESUMES_DIR)) {
      const files = fs.readdirSync(RESUMES_DIR);
      files.forEach(file => {
        if (file.endsWith('.pdf')) {
          list.push({
            name: file.replace('Richard_Anderson_Resume_', '').replace('.pdf', '') + ' Tailored Variant',
            filename: file,
            path: path.join(RESUMES_DIR, file),
            type: "tailored"
          });
        }
      });
    }

    return NextResponse.json({ resumes: list });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
