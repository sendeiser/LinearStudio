import os
import time
import json
import shutil
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright

PORT = 3594
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
    "github_section_rendered": False,
    "github_token_input_rendered": False,
    "sync_button_rendered": False
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    page.wait_for_timeout(600)

    # Click Configuración & Auth
    page.locator("aside nav button:has-text('Configuración & Auth')").click()
    page.wait_for_timeout(500)

    # Verify GitHub Section
    has_gh_section = page.locator("text=Integración con GitHub & API Key").count() > 0
    test_results["github_section_rendered"] = has_gh_section

    # Verify PAT input
    has_token_input = page.locator("input[placeholder*='ghp_']").count() > 0
    test_results["github_token_input_rendered"] = has_token_input

    # Verify Sync button
    has_sync_btn = page.locator("button:has-text('Sincronizar Issues de GitHub')").count() > 0
    test_results["sync_button_rendered"] = has_sync_btn

    # Take screenshot of Settings with GitHub integration
    shot_settings = os.path.join(WORKSPACE_DIR, "tests", "reports", "view-settings-github.png")
    page.screenshot(path=shot_settings)
    shutil.copyfile(shot_settings, os.path.join(ARTIFACT_DIR, "view-settings-github.png"))

    context.close()
    browser.close()

with open(os.path.join(WORKSPACE_DIR, "tests", "reports", "github_settings_test.json"), "w", encoding="utf-8") as f:
    json.dump(test_results, f, indent=2)

print("GITHUB_SETTINGS_TEST_COMPLETED:", json.dumps(test_results))

