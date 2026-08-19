"""
supabase_client.py
Shared Supabase client for all discord-bridge Python scripts.
Credentials are read from env vars with hardcoded fallbacks for local use.
"""
import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get(
    'SUPABASE_URL',
    'https://axvysdxijstzpfcvnlbm.supabase.co'
)
SUPABASE_SERVICE_ROLE_KEY = os.environ.get(
    'SUPABASE_SERVICE_ROLE_KEY',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4dnlzZHhpanN0enBmY3ZubGJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzA4Nzg2OSwiZXhwIjoyMTAyNjYzODY5fQ.PULw5Dga6irZMmIv0kyIcTFhy7e3T4EXPUZNKYoJwOI'
)

_client: Client | None = None


def get_client() -> Client:
    """Return a singleton Supabase admin client."""
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _client


# ─── Jobs helpers ────────────────────────────────────────────────────────────

def upsert_job(job: dict) -> None:
    """
    Insert or update a job row in the Supabase `jobs` table.
    Accepts the raw job dict from linkedin-applied-jobs.json.
    """
    try:
        sb = get_client()

        def parse_salary(val):
            if val is None:
                return None
            try:
                return int(str(val).replace(',', '').replace('$', '').strip())
            except (ValueError, TypeError):
                return None

        row = {
            'job_id':          job.get('jobId'),
            'title':           job.get('title', 'Unknown Role'),
            'company':         job.get('company', 'Unknown Company'),
            'url':             job.get('url'),
            'applied_at':      job.get('appliedAt'),
            'method':          job.get('method', 'Headhunter Web App'),
            'status':          job.get('status', 'applied'),
            'salary':          job.get('salary'),
            'min_salary':      job.get('minSalary') or parse_salary(job.get('salary', '').split('-')[0] if job.get('salary') else None),
            'max_salary':      job.get('maxSalary'),
            'location':        job.get('location', 'Remote, US'),
            'notes':           job.get('notes'),
            'logo_url':        job.get('companyLogo') or job.get('logoUrl'),
            'last_email_update': job.get('lastEmailUpdate'),
            'company_domain':  job.get('companyDomain'),
        }

        # Remove None-valued keys so we don't overwrite existing data with nulls on partial updates
        row = {k: v for k, v in row.items() if v is not None}

        sb.table('jobs').upsert(row, on_conflict='job_id').execute()
    except Exception as e:
        print(f"  [Supabase] ⚠️  upsert_job failed for {job.get('jobId')}: {e}")


def update_job_status(job_id: str, status: str, last_email_update: str = None) -> None:
    """Update only the status (and optionally lastEmailUpdate) of a job by job_id."""
    try:
        sb = get_client()
        updates = {'status': status}
        if last_email_update:
            updates['last_email_update'] = last_email_update
        sb.table('jobs').update(updates).eq('job_id', job_id).execute()
    except Exception as e:
        print(f"  [Supabase] ⚠️  update_job_status failed for {job_id}: {e}")


def update_job_logo(job_id: str, logo_url: str, company_domain: str = None) -> None:
    """Update logo_url (and optionally company_domain) for a job."""
    try:
        sb = get_client()
        updates = {'logo_url': logo_url}
        if company_domain:
            updates['company_domain'] = company_domain
        sb.table('jobs').update(updates).eq('job_id', job_id).execute()
    except Exception as e:
        print(f"  [Supabase] ⚠️  update_job_logo failed for {job_id}: {e}")


# ─── Emails helpers ───────────────────────────────────────────────────────────

def upsert_emails(email_list: list) -> None:
    """
    Upsert a list of email dicts into the Supabase `emails` table.
    Accepts the raw email dicts from email_scanner.py output.
    """
    if not email_list:
        return
    try:
        sb = get_client()
        rows = []
        for e in email_list:
            rows.append({
                'id':             e.get('id'),
                'from_address':   e.get('sender') or e.get('from') or e.get('from_address'),
                'subject':        e.get('subject'),
                'date':           e.get('date'),
                'classification': e.get('type') or e.get('classification'),
                'job_title':      e.get('jobTitle') or e.get('job_title'),
                'company':        e.get('company'),
                'full_body':      e.get('fullBody') or e.get('full_body'),
            })
        # Filter out rows missing an id
        rows = [r for r in rows if r.get('id')]
        if rows:
            sb.table('emails').upsert(rows, on_conflict='id').execute()
            print(f"  [Supabase] ✓ Synced {len(rows)} email(s) to Supabase.")
    except Exception as e:
        print(f"  [Supabase] ⚠️  upsert_emails failed: {e}")
