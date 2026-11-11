import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd"

def touch_swipe_up(cdp, x, y_start, y_end, steps=12):
    cdp.send("Input.dispatchTouchEvent", {
        "type": "touchStart",
        "touchPoints": [{"x": x, "y": y_start}]
    })
    dy = (y_end - y_start) / steps
    for i in range(1, steps + 1):
        cdp.send("Input.dispatchTouchEvent", {
            "type": "touchMove",
            "touchPoints": [{"x": x, "y": y_start + dy * i}]
        })
        time.sleep(0.015)
    cdp.send("Input.dispatchTouchEvent", {
        "type": "touchEnd",
        "touchPoints": []
    })

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 390, "height": 844},
            has_touch=True,
            is_mobile=True
        )
        page = context.new_page()
        cdp = context.new_cdp_session(page)

        print("1. Navegando a localhost:3001 en modo mobile táctil (390x844)...")
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

        page.wait_for_selector("#board-container", timeout=10000)
        time.sleep(1.5)

        # Verificar que las tarjetas en móvil tienen isDragDisabled (sin dragHandleProps bloqueando touch)
        tab = page.locator("button:has-text('Por Hacer')").first
        if tab.is_visible():
            tab.click()
            time.sleep(0.5)

        has_drag_handle = page.evaluate("""() => {
            const card = document.querySelector('[data-testid="issue-card"]');
            return card ? card.hasAttribute('data-rfd-drag-handle-draggable-id') : null;
        }""")
        print(f"¿Card móvil tiene dragHandle interceptando touch?: {has_drag_handle}")
        assert has_drag_handle is False, "En móvil dragHandleProps NO debe interceptar gestos táctiles!"

        # Simular altura extra con clones temporales en la columna activa para probar touch swipe REAL sobre una card
        page.evaluate("""() => {
            const col = document.querySelector('.kanban-col:not(.hidden) .flex-col.gap-2\\\\.5');
            if (col && col.children.length > 0) {
                const sample = col.children[0];
                for (let i = 0; i < 8; i++) {
                    col.appendChild(sample.cloneNode(true));
                }
            }
        }""")
        time.sleep(0.3)

        before_board_scroll = page.evaluate("() => document.querySelector('#board-container').scrollTop")
        board_dims = page.evaluate("() => { const el = document.querySelector('#board-container'); return { client: el.clientHeight, scroll: el.scrollHeight }; }")
        print(f"Board antes de swipe táctil -> scrollTop: {before_board_scroll}, dims: {board_dims}")

        # Swipe táctil empezando DIRECTAMENTE encima de una issue-card (x=195, y=350 -> y=100)
        touch_swipe_up(cdp, 195, 450, 120)
        time.sleep(0.4)

        after_board_scroll = page.evaluate("() => document.querySelector('#board-container').scrollTop")
        print(f"Board después de swipe táctil sobre card -> scrollTop: {after_board_scroll}")
        assert after_board_scroll > 50, f"El board móvil debió hacer scroll táctil al deslizar sobre la card (scrollTop={after_board_scroll})"

        board_scroll_shot = os.path.join(ARTIFACT_DIR, "mobile-touch-kanban-scrolled.png")
        page.screenshot(path=board_scroll_shot)
        print(f"✓ Screenshot scroll táctil Kanban guardado en {board_scroll_shot}")

        # Recargar para quitar clones DOM y probar SettingsView + Drawer
        page.reload()
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # Abrir menú y navegar a Configuración & Auth (SettingsView)
        page.locator("button[aria-label='Abrir menú']").click()
        time.sleep(0.3)
        page.locator("button:has-text('Configuración & Auth')").first.click()
        time.sleep(1)

        settings_before = page.evaluate("() => document.querySelector('.overflow-y-auto.touch-pan-y').scrollTop")
        touch_swipe_up(cdp, 195, 600, 150)
        time.sleep(0.4)
        settings_after = page.evaluate("() => document.querySelector('.overflow-y-auto.touch-pan-y').scrollTop")
        print(f"SettingsView touch swipe -> antes: {settings_before}, después: {settings_after}")
        assert settings_after > 50, "SettingsView debería hacer scroll táctil en mobile"

        # Volver al tablero y probar scroll dentro del IssueDetailDrawer (simulando pantalla chica 375x580)
        page.set_viewport_size({"width": 375, "height": 580})
        page.locator("button[aria-label='Abrir menú']").click()
        time.sleep(0.3)
        page.locator("button:has-text('Tablero Activo')").first.click()
        time.sleep(1)
        page.locator("button:has-text('Por Hacer')").first.click()
        time.sleep(0.5)
        page.locator("[data-testid='issue-card']:visible").first.click()
        time.sleep(0.8)

        drawer_scroll_before = page.evaluate("() => document.querySelector('[data-testid=\"issue-detail-drawer\"] .overflow-y-auto').scrollTop")
        touch_swipe_up(cdp, 185, 480, 140)
        time.sleep(0.4)
        drawer_scroll_after = page.evaluate("() => document.querySelector('[data-testid=\"issue-detail-drawer\"] .overflow-y-auto').scrollTop")
        print(f"Drawer touch swipe (375x580) -> antes: {drawer_scroll_before}, después: {drawer_scroll_after}")
        assert drawer_scroll_after > 50, "El Drawer de issue debe hacer scroll táctil en pantallas chicas"

        drawer_scroll_shot = os.path.join(ARTIFACT_DIR, "mobile-touch-drawer-scrolled.png")
        page.screenshot(path=drawer_scroll_shot)
        print(f"✓ Screenshot scroll táctil Drawer guardado en {drawer_scroll_shot}")

        print("=== PRUEBAS DE SCROLL TÁCTIL MOBILE EXITOSAS ===")
        browser.close()

if __name__ == "__main__":
    run()
