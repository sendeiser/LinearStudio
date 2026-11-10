import os
import time
import json
import shutil
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright

PORT = 3596
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

test_results = {
    "landing_rendered_unauthenticated": False,
    "panel_blocked_before_login": False,
    "registration_flow_worked": False,
    "dashboard_opened_after_auth": False,
    "signout_returned_to_landing": False,
    "signin_with_account_worked": False
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    # Clear any storage/cookies for clean unauthenticated test
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    page.wait_for_timeout(700)

    # 1. Verify Landing Page is shown and Panel is blocked
    has_landing_title = page.locator("text=Control de Issues y Repositorios").count() > 0
    has_sidebar = page.locator("aside").count() > 0

    test_results["landing_rendered_unauthenticated"] = has_landing_title
    test_results["panel_blocked_before_login"] = not has_sidebar

    # Screenshot Landing Page
    shot_landing = os.path.join(WORKSPACE_DIR, "tests", "reports", "landing-auth-page.png")
    page.screenshot(path=shot_landing)
    shutil.copyfile(shot_landing, os.path.join(ARTIFACT_DIR, "landing-auth-page.png"))

    # 2. Test Registration Flow
    test_ts = int(time.time())
    reg_name = f"Dev QA {test_ts}"
    reg_email = f"qa_user_{test_ts}@linear.studio"
    reg_pass = "SecurePass123!"

    # Ensure on register tab
    page.locator("button:has-text('Registrarse')").first.click()
    page.wait_for_timeout(200)

    page.fill("input[placeholder*='Martin Tincho']", reg_name)
    page.fill("form input[type='email']", reg_email)
    page.fill("input[placeholder*='Mínimo 6 caracteres']", reg_pass)
    page.fill("input[placeholder*='Repite la contraseña']", reg_pass)

    page.locator("button[type='submit']:has-text('Registrarse y Entrar al Panel')").click()
    page.wait_for_timeout(2500)

    # Verify Dashboard Panel opened
    has_panel_now = page.locator("aside").count() > 0
    test_results["registration_flow_worked"] = has_panel_now
    test_results["dashboard_opened_after_auth"] = has_panel_now

    # Screenshot Dashboard after registration
    shot_dashboard = os.path.join(WORKSPACE_DIR, "tests", "reports", "dashboard-after-login.png")
    page.screenshot(path=shot_dashboard)
    shutil.copyfile(shot_dashboard, os.path.join(ARTIFACT_DIR, "dashboard-after-login.png"))

    # 3. Test Logout / Sign Out
    page.locator("aside button[title*='Cerrar sesión']").click()
    page.wait_for_timeout(800)

    # Verify back on Landing Page
    back_to_landing = page.locator("text=Control de Issues y Repositorios").count() > 0
    test_results["signout_returned_to_landing"] = back_to_landing

    # 4. Test Sign In with the newly registered account
    page.locator("button:has-text('Iniciar Sesión')").first.click()
    page.wait_for_timeout(200)

    page.fill("form input[type='email']", reg_email)
    page.fill("form input[type='password']", reg_pass)
    page.locator("button[type='submit']:has-text('Iniciar Sesión en Supabase')").click()
    page.wait_for_timeout(2500)

    # Verify panel re-opened
    panel_reopened = page.locator("aside").count() > 0
    test_results["signin_with_account_worked"] = panel_reopened

    context.close()
    browser.close()

with open(os.path.join(WORKSPACE_DIR, "tests", "reports", "landing_and_auth_gate_results.json"), "w", encoding="utf-8") as f:
    json.dump(test_results, f, indent=2)

print("LANDING_AUTH_GATE_TEST_COMPLETED:", json.dumps(test_results))

