import os
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright
import shutil

PORT = 3499
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
    "viewports": [],
    "theme_toggle_dark": False,
    "theme_toggle_light": False,
    "filter_tested": False,
    "create_issue": False,
    "antigravity_agent": False
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # 1. Test responsive viewports
    viewports = [
        {"name": "react-light-desktop-1440", "width": 1440, "height": 900},
        {"name": "react-light-tablet-768", "width": 768, "height": 1024},
        {"name": "react-light-mobile-375", "width": 375, "height": 812}
    ]

    for vp in viewports:
        context = browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
        page = context.new_page()
        page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
        page.wait_for_timeout(500)
        
        overflow_info = page.evaluate("""() => {
            const docWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const bodyScrollWidth = document.body.scrollWidth;
            return {
                docWidth,
                scrollWidth,
                bodyScrollWidth,
                hasOverflow: bodyScrollWidth > docWidth || scrollWidth > docWidth
            };
        }""")
        
        screenshot_path = os.path.join(WORKSPACE_DIR, "tests", "reports", f"{vp['name']}.png")
        page.screenshot(path=screenshot_path, full_page=False)
        artifact_path = os.path.join(ARTIFACT_DIR, f"{vp['name']}.png")
        shutil.copyfile(screenshot_path, artifact_path)
        
        test_summary["viewports"].append({
            "name": vp["name"],
            "width": vp["width"],
            "overflow": overflow_info
        })
        context.close()

    # 2. Interactive tests on Desktop
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    page.wait_for_timeout(500)

    # Theme Toggle Test
    theme_btn = page.locator("button[data-testid='theme-toggle']")
    if theme_btn.count() > 0:
        # Toggle to Dark
        theme_btn.click()
        page.wait_for_timeout(300)
        is_dark = page.evaluate("() => document.documentElement.classList.contains('dark')")
        test_summary["theme_toggle_dark"] = is_dark
        
        # Dark screenshot
        dark_shot = os.path.join(WORKSPACE_DIR, "tests", "reports", "react-dark-desktop-1440.png")
        page.screenshot(path=dark_shot)
        shutil.copyfile(dark_shot, os.path.join(ARTIFACT_DIR, "react-dark-desktop-1440.png"))
        
        # Toggle back to Light
        theme_btn.click()
        page.wait_for_timeout(300)
        is_light = page.evaluate("() => !document.documentElement.classList.contains('dark')")
        test_summary["theme_toggle_light"] = is_light

    # Filter Chip Test
    urgent_chip = page.locator("button:has-text('🔥 Urgentes')")
    if urgent_chip.count() > 0:
        urgent_chip.click()
        page.wait_for_timeout(300)
        test_summary["filter_tested"] = True

    # Reset filter
    all_chip = page.locator("button:has-text('Todos')")
    if all_chip.count() > 0:
        all_chip.click()
        page.wait_for_timeout(300)

    # Create Issue Modal Test
    nuevo_issue_btn = page.locator("header button:has-text('+ Issue')")
    nuevo_issue_btn.click()
    page.wait_for_timeout(400)
    
    # Fill form
    page.fill("input[placeholder*='Ej: Corregir memory leak']", "E2E Test Issue - Stack React Verificado")
    textarea = page.locator("textarea")
    if textarea.count() > 0:
        textarea.fill("Verificando funcionamiento reactivo de Zustand y TanStack Query en Linear Studio.")
    
    submit_btn = page.locator("button[data-testid='submit-issue-btn'], button[type='submit']").first
    submit_btn.click()
    page.wait_for_timeout(600)
    
    # Verify card exists
    card_created = page.locator("text='E2E Test Issue - Stack React Verificado'").count() > 0
    test_summary["create_issue"] = card_created

    # Antigravity AI Agent dispatch test
    first_card = page.locator("article[data-testid='issue-card']").first
    first_card.click()
    page.wait_for_timeout(600)
    
    ag_btn = page.locator("button:has-text('Resolver con Antigravity')")
    if ag_btn.count() > 0:
        ag_btn.click()
        # Wait for agent progress
        page.wait_for_timeout(3500)
        test_summary["antigravity_agent"] = True
        
        ag_shot = os.path.join(WORKSPACE_DIR, "tests", "reports", "react-antigravity-active-1440.png")
        page.screenshot(path=ag_shot)
        shutil.copyfile(ag_shot, os.path.join(ARTIFACT_DIR, "react-antigravity-active-1440.png"))

    context.close()
    browser.close()

with open(os.path.join(WORKSPACE_DIR, "tests", "reports", "react_stack_summary.json"), "w", encoding="utf-8") as f:
    json.dump(test_summary, f, indent=2)

print("REACT_TEST_COMPLETE:", json.dumps(test_summary))
