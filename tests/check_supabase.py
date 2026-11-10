import urllib.request
import json
import os

key = None
if os.path.exists(r"d:\Aeterna\.env"):
    with open(r"d:\Aeterna\.env", "r", encoding="utf-8") as f:
        for line in f:
            if line.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                key = line.strip().split("=", 1)[1].strip("\"'")
                break

if not key:
    print("NO_SERVICE_KEY_FOUND")
    exit(0)

url = "https://xftwykrxumzxaqhosbvt.supabase.co/rest/v1/"
req = urllib.request.Request(url, headers={"apikey": key, "Authorization": f"Bearer {key}"})

try:
    with urllib.request.urlopen(req) as resp:
        print("SUPABASE_REST_STATUS:", resp.status)
        data = json.loads(resp.read().decode())
        print("DEFINITIONS:", list(data.get("definitions", {}).keys()))
except Exception as e:
    print("ERROR:", e)
