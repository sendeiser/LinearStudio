import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        print("1. Navegando a localhost:3001 en modo desktop (1280x800)...")
        page.goto("http://localhost:3001/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        if page.locator("text=Iniciar Sesión").is_visible():
            print("2. Iniciando sesión...")
            page.locator("button:has-text('Iniciar Sesión')").click()
            time.sleep(0.3)
            page.locator("input[type='email']").fill("martingt010@gmail.com")
            page.locator("input[type='password']").fill("Martin/123")
            page.locator("button:has-text('Iniciar Sesión en Supabase')").click()
            time.sleep(2.5)
            page.wait_for_load_state("networkidle")

        page.wait_for_selector("[data-testid='sidebar']", timeout=10000)
        time.sleep(1)

        # Verificar ancho inicial expandido (256px)
        initial_width = page.evaluate("() => document.querySelector('[data-testid=\"sidebar\"]').getBoundingClientRect().width")
        print(f"Ancho inicial del sidebar: {initial_width}px")
        assert initial_width == 256, f"El sidebar debe iniciar expandido con 256px, obtuvo {initial_width}"

        # Click en botón retráctil desktop
        toggle_btn = page.locator("[data-testid='desktop-sidebar-toggle']")
        assert toggle_btn.is_visible(), "El botón para retraer el navbar debe ser visible en desktop"
        toggle_btn.click()
        time.sleep(0.35)

        collapsed_width = page.evaluate("() => document.querySelector('[data-testid=\"sidebar\"]').getBoundingClientRect().width")
        print(f"Ancho tras retraer: {collapsed_width}px")
        assert collapsed_width == 0, f"El sidebar retraído debe medir 0px, obtuvo {collapsed_width}"

        retracted_shot = os.path.join(ARTIFACT_DIR, "desktop-sidebar-retracted.png")
        page.screenshot(path=retracted_shot)
        print(f"✓ Screenshot desktop con sidebar retraído guardado en {retracted_shot}")

        # Recargar página para validar persistencia
        page.reload()
        page.wait_for_load_state("networkidle")
        time.sleep(1.5)
        persisted_width = page.evaluate("() => document.querySelector('[data-testid=\"sidebar\"]').getBoundingClientRect().width")
        print(f"Ancho tras recargar (persistido): {persisted_width}px")
        assert persisted_width == 0, "El estado retraído debe persistir tras recargar"

        # Expandir nuevamente usando atajo Ctrl+B
        page.keyboard.press("Control+b")
        time.sleep(0.35)
        expanded_width = page.evaluate("() => document.querySelector('[data-testid=\"sidebar\"]').getBoundingClientRect().width")
        print(f"Ancho tras expandir con Ctrl+B: {expanded_width}px")
        assert expanded_width == 256, f"El sidebar expandido debe medir 256px, obtuvo {expanded_width}"

        expanded_shot = os.path.join(ARTIFACT_DIR, "desktop-sidebar-expanded.png")
        page.screenshot(path=expanded_shot)
        print(f"✓ Screenshot desktop con sidebar expandido guardado en {expanded_shot}")

        print("=== PRUEBA DE NAVBAR RETRÁCTIL DESKTOP COMPLETADA CON ÉXITO ===")
        browser.close()

if __name__ == "__main__":
    run()

