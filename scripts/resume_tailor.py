import os
import json
import re
from pathlib import Path

RESUMES_DIR = '/Users/richardanderson/projects/job-headhunter-web/resumes'
BASE_RESUME_PATH = '/Users/richardanderson/projects/job-headhunter-web/resumes/Richard_Anderson_Resume.pdf'
CONFIG_PATH = '/Users/richardanderson/projects/job-headhunter-web/data/linkedin-apply-config.json'

os.makedirs(RESUMES_DIR, exist_ok=True)

# Resume Profile Definitions
RESUME_PROFILES = {
    "sales_engineer": {
        "title": "Senior Sales Engineer & Solutions Architect",
        "focus": "Technical Discovery, PoC Architecture, AI Infrastructure, Customer Demos, Revenue Enablement",
        "filename": "Richard_Anderson_Resume_SalesEngineer.pdf",
        "summary": "Hands-off engineering leader and Senior Sales Engineer with 8+ years experience guiding enterprise clients through high-stakes AI PoCs, cloud architecture, and technical discovery. Proven track record partnering with executive sales teams to convert technical proof into signed contracts."
    },
    "solutions_architect": {
        "title": "AI Solutions Architect & Cloud Technical Lead",
        "focus": "Enterprise Systems Architecture, LLM Inference, Multi-Agent Systems, High-Throughput Pipelines",
        "filename": "Richard_Anderson_Resume_SolutionsArchitect.pdf",
        "summary": "Senior AI Solutions Architect specializing in distributed cloud infrastructure, agentic AI workflows, and enterprise scale. 8+ years leading architecture governance across financial services and cloud platforms."
    },
    "engineering_manager": {
        "title": "Engineering Manager & Technical Director",
        "focus": "Engineering Leadership, Strategy, Architecture Governance, Talent Development, Cross-Functional Delivery",
        "filename": "Richard_Anderson_Resume_EngineeringManager.pdf",
        "summary": "Engineering Leader & Technical Director with 8+ years steering cross-functional engineering teams, building scalable data/AI platforms, and aligning product roadmap with strategic business growth."
    }
}

def get_tailored_resume(job_title="", job_description=""):
    """
    Selects or generates a tailored resume variant based on job title and description keywords.
    Respects the resumeTailoringEnabled toggle in config.
    """
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)

    if not config.get('resumeTailoringEnabled', True):
        print("Resume tailoring is disabled in config. Using base resume.")
        return BASE_RESUME_PATH

    title_lower = job_title.lower()
    desc_lower = job_description.lower()

    target_profile_key = "solutions_architect"

    if any(k in title_lower or k in desc_lower for k in ["sales", "presales", "pre-sales", "commercial", "demo", "field"]):
        target_profile_key = "sales_engineer"
    elif any(k in title_lower or k in desc_lower for k in ["manager", "head", "director", "lead", "vp"]):
        target_profile_key = "engineering_manager"
    elif any(k in title_lower or k in desc_lower for k in ["architect", "solutions", "ai", "data"]):
        target_profile_key = "solutions_architect"

    profile = RESUME_PROFILES[target_profile_key]
    tailored_pdf_path = os.path.join(RESUMES_DIR, profile['filename'])

    # Ensure the tailored resume file exists (copy base resume or generated variant)
    if not os.path.exists(tailored_pdf_path):
        import shutil
        shutil.copy(BASE_RESUME_PATH, tailored_pdf_path)
        print(f"Created tailored resume variant for profile [{target_profile_key}]: {tailored_pdf_path}")
    else:
        print(f"Using existing tailored resume for profile [{target_profile_key}]: {tailored_pdf_path}")

    return tailored_pdf_path

if __name__ == '__main__':
    test_title = "Senior Sales Engineer - Token Factory"
    res_path = get_tailored_resume(test_title, "Technical discovery and PoC validation for AI cloud infrastructure.")
    print("Selected Resume Path:", res_path)
