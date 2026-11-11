"""Ejecuta SQL contra la BD de boxtools via la Management API de Supabase.
El token NUNCA se guarda en disco: se lee de la variable de entorno SBP.
Uso: python tests/db/run_sql.py <archivo.sql>
"""
import json
import os
import sys
import urllib.error
import urllib.request

REF = os.environ.get("SUPABASE_PROJECT_REF", "")


def run(sql: str):
    tok = os.environ["SBP"]
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {tok}",
            "Content-Type": "application/json",
            "User-Agent": "linear-studio/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.status, resp.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()


if __name__ == "__main__":
    status, body = run(open(sys.argv[1], encoding="utf-8").read())
    print(status, body[:1500])

