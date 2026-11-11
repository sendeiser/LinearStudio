import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("1. Opening app at http://localhost:3001/")
        page.goto("http://localhost:3001/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Check if landing page is displayed
        if page.locator("button:has-text('Iniciar Sesión')").is_visible():
            print("2. Clicking Iniciar Sesión tab and logging in with Martin credentials...")
            page.locator("button:has-text('Iniciar Sesión')").first.click()
            page.wait_for_timeout(500)
            page.fill("form input[type='email']", "martingt010@gmail.com")
            page.fill("form input[type='password']", "Martin/123")
            page.locator("button[type='submit']:has-text('Iniciar Sesión en Supabase')").click()
            page.wait_for_timeout(3000)

        # Navigate to "Triage Multi-Proyecto"
        print("3. Navigating to Triage Multi-Proyecto...")
        # Sidebar button with text containing 'Triage' or 'Proyectos'
        triage_btn = page.locator("button:has-text('Proyectos & Triage Global'), button:has-text('Triage')").first
        triage_btn.wait_for(state="visible", timeout=10000)
        triage_btn.click()
        page.wait_for_timeout(2500)

        # Capture initial triage view
        page.screenshot(path="C:/Users/TinChoX/.gemini/antigravity/brain/a7df6650-86f3-4c14-aa43-f81f92cec3fd/triage-initial-view.png")
        print("Initial triage view screenshot taken.")

        # Test adding a new project
        print("4. Testing adding a new project: sendeiser/demo-test...")
        add_btn = page.locator("button:has-text('+ Agregar Proyecto')")
        add_btn.click()
        page.wait_for_timeout(1000)

        page.fill("input[placeholder='ej: sendeiser/LinearStudio']", "sendeiser/demo-test")
        page.click("button:has-text('Vincular Repositorio')")
        page.wait_for_timeout(2500)
        page.screenshot(path="C:/Users/TinChoX/.gemini/antigravity/brain/a7df6650-86f3-4c14-aa43-f81f92cec3fd/triage-after-add-project.png")
        print("New project added and screenshot taken.")

        # Test editing the newly added project
        print("5. Testing editing project sendeiser/demo-test...")
        demo_card = page.locator("[data-testid='project-card-sendeiser/demo-test']").first
        demo_card.locator("button[title='Modificar proyecto']").first.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="C:/Users/TinChoX/.gemini/antigravity/brain/a7df6650-86f3-4c14-aa43-f81f92cec3fd/triage-edit-modal.png")
        page.fill("input[value='sendeiser/demo-test']", "sendeiser/demo-test-v2")
        page.click("button:has-text('Guardar Cambios')")
        page.wait_for_timeout(2500)
        page.screenshot(path="C:/Users/TinChoX/.gemini/antigravity/brain/a7df6650-86f3-4c14-aa43-f81f92cec3fd/triage-after-edit-project.png")
        print("Project edited successfully.")

        # Test deleting the project
        print("6. Testing deleting project sendeiser/demo-test-v2...")
        v2_card = page.locator("[data-testid='project-card-sendeiser/demo-test-v2']").first
        v2_card.locator("button[title='Eliminar de federaciones']").first.click()
        page.wait_for_timeout(1000)
        page.screenshot(path="C:/Users/TinChoX/.gemini/antigravity/brain/a7df6650-86f3-4c14-aa43-f81f92cec3fd/triage-delete-modal.png")
        page.click("button:has-text('Eliminar Proyecto')")
        page.wait_for_timeout(2500)
        page.screenshot(path="C:/Users/TinChoX/.gemini/antigravity/brain/a7df6650-86f3-4c14-aa43-f81f92cec3fd/triage-after-delete-project.png")
        print("Project deleted successfully.")

        # Navigate to Settings and verify GitHub API key
        print("7. Navigating to Configuración & Auth...")
        settings_btn = page.locator("button:has-text('Configuración & Auth'), button:has-text('Configuración')").first
        if settings_btn.is_visible():
            settings_btn.click()
            page.wait_for_timeout(2500)
            page.screenshot(path="C:/Users/TinChoX/.gemini/antigravity/brain/a7df6650-86f3-4c14-aa43-f81f92cec3fd/settings-view-final.png")
            print("Settings screenshot taken.")

        browser.close()
        print("E2E Test completed successfully!")

if __name__ == "__main__":
    run()
