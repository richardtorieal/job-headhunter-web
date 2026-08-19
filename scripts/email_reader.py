import imaplib
import email
from email.header import decode_header
import re
import json
import os

CONFIG_PATH = '/Users/richardanderson/projects/job-headhunter-web/data/linkedin-apply-config.json'

def get_latest_verification_code(email_user, app_password):
    """
    Connects to Gmail via IMAP SSL and retrieves the latest 8-character verification code from Greenhouse / Lever / Job Boards.
    """
    try:
        mail = imaplib.IMAP4_SSL('imap.gmail.com', 993)
        mail.login(email_user, app_password)
        mail.select('inbox')

        # Search for recent emails from Greenhouse or subject containing security / verification code
        status, messages = mail.search(None, '(UNSEEN SUBJECT "code")')
        if not messages[0]:
            status, messages = mail.search(None, '(SUBJECT "security code")')
        if not messages[0]:
            status, messages = mail.search(None, '(SUBJECT "Greenhouse")')
        if not messages[0]:
            status, messages = mail.search(None, 'ALL')

        mail_ids = messages[0].split()
        if not mail_ids:
            mail.logout()
            return None

        # Fetch latest email
        latest_id = mail_ids[-1]
        res, data = mail.fetch(latest_id, '(RFC822)')
        
        for response_part in data:
            if isinstance(response_part, tuple):
                msg = email.message_from_bytes(response_part[1])
                subject, encoding = decode_header(msg["Subject"])[0]
                if isinstance(subject, bytes):
                    subject = subject.decode(encoding or 'utf-8')
                
                body = ""
                if msg.is_multipart():
                    for part in msg.walk():
                        content_type = part.get_content_type()
                        if content_type == "text/plain":
                            body = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                            break
                else:
                    body = msg.get_payload(decode=True).decode('utf-8', errors='ignore')

                # Extract 8-character verification code (alphanumeric or hex)
                codes = re.findall(r'\b[A-Za-z0-9]{8}\b', body)
                mail.logout()
                return {
                    'subject': subject,
                    'codes': codes,
                    'latestCode': codes[0] if codes else None
                }

        mail.logout()
        return None
    except Exception as e:
        print(f"Error checking email: {e}")
        return None

if __name__ == '__main__':
    with open(CONFIG_PATH, 'r') as f:
        config = json.load(f)
    
    email_user = config['defaultAnswers'].get('email', 'Richard.torieal@gmail.com')
    app_password = os.environ.get('GMAIL_APP_PASSWORD')
    
    if app_password:
        result = get_latest_verification_code(email_user, app_password)
        print("IMAP Check Result:", json.dumps(result, indent=2))
    else:
        print("GMAIL_APP_PASSWORD environment variable not set.")
