import os
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright

PORT = 3459
WORKSPACE_DIR = r"d:\workspace"
ARTIFACT_DIR = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd"

class QuietHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORKSPACE_DIR, **kwargs)
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(("127.0.0.1", PORT), QuietHandler)
    server.serve_forever()

t = threading.Thread(target=run_server, daemon=True)
t.start()
time.sleep(0.5)

os.makedirs(os.path.join(WORKSPACE_DIR, "tests", "reports"), exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

test_results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # 1. Desktop Light & Dark Mode
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    page.wait_for_timeout(500)
    
    # Click Antigravity Dispatch
    page.click("#btn-dispatch-antigravity")
    page.wait_for_timeout(1500)
    
    # Screenshot Desktop Light with Antigravity running
    page.screenshot(path=os.path.join(WORKSPACE_DIR, "tests", "reports", "dual-light-antigravity-1440.png"))
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "dual-light-antigravity-1440.png"))
    
    # Toggle Dark Mode
    page.click("#theme-toggle-btn")
    page.wait_for_timeout(600)
    
    # Screenshot Desktop Dark with Antigravity running
    page.screenshot(path=os.path.join(WORKSPACE_DIR, "tests", "reports", "dual-dark-desktop-1440.png"))
    page.screenshot(path=os.path.join(ARTIFACT_DIR, "dual-dark-desktop-1440.png"))
    
    context.close()
    
    # 2. Mobile Dark & Light
    context_mobile = browser.new_context(viewport={"width": 375, "height": 812})
    page_mobile = context_mobile.new_page()
    page_mobile.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    
    # Switch to Dark mode on mobile
    page_mobile.click("#theme-toggle-btn")
    page_mobile.wait_for_timeout(400)
    
    # Test mobile column switch tab to "En Progreso"
    page_mobile.click("button[data-col='in_progress']")
    page_mobile.wait_for_timeout(400)
    
    page_mobile.screenshot(path=os.path.join(WORKSPACE_DIR, "tests", "reports", "dual-dark-mobile-375.png"))
    page_mobile.screenshot(path=os.path.join(ARTIFACT_DIR, "dual-dark-mobile-375.png"))
    
    context_mobile.close()
    browser.close()

print("DUAL THEME & ANTIGRAVITY PLAYWRIGHT TEST COMPLETED SUCCESSFULLY")
