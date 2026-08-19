import json
import re
import urllib.parse
import os
from supabase_client import update_job_logo

TRACKER_PATH = '/Users/richardanderson/projects/job-headhunter-web/data/linkedin-applied-jobs.json'

# Common domain mapping dictionary for known companies
KNOWN_DOMAINS = {
    'nebius': 'nebius.com',
    'glansa associates': 'glansa.com',
    'zone 5 technologies': 'zone5technologies.com',
    'optimize search group': 'optimizesearchgroup.com',
    'myridius': 'myridius.com',
    'luminous digital visions, llc': 'luminousdigital.com',
    'exovra': 'exovra.com',
    'openet': 'openet.com',
    'tcp software': 'tcpsoftware.com',
    'contractstaffingrecruiters.com': 'contractstaffingrecruiters.com',
    'transcend staffing solutions llc': 'transcendstaffing.com',
    'vbeyond corporation': 'vbeyond.com',
    'hca healthcare': 'hcahealthcare.com',
    'aditi consulting': 'aditiconsulting.com',
    'ssi people': 'ssipeople.com',
    'four tower, llc': 'fourtower.com',
    'gaient': 'gaient.com',
    'heitmeyer consulting': 'heitmeyerconsulting.com',
    'people in ai': 'peoplein.ai',
    'harnham': 'harnham.com',
    'insight global': 'insightglobal.com',
    'glider ai': 'glider.ai',
    'bayforce': 'bayforce.com',
    'dynata': 'dynata.com',
    'luxury presence': 'luxurypresence.com',
    'reqroute, inc': 'reqroute.com',
    'shaiksaddamhussain': 'shaiksaddamhussain.com',
    'trident consulting': 'tridentconsulting.com',
    'themesoft inc.': 'themesoft.com',
    'blackstraw': 'blackstraw.ai',
    'precision technologies': 'precisiontech.com',
    'cybercoders': 'cybercoders.com',
    'carbynex': 'carbynex.com',
    'engine': 'engine.tech',
    'privia health': 'priviahealth.com',
    'talentpluto': 'talentpluto.com',
    'tuck software group': 'tucksoftware.com',
    'lyra health': 'lyrahealth.com',
    'jobgether': 'jobgether.com',
    'activecampaign': 'activecampaign.com',
    'pinnacle talent placement': 'pinnacletalent.com',
    'mitratech': 'mitratech.com',
    'pointclickcare': 'pointclickcare.com',
    'airspace link, inc.': 'airspacelink.com',
    'commerce': 'commerce.com',
    'metrix it solutions inc': 'metrixit.com',
    'franklin fitch': 'franklinfitch.com',
    'oxbow talent': 'oxbowtalent.com',
    'talently': 'talently.tech',
    'ventures unlimited inc': 'venturesunlimited.com',
    'scale ai': 'scale.com',
    'red hat': 'redhat.com'
}

def clean_company_name(name):
    # Strip common suffixes like LLC, Inc, Corp
    clean = re.sub(r',?\s*(llc|inc\.?|corp\.?|corporation|group|consulting|solutions|technologies)\b', '', name, flags=re.IGNORECASE).strip()
    clean_domain = clean.lower().replace(' ', '') + '.com'
    return clean_domain

def backfill_logos():
    with open(TRACKER_PATH, 'r') as f:
        data = json.load(f)

    jobs = data.get('appliedJobs', [])
    updated_count = 0

    for job in jobs:
        comp = job.get('company', '').strip()
        comp_key = comp.lower()

        domain = KNOWN_DOMAINS.get(comp_key)
        if not domain:
            domain = clean_company_name(comp)

        # Clearbit Logo URL with fallback to Google Favicon API
        logo_url = f"https://logo.clearbit.com/{domain}"
        job['companyLogo'] = logo_url
        job['companyDomain'] = domain
        updated_count += 1

    with open(TRACKER_PATH, 'w') as f:
        json.dump(data, f, indent=2)

    print(f"Backfilled logo URLs for {updated_count} jobs in {TRACKER_PATH}")

    # Sync logo updates to Supabase
    print("Syncing logo updates to Supabase...")
    synced = 0
    for job in jobs:
        job_id = job.get('jobId')
        logo_url = job.get('companyLogo')
        domain = job.get('companyDomain')
        if job_id and logo_url:
            update_job_logo(job_id, logo_url, domain)
            synced += 1
    print(f"  [Supabase] ✓ Synced logos for {synced} jobs.")

if __name__ == '__main__':
    backfill_logos()
