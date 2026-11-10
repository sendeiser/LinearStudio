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

url = "https://xftwykrxumzxaqhosbvt.supabase.co/rest/v1/rpc/exec_sql"
data = json.dumps({"query": "SELECT 1"}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
})

try:
    with urllib.request.urlopen(req) as resp:
        print("RPC_EXEC_STATUS:", resp.status)
        print("RESPONSE:", resp.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP_ERROR:", e.code, e.read().decode())
except Exception as e:
    print("ERROR:", e)
