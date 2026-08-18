-- Add columns used by Python scripts that weren't in the initial schema
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_email_update TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_domain    TEXT;
