import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        print("1. Navegando a localhost:3001...")
        page.goto("http://localhost:3001/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Iniciar sesión si es necesario
        if page.locator("text=Iniciar Sesión").is_visible():
            print("2. Iniciando sesión...")
            page.locator("button:has-text('Iniciar Sesión')").click()
            time.sleep(0.5)
            page.locator("input[type='email']").fill("martingt010@gmail.com")
            page.locator("input[type='password']").fill("Martin/123")
            page.locator("button:has-text('Iniciar Sesión en Supabase')").click()
            time.sleep(2)
            page.wait_for_load_state("networkidle")

        print("3. Verificando Drawer de Issue limpio sin 'gemini / ai banner'...")
        page.wait_for_selector("#board-container", timeout=10000)
        time.sleep(1)

        # Abrir el primer issue disponible
        card = page.locator("[data-testid='issue-card']:visible").first
        if card.is_visible():
            card.click()
            time.sleep(1)
            drawer = page.locator("[data-testid='issue-detail-drawer']")
            if drawer.is_visible():
                print("✓ Drawer abierto")
                # Verificar que NO existe texto de Antigravity Coding Agent
                has_gemini = drawer.locator("text=Antigravity Coding Agent").is_visible()
                print(f"¿Existe banner Gemini/Antigravity en el drawer?: {has_gemini}")
                assert not has_gemini, "El banner Gemini no debería existir en el drawer"

                clean_shot = os.path.join(ARTIFACT_DIR, "issue-drawer-clean-no-gemini.png")
                page.screenshot(path=clean_shot)
                print(f"✓ Screenshot del issue limpio guardado en {clean_shot}")

        # 4. Navegar a Pull Requests
        print("4. Navegando a la vista Pull Requests...")
        pr_nav = page.locator("button:has-text('Pull Requests')").first
        pr_nav.click()
        time.sleep(1.5)

        pr_header = page.locator("h1:has-text('Pull Requests de GitHub')")
        print(f"¿Vista Pull Requests visible?: {pr_header.is_visible()}")

        # Click en botón 'Sincronizar PRs'
        sync_btn = page.locator("button:has-text('Sincronizar PRs'), button:has-text('Sincronizar Ahora')").first
        if sync_btn.is_visible():
            print("Haciendo click en Sincronizar PRs...")
            sync_btn.click()
            time.sleep(2)

        pr_shot = os.path.join(ARTIFACT_DIR, "pull-requests-synced-view.png")
        page.screenshot(path=pr_shot)
        print(f"✓ Screenshot de Pull Requests guardado en {pr_shot}")

        print("=== TODAS LAS PRUEBAS COMPLETADAS ===")
        browser.close()

if __name__ == "__main__":
    run()
