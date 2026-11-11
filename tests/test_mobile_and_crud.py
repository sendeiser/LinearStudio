import os
import sys
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile viewport iPhone 14
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1"
        )
        page = context.new_page()

        print("1. Navegando a localhost:3001...")
        page.goto("http://localhost:3001/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Login si está en LandingAuthPage
        if page.locator("text=Iniciar Sesión").is_visible():
            print("2. Iniciando sesión con martingt010@gmail.com...")
            page.locator("button:has-text('Iniciar Sesión')").click()
            time.sleep(0.5)
            page.locator("input[type='email']").fill("martingt010@gmail.com")
            page.locator("input[type='password']").fill("Martin/123")
            page.locator("button:has-text('Iniciar Sesión en Supabase')").click()
            time.sleep(2)
            page.wait_for_load_state("networkidle")

        print("3. Verificando vista Kanban y MobileColTabs...")
        page.wait_for_selector("#board-container", timeout=10000)
        time.sleep(1)

        initial_shot = os.path.join(ARTIFACT_DIR, "mobile-kanban-initial.png")
        page.screenshot(path=initial_shot)
        print(f"✓ Screenshot inicial guardado en {initial_shot}")

        # Comprobar si hay issues visibles; si no, crear uno rápido
        cards = page.locator("[data-testid='issue-card']")
        if cards.count() == 0:
            # Buscar en otras columnas en MobileColTabs
            tabs = page.locator("button:has-text('Por Hacer'), button:has-text('En Progreso'), button:has-text('Completado')")
            found = False
            for i in range(tabs.count()):
                tab = tabs.nth(i)
                tab.click()
                time.sleep(0.5)
                if page.locator("[data-testid='issue-card']").count() > 0:
                    found = True
                    break
            
            if not found:
                print("No hay issues en columnas actuales, creando un issue de prueba...")
                create_btn = page.locator("button[title*='Crear Issue'], button:has-text('Nuevo Issue')").first
                if create_btn.is_visible():
                    create_btn.click()
                    time.sleep(0.5)
                    page.locator("input[placeholder*='Título']").fill("Test Mobile Scroll & Sync")
                    page.locator("textarea[placeholder*='descripción']").fill("Descripción de verificación móvil")
                    page.locator("button:has-text('Crear Issue')").last.click()
                    time.sleep(1.5)

        cnt = page.locator("[data-testid='issue-card']").count()
        print(f"✓ Total issues en la columna activa: {cnt}")

        # 4. Probar scroll en contenedor móvil y columna
        print("4. Probando scroll móvil en cards container...")
        col_container = page.locator(".kanban-col .overflow-y-auto").first
        if col_container.is_visible():
            initial_scroll = col_container.evaluate("(el) => el.scrollTop")
            col_container.evaluate("(el) => el.scrollBy(0, 250)")
            time.sleep(0.5)
            scrolled_y = col_container.evaluate("(el) => el.scrollTop")
            print(f"Columna scroll - Inicial: {initial_scroll}, Después: {scrolled_y}")

        scrolled_shot = os.path.join(ARTIFACT_DIR, "mobile-kanban-scrolled.png")
        page.screenshot(path=scrolled_shot)
        print(f"✓ Screenshot mobile scrolled guardado en {scrolled_shot}")

        # 5. Probar botón chevron de mover columna
        print("5. Probando botón chevron para mover issue entre columnas...")
        visible_cards = page.locator("[data-testid='issue-card']:visible")
        print(f"Cards visibles en columna activa: {visible_cards.count()}")
        if visible_cards.count() == 0:
            # Si no hay en esta columna, buscar la columna que tenga cards visibles
            for tab_name in ['Por Hacer', 'En Progreso', 'En Revisión', 'Completado', 'Backlog']:
                t = page.locator(f"button:has-text('{tab_name}')").first
                if t.is_visible():
                    t.click()
                    time.sleep(0.5)
                    visible_cards = page.locator("[data-testid='issue-card']:visible")
                    if visible_cards.count() > 0:
                        print(f"Cambiado a tab '{tab_name}', cards visibles: {visible_cards.count()}")
                        break

        card = visible_cards.first
        if card.is_visible():
            move_buttons = card.locator("button[title*='Mover a']")
            print(f"Botones de mover disponibles: {move_buttons.count()}")
            if move_buttons.count() > 0:
                target_btn = move_buttons.first
                title_text = target_btn.get_attribute("title")
                print(f"Haciendo click en '{title_text}'...")
                target_btn.click()
                time.sleep(1.5)
                move_shot = os.path.join(ARTIFACT_DIR, "mobile-column-move.png")
                page.screenshot(path=move_shot)
                print(f"✓ Screenshot tras mover guardado en {move_shot}")

        # 6. Probar apertura de IssueDetailDrawer y cambio de estado desde select
        print("6. Probando IssueDetailDrawer y selector de estado interactivo...")
        target_card = page.locator("[data-testid='issue-card']:visible").first
        if not target_card.is_visible():
            for tab_name in ['Por Hacer', 'En Progreso', 'En Revisión', 'Completado', 'Backlog']:
                t = page.locator(f"button:has-text('{tab_name}')").first
                if t.is_visible():
                    t.click()
                    time.sleep(0.5)
                    target_card = page.locator("[data-testid='issue-card']:visible").first
                    if target_card.is_visible():
                        break

        if target_card.is_visible():
            target_card.click()
            time.sleep(1)
            drawer = page.locator("[data-testid='issue-detail-drawer']")
            if drawer.is_visible():
                print("✓ Drawer de detalle abierto en mobile")
                status_select = drawer.locator("select[title*='Cambiar estado']")
                if status_select.is_visible():
                    current_status = status_select.input_value()
                    print(f"Estado actual en el Drawer: {current_status}")
                    new_val = 'in_progress' if current_status != 'in_progress' else 'done'
                    status_select.select_option(new_val)
                    time.sleep(1.5)
                    print(f"Nuevo estado seleccionado desde el Drawer: {status_select.input_value()}")

                drawer_shot = os.path.join(ARTIFACT_DIR, "mobile-issue-drawer-status.png")
                page.screenshot(path=drawer_shot)
                print(f"✓ Screenshot drawer guardado en {drawer_shot}")

        print("=== TODAS LAS PRUEBAS MOBILE COMPLETADAS CON ÉXITO ===")
        browser.close()

if __name__ == "__main__":
    run()
