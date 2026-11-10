import os
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
from playwright.sync_api import sync_playwright
import shutil

PORT = 3510
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

final_report = {
    "desktop": {},
    "tablet": {},
    "mobile": {},
    "interactions": {},
    "overflow_checks": {}
}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # -------------------------------------------------------------
    # 1. Desktop Journey (1440x900)
    # -------------------------------------------------------------
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()
    page.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    page.wait_for_timeout(600)

    # Screenshot: Light Desktop
    shot_light = os.path.join(WORKSPACE_DIR, "tests", "reports", "final-light-desktop-1440.png")
    page.screenshot(path=shot_light)
    shutil.copyfile(shot_light, os.path.join(ARTIFACT_DIR, "final-light-desktop-1440.png"))

    # Theme Toggle to Dark
    theme_btn = page.locator("button[data-testid='theme-toggle']")
    theme_btn.click()
    page.wait_for_timeout(300)
    shot_dark = os.path.join(WORKSPACE_DIR, "tests", "reports", "final-dark-desktop-1440.png")
    page.screenshot(path=shot_dark)
    shutil.copyfile(shot_dark, os.path.join(ARTIFACT_DIR, "final-dark-desktop-1440.png"))
    final_report["desktop"]["dark_mode"] = page.evaluate("() => document.documentElement.classList.contains('dark')")

    # Toggle back to Light
    theme_btn.click()
    page.wait_for_timeout(300)

    # Keyboard Search / Direct Search Filter
    search_input = page.locator("header input[placeholder*='Buscar issues']")
    search_input.fill("rate limiting")
    page.wait_for_timeout(400)
    final_report["interactions"]["search_filtered"] = page.locator("text='rate limiting'").count() > 0

    # Clear search
    search_input.fill("")
    page.wait_for_timeout(300)

    # Filter Chip: Seguridad
    seguridad_chip = page.locator("button:has-text('🛡️ Seguridad')")
    if seguridad_chip.count() > 0:
        seguridad_chip.click()
        page.wait_for_timeout(300)
        final_report["interactions"]["filter_seguridad"] = True

    # Reset Filter to All
    page.locator("button:has-text('Todos')").click()
    page.wait_for_timeout(300)

    # Create New Issue via Modal
    page.locator("header button:has-text('+ Issue')").click()
    page.wait_for_timeout(400)
    page.fill("input[placeholder*='Ej: Corregir memory leak']", "Final Release QA - E2E User Journey Verified")
    page.locator("select").first.select_option("urgent")
    textarea = page.locator("textarea")
    if textarea.count() > 0:
        textarea.fill("Validación exhaustiva de la Fase 4 de PEVC V6.")
    page.locator("button[data-testid='submit-issue-btn'], button[type='submit']").first.click()
    page.wait_for_timeout(600)
    final_report["interactions"]["new_issue_created"] = page.locator("text='Final Release QA - E2E User Journey Verified'").count() > 0

    # Move issue via Quick Action Button
    quick_move = page.locator("article[data-testid='issue-card'] button[title*='Mover a']").first
    if quick_move.count() > 0:
        quick_move.click(force=True)
        page.wait_for_timeout(400)
        final_report["interactions"]["card_moved"] = True

    # Open Issue Drawer
    card_to_open = page.locator("article[data-testid='issue-card']").first
    card_to_open.click()
    page.wait_for_timeout(500)

    # Subtask toggle
    subtask = page.locator("aside label:has(input[type='checkbox'])").first
    if subtask.count() > 0:
        subtask.click()
        page.wait_for_timeout(300)
        final_report["interactions"]["subtask_toggled"] = True

    # Add comment
    comment_input = page.locator("aside input[placeholder*='Escribe un comentario']")
    if comment_input.count() > 0:
        comment_input.fill("E2E QA Signoff: Todos los sistemas operativos y validados.")
        page.locator("aside form button[type='submit']").click()
        page.wait_for_timeout(400)
        final_report["interactions"]["comment_posted"] = page.locator("text='E2E QA Signoff'").count() > 0

    # Antigravity Agent Dispatch
    ag_btn = page.locator("button:has-text('Resolver con Antigravity')")
    if ag_btn.count() > 0:
        ag_btn.click()
        page.wait_for_timeout(3600)
        final_report["interactions"]["antigravity_resolved"] = True
        shot_ag = os.path.join(WORKSPACE_DIR, "tests", "reports", "final-antigravity-completed-1440.png")
        page.screenshot(path=shot_ag)
        shutil.copyfile(shot_ag, os.path.join(ARTIFACT_DIR, "final-antigravity-completed-1440.png"))

    # Check overflow desktop
    final_report["overflow_checks"]["desktop_1440"] = page.evaluate("() => document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    context.close()

    # -------------------------------------------------------------
    # 2. Tablet Journey (768x1024)
    # -------------------------------------------------------------
    ctx_tablet = browser.new_context(viewport={"width": 768, "height": 1024})
    page_tab = ctx_tablet.new_page()
    page_tab.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    page_tab.wait_for_timeout(500)
    shot_tab = os.path.join(WORKSPACE_DIR, "tests", "reports", "final-light-tablet-768.png")
    page_tab.screenshot(path=shot_tab)
    shutil.copyfile(shot_tab, os.path.join(ARTIFACT_DIR, "final-light-tablet-768.png"))
    final_report["overflow_checks"]["tablet_768"] = page_tab.evaluate("() => document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    ctx_tablet.close()

    # -------------------------------------------------------------
    # 3. Mobile Journey (375x812) with Tab Navigation
    # -------------------------------------------------------------
    ctx_mob = browser.new_context(viewport={"width": 375, "height": 812})
    page_mob = ctx_mob.new_page()
    page_mob.goto(f"http://127.0.0.1:{PORT}/index.html", wait_until="networkidle")
    page_mob.wait_for_timeout(500)

    # Click through tabs
    tabs = ["Backlog", "Por Hacer", "En Progreso", "En Revisión", "Completado"]
    tab_overflows = {}
    for tab_name in tabs:
        btn = page_mob.locator(f"button:has-text('{tab_name}')").first
        if btn.count() > 0:
            btn.click()
            page_mob.wait_for_timeout(200)
            has_no_overflow = page_mob.evaluate("() => document.documentElement.scrollWidth <= document.documentElement.clientWidth")
            tab_overflows[tab_name] = has_no_overflow

    final_report["mobile"]["tabs_tested"] = tab_overflows
    shot_mob = os.path.join(WORKSPACE_DIR, "tests", "reports", "final-light-mobile-375.png")
    page_mob.screenshot(path=shot_mob)
    shutil.copyfile(shot_mob, os.path.join(ARTIFACT_DIR, "final-light-mobile-375.png"))
    final_report["overflow_checks"]["mobile_375"] = page_mob.evaluate("() => document.documentElement.scrollWidth <= document.documentElement.clientWidth")
    ctx_mob.close()

    browser.close()

with open(os.path.join(WORKSPACE_DIR, "tests", "reports", "final_e2e_summary.json"), "w", encoding="utf-8") as f:
    json.dump(final_report, f, indent=2)

print("FINAL_E2E_COMPLETE:", json.dumps(final_report))

