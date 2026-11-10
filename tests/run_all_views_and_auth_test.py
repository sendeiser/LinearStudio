import os
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright
import shutil

PORT = 3588
DIST_DIR = r"d:\workspace\dist"
WORKSPACE_DIR = r"d:\workspace"
ARTIFACT_DIR = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd"

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(("127.0.0.1", PORT), QuietHandler)
    server.serve_forever()

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(1.0)

os.makedirs(os.path.join(WORKSPACE_DIR, "tests", "reports"), exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

test_summary = {
    "views_tested": {},
    "auth_signup_login_tested": False
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    page.wait_for_timeout(600)

    # 1. Test clicking "Todos los Issues"
    page.locator("aside nav button:has-text('Todos los Issues')").click()
    page.wait_for_timeout(400)
    has_table = page.locator("table").count() > 0
    test_summary["views_tested"]["all_issues"] = has_table
    shot_issues = os.path.join(WORKSPACE_DIR, "tests", "reports", "view-all-issues.png")
    page.screenshot(path=shot_issues)
    shutil.copyfile(shot_issues, os.path.join(ARTIFACT_DIR, "view-all-issues.png"))

    # 2. Test clicking "Hitos & Sprints"
    page.locator("aside nav button:has-text('Hitos & Sprints')").click()
    page.wait_for_timeout(400)
    has_sprint = page.locator("text=Sprint 24").count() > 0
    test_summary["views_tested"]["sprints"] = has_sprint
    shot_sprints = os.path.join(WORKSPACE_DIR, "tests", "reports", "view-sprints.png")
    page.screenshot(path=shot_sprints)
    shutil.copyfile(shot_sprints, os.path.join(ARTIFACT_DIR, "view-sprints.png"))

    # 3. Test clicking "Equipo & Workspaces" (must open directly WITHOUT modal blocking!)
    page.locator("aside nav button:has-text('Equipo & Workspaces')").click()
    page.wait_for_timeout(400)
    has_team = page.locator("text=Miembros del Equipo").count() > 0
    test_summary["views_tested"]["team"] = has_team
    shot_team = os.path.join(WORKSPACE_DIR, "tests", "reports", "view-team.png")
    page.screenshot(path=shot_team)
    shutil.copyfile(shot_team, os.path.join(ARTIFACT_DIR, "view-team.png"))

    # 4. Test clicking "Pull Requests"
    page.locator("aside nav button:has-text('Pull Requests')").click()
    page.wait_for_timeout(400)
    has_prs = page.locator("text='Pull Requests de GitHub'").count() > 0
    test_summary["views_tested"]["pull_requests"] = has_prs
    shot_prs = os.path.join(WORKSPACE_DIR, "tests", "reports", "view-prs.png")
    page.screenshot(path=shot_prs)
    shutil.copyfile(shot_prs, os.path.join(ARTIFACT_DIR, "view-prs.png"))

    # 5. Test clicking "Proyectos & Triage Global"
    page.locator("aside nav button:has-text('Proyectos & Triage Global')").click()
    page.wait_for_timeout(400)
    has_triage = page.locator("text=Triage Multi-Proyecto").count() > 0
    test_summary["views_tested"]["projects_triage"] = has_triage
    shot_triage = os.path.join(WORKSPACE_DIR, "tests", "reports", "view-projects-triage.png")
    page.screenshot(path=shot_triage)
    shutil.copyfile(shot_triage, os.path.join(ARTIFACT_DIR, "view-projects-triage.png"))

    # 6. Test clicking "Configuración & Auth"
    page.locator("aside nav button:has-text('Configuración & Auth')").click()
    page.wait_for_timeout(400)
    has_settings = page.locator("text='Configuración del Sistema & Auth'").count() > 0
    test_summary["views_tested"]["settings"] = has_settings
    shot_settings = os.path.join(WORKSPACE_DIR, "tests", "reports", "view-settings.png")
    page.screenshot(path=shot_settings)
    shutil.copyfile(shot_settings, os.path.join(ARTIFACT_DIR, "view-settings.png"))

    # 7. Test clicking "Tablero Activo"
    page.locator("aside nav button:has-text('Tablero Activo')").click()
    page.wait_for_timeout(400)
    has_board = page.locator("#board-container").count() > 0
    test_summary["views_tested"]["board"] = has_board

    # 8. Test Auth Modal: Register & Login in Supabase Cloud
    test_email = f"qa_test_{int(time.time())}@linear.studio"
    test_pass = "Password123!"

    page.locator("aside button[title*='Gestionar cuenta']").click()
    page.wait_for_timeout(400)

    # Click register switch
    page.locator("button:has-text('¿No tienes cuenta? Regístrate')").click()
    page.wait_for_timeout(200)

    # Fill register form
    page.fill(".fixed input[type='email']", test_email)
    page.fill(".fixed input[type='password']", test_pass)
    page.locator(".fixed button[type='submit']").click()
    page.wait_for_timeout(2000)

    # Verify session connected
    logged_in = page.locator(f"text='{test_email}'").count() > 0 or page.locator("text='Conectado'").count() > 0
    test_summary["auth_signup_login_tested"] = logged_in

    context.close()
    browser.close()

with open(os.path.join(WORKSPACE_DIR, "tests", "reports", "views_and_auth_summary.json"), "w", encoding="utf-8") as f:
    json.dump(test_summary, f, indent=2)

print("ALL_VIEWS_TEST_COMPLETE:", json.dumps(test_summary))
