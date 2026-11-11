import os
import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1440, "height": 900})
    page.goto("http://localhost:3001/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)

    # Click Iniciar Sesión tab
    page.locator("button:has-text('Iniciar Sesión')").click()
    page.wait_for_timeout(300)

    # Fill email and the new password Martin/123
    page.fill("form input[type='email']", "martingt010@gmail.com")
    page.fill("form input[type='password']", "Martin/123")

    # Submit login
    page.locator("button[type='submit']:has-text('Iniciar Sesión en Supabase')").click()
    page.wait_for_timeout(2500)

    # Check if dashboard opened
    cards = page.locator("article[data-testid='issue-card']")
    cards_count = cards.count()
    user_visible = page.locator("text=martingt010").count() > 0

    print("LOGIN_RESULT:", {
        "cards_loaded": cards_count > 0,
        "cards_count": cards_count,
        "user_logged_in": user_visible
    })

    # Take screenshot of active panel
    screenshot_path = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd\dashboard-login-martin123.png"
    page.screenshot(path=screenshot_path)
    browser.close()
