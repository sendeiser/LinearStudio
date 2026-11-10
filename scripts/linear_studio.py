#!/usr/bin/env python3
"""
Linear Studio CLI & Antigravity Agent Bridge
Permite listar proyectos, crear issues, actualizar estados (en progreso, completado)
y escanear TODOs para que el usuario los envíe a cualquier proyecto de Linear Studio.
"""

import os
import sys
import json
import re
import argparse
import urllib.request
import urllib.error
from pathlib import Path

# Paths y configuración
WORKSPACE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = WORKSPACE_DIR / ".env.local"
LOCAL_CACHE_FILE = WORKSPACE_DIR / "src" / "data" / "linear_studio_cache.json"

def load_env():
    env = {}
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    return env

ENV = load_env()
SUPABASE_URL = ENV.get("VITE_SUPABASE_URL", "https://ydoviusjpgmjsxpspexu.supabase.co")
SERVICE_KEY = ENV.get("SUPABASE_SERVICE_ROLE_KEY", "")
ANON_KEY = ENV.get("VITE_SUPABASE_ANON_KEY", "")
API_KEY = SERVICE_KEY if SERVICE_KEY else ANON_KEY

HEADERS = {
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

def supabase_request(endpoint, method="GET", data=None):
    if not API_KEY:
        return None
    if endpoint.startswith("/auth/") or endpoint.startswith("auth/"):
        ep = endpoint.lstrip("/")
        url = f"{SUPABASE_URL}/{ep}"
    else:
        url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    payload = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=payload, headers=HEADERS, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        print(f"[Supabase Error {e.code}]: {err_msg}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"[Network Error]: {e}", file=sys.stderr)
        return None

def ensure_workspace_and_projects():
    """Asegura que exista el workspace base y los proyectos vinculados."""
    workspaces = supabase_request("ls_workspaces?select=*")
    if workspaces is None:
        return []
    
    ws_id = None
    if not workspaces:
        # Obtener un owner_id válido de auth.users
        owner_id = None
        users_resp = supabase_request("auth/v1/admin/users")
        if users_resp and "users" in users_resp and len(users_resp["users"]) > 0:
            owner_id = users_resp["users"][0]["id"]

        if not owner_id:
            # Fallback direct SQL query o UUID si no hay admin users
            return []

        # Crear workspace por defecto
        new_ws = supabase_request("ls_workspaces", method="POST", data={
            "name": "HyperFlow Dev Team",
            "slug": "hyperflow-team",
            "owner_id": owner_id
        })
        if new_ws and len(new_ws) > 0:
            ws_id = new_ws[0]["id"]
            # Añadir owner como miembro
            supabase_request("ls_workspace_members", method="POST", data={
                "workspace_id": ws_id,
                "user_id": owner_id,
                "role": "owner"
            })
    else:
        ws_id = workspaces[0]["id"]

    if not ws_id:
        return []

    # Verificar repositorios vinculados
    repos = supabase_request(f"ls_linked_repositories?workspace_id=eq.{ws_id}&select=*")
    if repos is not None and len(repos) == 0:
        default_repos = [
            {"workspace_id": ws_id, "github_repo_id": 101, "full_name": "tincho/hyper-flow", "default_branch": "main"},
            {"workspace_id": ws_id, "github_repo_id": 102, "full_name": "boxtools", "default_branch": "main"},
            {"workspace_id": ws_id, "github_repo_id": 103, "full_name": "tincho/linear-studio-github", "default_branch": "main"}
        ]
        for r in default_repos:
            supabase_request("ls_linked_repositories", method="POST", data=r)
        repos = supabase_request(f"ls_linked_repositories?workspace_id=eq.{ws_id}&select=*")

    return repos or []

def get_projects():
    repos = ensure_workspace_and_projects()
    if repos:
        return repos
    # Fallback local
    return [
        {"id": "local-repo-1", "full_name": "tincho/hyper-flow", "default_branch": "main"},
        {"id": "local-repo-2", "full_name": "boxtools", "default_branch": "main"},
        {"id": "local-repo-3", "full_name": "tincho/linear-studio-github", "default_branch": "main"}
    ]

def cmd_list_projects(args):
    projects = get_projects()
    print("\n📦 PROYECTOS / REPOSITORIOS DISPONIBLES EN LINEAR STUDIO:")
    print("=" * 65)
    for p in projects:
        print(f"  • {p['full_name']:<30} [Branch: {p.get('default_branch', 'main')}] (ID: {p.get('id')})")
    print("=" * 65)
    print(f"Total: {len(projects)} proyectos federados.\n")

def cmd_list_issues(args):
    projects = get_projects()
    repo_map = {p["id"]: p["full_name"] for p in projects}
    name_to_id = {p["full_name"].lower(): p["id"] for p in projects}

    query = "ls_issues?select=id,number,title,status,priority,repository_id,tags,assignee_name&order=number.desc"
    if args.project:
        p_name = args.project.lower()
        matched_id = None
        for name, pid in name_to_id.items():
            if p_name in name:
                matched_id = pid
                break
        if matched_id:
            query += f"&repository_id=eq.{matched_id}"
        else:
            print(f"Aviso: Proyecto '{args.project}' no encontrado exactamente. Mostrando todos.")

    if args.status:
        query += f"&status=eq.{args.status}"

    issues = supabase_request(query)
    print(f"\n📋 ISSUES EN LINEAR STUDIO (Filtro proyecto: {args.project or 'Todos'}, status: {args.status or 'Todos'}):")
    print("-" * 80)
    print(f"{'#ID':<6} {'STATUS':<14} {'PRIORIDAD':<10} {'PROYECTO':<20} {'TÍTULO'}")
    print("-" * 80)
    if issues:
        for i in issues:
            proj = repo_map.get(i.get("repository_id"), "local")
            status_symbol = {
                "done": "✓ DONE",
                "in_progress": "▶ IN_PROGRESS",
                "in_review": "👁 IN_REVIEW",
                "todo": "○ TODO",
                "backlog": "· BACKLOG"
            }.get(i.get("status"), i.get("status"))
            print(f"#{i.get('number'):<5} {status_symbol:<14} {i.get('priority', 'medium').upper():<10} {proj:<20} {i.get('title')[:35]}")
        print("-" * 80)
        print(f"Total issues listados: {len(issues)}\n")
    else:
        print("No se encontraron issues con los filtros seleccionados.\n")

def cmd_create_issue(args):
    projects = get_projects()
    name_to_p = {p["full_name"].lower(): p for p in projects}

    matched_p = None
    target = args.project.lower()
    for name, p in name_to_p.items():
        if target in name:
            matched_p = p
            break

    if not matched_p:
        print(f"Error: Proyecto '{args.project}' no encontrado en Linear Studio.")
        print("Usa 'python scripts/linear_studio.py list-projects' para ver los proyectos válidos.")
        sys.exit(1)

    repo_id = matched_p["id"]
    # Calcular siguiente issue number
    existing = supabase_request(f"ls_issues?repository_id=eq.{repo_id}&select=number&order=number.desc&limit=1")
    next_number = 1
    if existing and len(existing) > 0:
        next_number = (existing[0].get("number") or 0) + 1
    else:
        # Base de inicio
        next_number = 150

    tags_list = [t.strip() for t in args.tags.split(",") if t.strip()] if args.tags else ["antigravity"]

    new_issue = {
        "repository_id": repo_id,
        "number": next_number,
        "title": args.title,
        "description": args.desc or f"Issue creado para el proyecto {matched_p['full_name']}.",
        "status": args.status or "todo",
        "priority": args.priority or "medium",
        "tags": tags_list,
        "assignee_name": args.assignee or "Antigravity AI",
        "assignee_role": "AI Engineer"
    }

    res = supabase_request("ls_issues", method="POST", data=new_issue)
    if res:
        print(f"\n✓ ¡Issue #{next_number} creado con éxito en Linear Studio!")
        print(f"  • Proyecto:  {matched_p['full_name']}")
        print(f"  • Título:    {args.title}")
        print(f"  • Estado:    {new_issue['status']}")
        print(f"  • Prioridad: {new_issue['priority']}")
        print(f"  • Tags:      {', '.join(tags_list)}\n")
    else:
        print("Error al crear el issue en Supabase Cloud.", file=sys.stderr)
        sys.exit(1)

def cmd_update_status(args):
    valid_statuses = ["backlog", "todo", "in_progress", "in_review", "done"]
    status_lower = args.status.lower()
    if status_lower not in valid_statuses:
        print(f"Error: Estado inválido '{args.status}'. Válidos: {', '.join(valid_statuses)}")
        sys.exit(1)

    projects = get_projects()
    name_to_id = {p["full_name"].lower(): p["id"] for p in projects}
    repo_map = {p["id"]: p["full_name"] for p in projects}

    matched_repo_id = None
    if getattr(args, 'project', None):
        p_target = args.project.lower()
        for name, pid in name_to_id.items():
            if p_target in name:
                matched_repo_id = pid
                break

    query = f"ls_issues?number=eq.{args.id}&select=id,number,title,status,repository_id"
    if matched_repo_id:
        query += f"&repository_id=eq.{matched_repo_id}"

    issues = supabase_request(query)
    if not issues:
        # Intentar por uuid id
        issues = supabase_request(f"ls_issues?id=eq.{args.id}&select=id,number,title,status,repository_id")

    if not issues:
        p_info = f" en el proyecto '{args.project}'" if getattr(args, 'project', None) else ""
        print(f"Error: No se encontró ningún issue con identificador #{args.id}{p_info}.")
        sys.exit(1)

    target_issue = issues[0]
    res = supabase_request(
        f"ls_issues?id=eq.{target_issue['id']}", 
        method="PATCH", 
        data={"status": status_lower}
    )

    proj_name = repo_map.get(target_issue.get("repository_id"), "General")
    status_name = {
        "in_progress": "EN PROCESO (in_progress) ▶",
        "done": "COMPLETADO (done) ✓",
        "in_review": "EN REVISIÓN (in_review) 👁",
        "todo": "POR HACER (todo) ○",
        "backlog": "BACKLOG ·"
    }.get(status_lower, status_lower)

    print(f"\n✓ Estado del Issue #{target_issue['number']} actualizado:")
    print(f"  • Proyecto:     {proj_name}")
    print(f"  • Título:       {target_issue['title']}")
    print(f"  • Nuevo Estado: {status_name}\n")

def cmd_scan_todos(args):
    root_path = Path(args.path or WORKSPACE_DIR)
    extensions = {".ts", ".tsx", ".js", ".jsx", ".py", ".sql", ".rs", ".go"}
    ignore_dirs = {"node_modules", ".git", "dist", "build", "coverage", ".next", ".cache", "brain"}

    todo_pattern = re.compile(r'(//|#|/\*|--)\s*(TODO|FIXME|BUG|HACK|PERF):\s*(.+)', re.IGNORECASE)

    findings = []
    for dirpath, dirnames, filenames in os.walk(root_path):
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs and not d.startswith(".")]
        for file in filenames:
            file_path = Path(dirpath) / file
            if file_path.suffix in extensions:
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        for line_num, line in enumerate(f, 1):
                            match = todo_pattern.search(line)
                            if match:
                                tag_type = match.group(2).upper()
                                message = match.group(3).strip().rstrip("*/")
                                rel_path = file_path.relative_to(root_path)
                                findings.append({
                                    "file": str(rel_path).replace("\\", "/"),
                                    "line": line_num,
                                    "type": tag_type,
                                    "message": message
                                })
                except Exception:
                    continue

    print(f"\n🔍 ESCANEO DE CÓDIGO — TODOs / FIXMEs ENCONTRADOS ({len(findings)} detectados):")
    print("=" * 80)
    if not findings:
        print("No se encontraron anotaciones pendientes de TODO/FIXME en el código escaneado.")
        print("=" * 80 + "\n")
        return

    target_proj = args.project or "tincho/hyper-flow"
    for idx, item in enumerate(findings, 1):
        priority = "urgent" if item["type"] in ["BUG", "FIXME"] else "medium"
        tags = f"{item['type'].lower()},{Path(item['file']).suffix.replace('.', '')}"
        print(f"[{idx}] {item['type']} en {item['file']}:{item['line']}")
        print(f"    Texto: \"{item['message']}\"")
        print(f"    Comando sugerido para que TÚ lo envíes:")
        print(f"    python scripts/linear_studio.py create-issue --project \"{target_proj}\" --title \"{item['message']}\" --priority {priority} --tags \"{tags}\"")
        print("-" * 80)

    print("\n💡 La persona tiene el control total: copia y ejecuta cualquiera de los comandos anteriores")
    print("o pídele a Antigravity: 'crea el issue [1] en el proyecto boxtools' para crearlo.\n")

def main():
    parser = argparse.ArgumentParser(description="Linear Studio & Antigravity Issue Bridge")
    subparsers = parser.add_subparsers(dest="command", help="Comando a ejecutar")

    # list-projects
    p_projects = subparsers.add_parser("list-projects", help="Listar proyectos federados")

    # list-issues
    p_issues = subparsers.add_parser("list-issues", help="Listar issues")
    p_issues.add_argument("--project", "-p", help="Filtrar por proyecto")
    p_issues.add_argument("--status", "-s", help="Filtrar por status")

    # create-issue
    p_create = subparsers.add_parser("create-issue", help="Crear issue en cualquier proyecto")
    p_create.add_argument("--project", "-p", required=True, help="Proyecto o repo (ej: boxtools, tincho/hyper-flow)")
    p_create.add_argument("--title", "-t", required=True, help="Título del issue")
    p_create.add_argument("--desc", "-d", help="Descripción opcional")
    p_create.add_argument("--priority", choices=["urgent", "high", "medium", "low"], default="medium")
    p_create.add_argument("--status", choices=["backlog", "todo", "in_progress", "in_review", "done"], default="todo")
    p_create.add_argument("--tags", help="Tags separados por coma (ej: auth,security)")
    p_create.add_argument("--assignee", help="Nombre del asignado")

    # update-status
    p_update = subparsers.add_parser("update-status", help="Actualizar estado de un issue (en progreso, completado, etc.)")
    p_update.add_argument("--id", "-i", required=True, help="Número o UUID del issue")
    p_update.add_argument("--project", "-p", help="Proyecto o repositorio del issue (opcional)")
    p_update.add_argument("--status", "-s", required=True, choices=["backlog", "todo", "in_progress", "in_review", "done"], help="Nuevo estado")

    # scan-todos
    p_scan = subparsers.add_parser("scan-todos", help="Escanear TODOs y sugerir comandos para que el usuario los envíe")
    p_scan.add_argument("--path", help="Directorio a escanear")
    p_scan.add_argument("--project", help="Proyecto objetivo")

    args = parser.parse_args()

    if args.command == "list-projects":
        cmd_list_projects(args)
    elif args.command == "list-issues":
        cmd_list_issues(args)
    elif args.command == "create-issue":
        cmd_create_issue(args)
    elif args.command == "update-status":
        cmd_update_status(args)
    elif args.command == "scan-todos":
        cmd_scan_todos(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
