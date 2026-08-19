import imaplib
import email
from email.header import decode_header
import re
import json
import os
import requests
from supabase_client import upsert_emails, update_job_status

CONFIG_PATH = '/Users/richardanderson/projects/job-headhunter-web/data/linkedin-apply-config.json'
TRACKER_PATH = '/Users/richardanderson/projects/job-headhunter-web/data/linkedin-applied-jobs.json'
DISCORD_WEBHOOK_URL = os.environ.get('DISCORD_WEBHOOK_URL', '')
DISCORD_CHANNEL_ID = '1484082460668203102'

def scan_emails_and_update_status():
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)

    with open(TRACKER_PATH, 'r') as f:
        tracker = json.load(f)

    email_user = config['defaultAnswers'].get('email', 'Richard.torieal@gmail.com')
    app_password = os.environ.get('GMAIL_APP_PASSWORD', 'fwxjbtfchrzaceck')

    try:
        mail = imaplib.IMAP4_SSL('imap.gmail.com', 993)
        mail.login(email_user, app_password)
        mail.select('inbox')

        # Try inbox first, then fallback to [Gmail]/All Mail
        status, messages = mail.search(None, 'RECENT')
        if not messages[0]:
            status, messages = mail.search(None, 'ALL')

        mail_ids = messages[0].split()[-50:] # Scan last 50 emails
        print(f"Scanning {len(mail_ids)} recent emails for job updates...")

        updates = []
        interview_invites = []
        recruiter_outreach = []

        for mid in mail_ids:
            res, data = mail.fetch(mid, '(RFC822)')
            for response_part in data:
                if not isinstance(response_part, tuple):
                    continue
                msg = email.message_from_bytes(response_part[1])
                subject, encoding = decode_header(msg['Subject'])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding or 'utf-8', errors='ignore')

                sender = msg.get('From', '')
                date_str = msg.get('Date', '')

                body = ''
                if msg.is_multipart():
                    for part in msg.walk():
                        if part.get_content_type() in ['text/plain', 'text/html']:
                            body += part.get_payload(decode=True).decode('utf-8', errors='ignore') + '\n'
                else:
                    body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')

                sender_lower = sender.lower()
                body_lower = body.lower()
                subj_lower = subject.lower()

                # Strict Blacklist: Skip non-career / travel / commercial / promo emails
                if any(k in sender_lower or k in subj_lower for k in [
                    'viator', 'tripadvisor', 'booking.com', 'expedia', 'airbnb', 'uber', 'lyft',
                    'doordash', 'grubhub', 'promotional', 'newsletter', 'discount', 'receipt for your order',
                    'flight confirmation', 'tour'
                ]):
                    continue
                is_confirmation = any(k in subj_lower or k in body_lower for k in [
                    'thank you for applying', 'application received', 'we received your application',
                    'thanks for your interest', 'received your application', 'application has been received',
                    'your application for', 'application submitted'
                ])

                is_rejection = any(k in subj_lower or k in body_lower for k in [
                    'not moving forward', 'regret to inform', 'decided to pursue other candidates',
                    'position has been filled', 'unfortunate news', 'unable to offer'
                ])

                is_interview = any(k in subj_lower or k in body_lower for k in [
                    'schedule a call', 'invitation to interview', 'phone screen', 'technical chat',
                    'like to invite you', 'available for an interview', 'schedule an interview',
                    'interview with our hiring manager'
                ]) and not is_confirmation and not is_rejection

                is_linkedin_msg = any(k in subj_lower or k in body_lower or k in sender_lower for k in [
                    'linkedin message', 'sent you a message on linkedin', 'inmail', 'opportunity',
                    'direct message', 'ai/ml engineer', 'solutions architect opportunity'
                ]) and 'linkedin' in (sender_lower + subj_lower + body_lower) and not is_confirmation and not is_rejection

                is_app_viewed = any(k in subj_lower or k in body_lower for k in [
                    'application was viewed', 'application reviewed', 'hiring manager viewed',
                    'resume was viewed', 'candidate profile viewed', 'candidate viewed'
                ]) or ('viewed your application' in body_lower or 'viewed your application' in subj_lower)

                # Match with applied jobs in tracker
                matched_job = None
                for job in tracker.get('appliedJobs', []):
                    comp = job.get('company', '').lower()
                    title = job.get('title', '').lower()
                    if comp and (comp in subj_lower or comp in body_lower or comp in sender_lower):
                        matched_job = job
                        break

                if is_interview:
                    item = {
                        'id': f"msg_{mid.decode()}",
                        'type': 'INTERVIEW_INVITE',
                        'subject': subject,
                        'sender': sender,
                        'date': date_str,
                        'jobTitle': matched_job.get('title', 'Senior Technical Role') if matched_job else 'Target Position',
                        'company': matched_job.get('company', sender) if matched_job else sender,
                        'fullBody': body,
                        'matchedJob': matched_job
                    }
                    interview_invites.append(item)
                    if matched_job:
                        matched_job['status'] = 'interview_scheduled'
                        matched_job['lastEmailUpdate'] = date_str
                elif is_rejection:
                    if matched_job and matched_job.get('status') != 'rejected':
                        matched_job['status'] = 'rejected'
                        matched_job['lastEmailUpdate'] = date_str
                        updates.append(f"Updated {matched_job['company']} -> rejected (silent)")
                elif is_app_viewed:
                    item = {
                        'id': f"msg_{mid.decode()}",
                        'type': 'APPLICATION_VIEWED',
                        'subject': subject,
                        'sender': sender,
                        'date': date_str,
                        'jobTitle': matched_job.get('title', 'Target Role') if matched_job else 'Target Position',
                        'company': matched_job.get('company', sender) if matched_job else sender,
                        'fullBody': body,
                        'matchedJob': matched_job
                    }
                    recruiter_outreach.append(item)
                    if matched_job:
                        matched_job['status'] = 'under_review'
                        matched_job['lastEmailUpdate'] = date_str
                        updates.append(f"Updated {matched_job['company']} -> under_review (viewed)")
                elif is_linkedin_msg:
                    item = {
                        'id': f"msg_{mid.decode()}",
                        'type': 'LINKEDIN_MESSAGE',
                        'subject': subject,
                        'sender': sender,
                        'date': date_str,
                        'jobTitle': matched_job.get('title', 'AI/ML Technical Role') if matched_job else 'AI/ML Engineer',
                        'company': matched_job.get('company', sender) if matched_job else sender,
                        'fullBody': body,
                        'matchedJob': matched_job
                    }
                    recruiter_outreach.append(item)
                    if matched_job:
                        matched_job['status'] = 'recruiter_contact'
                        matched_job['lastEmailUpdate'] = date_str
                        updates.append(f"Updated {matched_job['company']} -> recruiter_contact")
                elif is_confirmation:
                    item = {
                        'id': f"msg_{mid.decode()}",
                        'type': 'CONFIRMATION',
                        'subject': subject,
                        'sender': sender,
                        'date': date_str,
                        'jobTitle': matched_job.get('title', 'Target Role') if matched_job else 'Target Position',
                        'company': matched_job.get('company', sender) if matched_job else sender,
                        'fullBody': body,
                        'matchedJob': matched_job
                    }
                    recruiter_outreach.append(item)
                    if matched_job:
                        matched_job['status'] = 'confirmed'
                        matched_job['lastEmailUpdate'] = date_str
                        updates.append(f"Updated {matched_job['company']} -> confirmed (receipt confirmed)")

        mail.logout()

        all_emails = interview_invites + recruiter_outreach

        # Save email cache for UI subpage/modal (local fallback)
        with open('/Users/richardanderson/projects/job-headhunter-web/data/emails_cache.json', 'w') as f:
            json.dump({'emails': all_emails}, f, indent=2)

        # Sync emails to Supabase
        print("Syncing emails to Supabase...")
        upsert_emails(all_emails)

        # Save updated tracker (local fallback)
        tracker['lastRunAt'] = os.popen('date -u +"%Y-%m-%dT%H:%M:%SZ"').read().strip()
        with open(TRACKER_PATH, 'w') as f:
            json.dump(tracker, f, indent=2)

        # Sync job status updates to Supabase
        print("Syncing job status updates to Supabase...")
        for job in tracker.get('appliedJobs', []):
            if job.get('lastEmailUpdate'):
                update_job_status(
                    job_id=job.get('jobId'),
                    status=job.get('status', 'applied'),
                    last_email_update=job.get('lastEmailUpdate')
                )

        print(f"Email scan finished. Interviews: {len(interview_invites)}, Updates: {len(updates)}")
        return {
            'interview_invites': interview_invites,
            'updates': updates
        }

    except Exception as e:
        print(f"Error scanning emails: {e}")
        return {'error': str(e)}

if __name__ == '__main__':
    res = scan_emails_and_update_status()
    print("Scan Result:", json.dumps(res, indent=2))
