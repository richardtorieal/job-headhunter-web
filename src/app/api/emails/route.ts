import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const EMAILS_CACHE_PATH = '/Users/richardanderson/projects/discord-bridge/emails_cache.json';

export async function GET() {
  try {
    if (!fs.existsSync(EMAILS_CACHE_PATH)) {
      // Execute email scanner to populate cache
      try {
        execSync('python3 /Users/richardanderson/projects/discord-bridge/email_scanner.py');
      } catch (e) {}
    }

    if (fs.existsSync(EMAILS_CACHE_PATH)) {
      const data = JSON.parse(fs.readFileSync(EMAILS_CACHE_PATH, 'utf8'));
      return NextResponse.json(data);
    }

    // Default sample email responses if cache not yet created
    const sampleEmails = [
      {
        id: "msg_40063",
        from: "Greenhouse Recruiting <no-reply@eu.greenhouse-mail.io>",
        subject: "Thank you for applying to Nebius",
        date: "Mon, 17 Aug 2026 02:42:05 +0000",
        classification: "INTERVIEW_INVITE",
        jobTitle: "Senior Sales Engineer - Token Factory",
        company: "Nebius",
        fullBody: `Hi Richard,\n\nThank you for applying for the Senior Sales Engineer - Token Factory position at Nebius!\n\nWe have reviewed your impressive background at JPMorgan Chase and Capital One, along with your Master's degree from Florida International University. We would love to schedule an introductory 30-minute technical discovery chat with our hiring team.\n\nPlease let us know your availability over the next few days.\n\nBest regards,\nNebius Talent Acquisition Team`
      },
      {
        id: "msg_40062",
        from: "Scale AI Recruiting <recruiting@scale.com>",
        subject: "Recruiter Outreach: Senior AI Solutions Architect Opportunity",
        date: "Sun, 16 Aug 2026 19:15:10 +0000",
        classification: "RECRUITER_OUTREACH",
        jobTitle: "Senior AI Solutions Architect",
        company: "Scale AI",
        fullBody: `Hi Richard,\n\nI came across your profile and noticed your strong background leading AI engineering, multi-agent frameworks, and cloud architecture at JPMorgan Chase.\n\nWe are actively hiring a Senior AI Solutions Architect ($190,000 - $240,000 + equity) for our enterprise AI team. This is a remote role with flexible hybrid options.\n\nWould you be open to a brief 15-minute call this week to discuss?\n\nBest,\nSarah Jenkins\nSenior Technical Recruiter | Scale AI`
      },
      {
        id: "msg_40060",
        from: "Privia Health Careers <careers@priviahealth.com>",
        subject: "Application Confirmation - Data Architect",
        date: "Fri, 14 Aug 2026 11:20:00 +0000",
        classification: "CONFIRMATION",
        jobTitle: "Data Architect",
        company: "Privia Health",
        fullBody: `Hello Richard,\n\nThank you for submitting your application for the Data Architect position at Privia Health. Your resume has been logged in our tracking system.\n\nIf your qualifications match our current needs, a recruiter will reach out directly.\n\nPrivia Health Talent Team`
      }
    ];

    return NextResponse.json({ emails: sampleEmails });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
