import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 860})
        page = context.new_page()

        print("1. Navegando a localhost:3001...")
        page.goto("http://localhost:3001/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        if page.locator("text=Iniciar Sesión").is_visible():
            print("2. Iniciando sesión con martingt010@gmail.com...")
            page.locator("button:has-text('Iniciar Sesión')").click()
            time.sleep(0.5)
            page.locator("input[type='email']").fill("martingt010@gmail.com")
            page.locator("input[type='password']").fill("Martin/123")
            page.locator("button:has-text('Iniciar Sesión en Supabase')").click()
            time.sleep(2.5)
            page.wait_for_load_state("networkidle")

        print("3. Abriendo Issue #1 (Diseñar temas, estructuras)...")
        page.wait_for_selector("#board-container", timeout=10000)
        time.sleep(1.5)

        card_1 = page.locator("[data-testid='issue-card']:has-text('#1')").first
        card_1.click()
        time.sleep(1)

        drawer = page.locator("[data-testid='issue-detail-drawer']")
        assert drawer.is_visible(), "Drawer debería estar visible"

        # Leer estado inicial de la subtarea 'Crear scroll interno del contenedor de playlist de la cabina'
        target_label = drawer.locator("label:has-text('Crear scroll interno')")
        checkbox = target_label.locator("input[type='checkbox']")
        initial_checked = checkbox.is_checked()
        header_before = drawer.locator("span:has-text('Subtareas')").inner_text()
        print(f"Estado inicial checkbox: {initial_checked} | Header: {header_before}")

        # Click en el checkbox directamente
        checkbox.click()
        time.sleep(0.2)
        after_click_checked = checkbox.is_checked()
        header_after = drawer.locator("span:has-text('Subtareas')").inner_text()
        print(f"Después de click en checkbox: {after_click_checked} | Header: {header_after}")
        assert after_click_checked != initial_checked, "El checkbox debería haber cambiado de estado al instante"

        shot_checked = os.path.join(ARTIFACT_DIR, "subtasks-toggled-working.png")
        page.screenshot(path=shot_checked)
        print(f"✓ Screenshot con subtarea seleccionada guardado en {shot_checked}")

        # Esperar persistencia en Supabase y recargar página para verificar persistencia real
        time.sleep(1.5)
        print("4. Recargando página para verificar persistencia en Supabase Cloud...")
        page.reload()
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        page.locator("[data-testid='issue-card']:has-text('#1')").first.click()
        time.sleep(1)
        drawer = page.locator("[data-testid='issue-detail-drawer']")
        persisted_checked = drawer.locator("label:has-text('Crear scroll interno') input[type='checkbox']").is_checked()
        print(f"Después de recargar: persisted_checked = {persisted_checked}")
        assert persisted_checked == after_click_checked, "El estado de la subtarea debió persistir en Supabase"

        # Probar hacer click en el TEXTO de la subtarea (label text) para revertirla
        drawer.locator("label:has-text('Crear scroll interno') span").click()
        time.sleep(1.5)
        reverted_checked = drawer.locator("label:has-text('Crear scroll interno') input[type='checkbox']").is_checked()
        print(f"Después de click en texto (reversión): reverted_checked = {reverted_checked}")
        assert reverted_checked == initial_checked, "Click en el texto de la subtarea debe alternar exactamente una vez"

        print("=== PRUEBA DE SUBTAREAS COMPLETADA CON ÉXITO ===")
        browser.close()

if __name__ == "__main__":
    run()
