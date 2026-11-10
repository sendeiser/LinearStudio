import os
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright

PORT = 3457
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

viewports = [
    {"name": "desktop", "width": 1440, "height": 900, "file": "verified-desktop-1440.png"},
    {"name": "tablet", "width": 768, "height": 1024, "file": "verified-tablet-768.png"},
    {"name": "mobile", "width": 375, "height": 812, "file": "verified-mobile-375.png"}
]

os.makedirs(os.path.join(WORKSPACE_DIR, "tests", "reports"), exist_ok=True)
os.makedirs(ARTIFACT_DIR, exist_ok=True)

verification_results = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    for vp in viewports:
        context = browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
        page = context.new_page()
        page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
        page.wait_for_timeout(1000)
        
        # Check overflow
        overflow_info = page.evaluate("""() => {
            const docWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const bodyScrollWidth = document.body.scrollWidth;
            const hasBodyOverflow = bodyScrollWidth > docWidth || scrollWidth > docWidth;
            
            // Check elements exceeding viewport width
            const overflowingElements = [];
            const all = document.querySelectorAll('*');
            for (let el of all) {
                const rect = el.getBoundingClientRect();
                if (rect.right > docWidth + 2) {
                    overflowingElements.push({
                        tag: el.tagName,
                        className: el.className ? el.className.toString().substring(0, 50) : '',
                        right: Math.round(rect.right),
                        docWidth: docWidth
                    });
                    if (overflowingElements.length >= 5) break;
                }
            }
            return {
                docWidth,
                scrollWidth,
                bodyScrollWidth,
                hasOverflow: hasBodyOverflow,
                overflowingElements
            };
        }""")
        
        # Save screenshot
        ws_path = os.path.join(WORKSPACE_DIR, "tests", "reports", vp["file"])
        art_path = os.path.join(ARTIFACT_DIR, vp["file"])
        page.screenshot(path=ws_path)
        page.screenshot(path=art_path)
        
        verification_results.append({
            "viewport": vp["name"],
            "dimensions": f"{vp['width']}x{vp['height']}",
            "screenshot": vp["file"],
            "overflow_info": overflow_info
        })
        
        context.close()
        
    browser.close()

report_path = os.path.join(WORKSPACE_DIR, "tests", "reports", "verification-report.json")
with open(report_path, "w", encoding="utf-8") as f:
    json.dump(verification_results, f, indent=2)

print("VERIFICATION COMPLETED")
print(json.dumps(verification_results, indent=2))

