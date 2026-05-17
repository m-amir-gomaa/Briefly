#!/bin/bash
# Update Gemini API key on VM and save .env backup
# Run from local machine with sshpass available

KEY="AIzaSyAozVBNzeYv3GCevM-eWRh5UobLG1aGba4"
VM_ENV="/opt/briefly/.env"

ssh -o StrictHostKeyChecking=no -p 2223 briefly@localhost << SSHEOF
python3 - << 'PYEOF'
import re

env_path = "/opt/briefly/.env"
with open(env_path, "r") as f:
    content = f.read()

key = "AIzaSyAozVBNzeYv3GCevM-eWRh5UobLG1aGba4"

# Update GOOGLE_API_KEY
if re.search(r'^GOOGLE_API_KEY=', content, re.MULTILINE):
    content = re.sub(r'^GOOGLE_API_KEY=.*', f'GOOGLE_API_KEY={key}', content, flags=re.MULTILINE)
else:
    content += f'\nGOOGLE_API_KEY={key}\n'

# Update or add DEMO_GOOGLE_API_KEY  
if re.search(r'^DEMO_GOOGLE_API_KEY=', content, re.MULTILINE):
    content = re.sub(r'^DEMO_GOOGLE_API_KEY=.*', f'DEMO_GOOGLE_API_KEY={key}', content, flags=re.MULTILINE)
else:
    content += f'DEMO_GOOGLE_API_KEY={key}\n'

with open(env_path, "w") as f:
    f.write(content)

print("Updated .env successfully")
PYEOF
SSHEOF
