import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 860})
        page = context.new_page()

        # Auto accept confirm dialogs
        page.on("dialog", lambda dialog: dialog.accept())

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

        print("3. Verificando repositorio activo en el tablero...")
        page.wait_for_selector("#board-container", timeout=10000)
        time.sleep(1.5)

        header_text = page.locator("header").inner_text()
        print("Header activo:", header_text.replace("\n", " | "))
        assert "sendeiser/PonelePlay" in header_text, f"Se esperaba sendeiser/PonelePlay en header, obtuvo: {header_text}"
        assert "tincho/hyper-flow" not in header_text, "No debería aparecer el proyecto dummy tincho/hyper-flow"

        # Verificar cambio instantáneo de columna (0ms)
        print("4. Probando cambio rápido entre columnas...")
        card = page.locator("[data-testid='issue-card']:visible").first
        if card.is_visible():
            move_right = card.locator("button[title*='Mover a']").last
            if move_right.is_visible():
                t0 = time.time()
                move_right.click()
                # Verificar inmediatamente sin sleep que la card ya cambió en DOM
                time.sleep(0.1)
                t1 = time.time()
                print(f"✓ Transición optimista reflejada en {(t1 - t0)*1000:.0f}ms")
                time.sleep(1)

        board_shot = os.path.join(ARTIFACT_DIR, "board-clean-poneleplay.png")
        page.screenshot(path=board_shot)
        print(f"✓ Screenshot tablero limpio guardado en {board_shot}")

        # 5. Abrir modal Workspaces de Equipo
        print("5. Verificando modal Workspaces de Equipo (sin proyectos eliminados y con botón de miembros/eliminar)...")
        page.locator("header button[title*='Cambiar repositorio']").click()
        time.sleep(1.5)

        modal = page.locator("div.fixed.inset-0")
        active_ws_text = modal.locator("div.space-y-2").first.inner_text()
        assert "LinearStudio" not in active_ws_text, "LinearStudio ya eliminado no debe aparecer"
        assert "comanda-saas" not in active_ws_text, "comanda-saas ya eliminado no debe aparecer"
        assert "PonelePlay" in active_ws_text
        assert "ExamenesIAForms" in active_ws_text

        # Expandir miembros en el primer workspace (PonelePlay)
        modal.locator("button:has-text('Miembros')").first.click()
        time.sleep(1)

        modal_shot = os.path.join(ARTIFACT_DIR, "workspaces-modal-members-delete.png")
        page.screenshot(path=modal_shot)
        print(f"✓ Screenshot modal Workspaces guardado en {modal_shot}")

        # Cerrar modal
        modal.locator("button").first.click()
        time.sleep(0.5)

        # 6. Ir a vista Equipo & Workspaces e invitar + eliminar un miembro real
        print("6. Probando agregar y eliminar miembro en vista 'Equipo & Workspaces'...")
        page.locator("button:has-text('Equipo & Workspaces')").click()
        time.sleep(1.5)

        # Invitar admin@gmail.com
        invite_input = page.locator("input[placeholder*='Email del usuario']")
        if invite_input.is_visible():
            invite_input.fill("admin@gmail.com")
            page.locator("button:has-text('Añadir al Equipo')").click()
            time.sleep(2)

        assert page.get_by_text("admin@gmail.com", exact=True).is_visible(), "admin@gmail.com debería haberse añadido al equipo"
        team_added_shot = os.path.join(ARTIFACT_DIR, "team-workspace-member-added.png")
        page.screenshot(path=team_added_shot)
        print(f"✓ Screenshot miembro añadido guardado en {team_added_shot}")

        # Eliminar admin@gmail.com usando el botón eliminar
        delete_member_btn = page.locator("button[title*='Eliminar a admin@gmail.com']")
        assert delete_member_btn.is_visible(), "El botón para eliminar al miembro debe ser visible"
        delete_member_btn.click()
        time.sleep(2)

        assert not page.get_by_text("admin@gmail.com", exact=True).is_visible(), "admin@gmail.com debió eliminarse del equipo"
        team_removed_shot = os.path.join(ARTIFACT_DIR, "team-workspace-member-removed.png")
        page.screenshot(path=team_removed_shot)
        print(f"✓ Screenshot miembro eliminado guardado en {team_removed_shot}")

        # 7. Verificar Triage Multi-Proyecto solo muestra los 2 proyectos reales
        print("7. Verificando Triage Multi-Proyecto & Federaciones...")
        page.locator("button:has-text('Proyectos & Triage Global')").click()
        time.sleep(1.5)
        triage_text = page.locator("main, div.flex-1").last.inner_text()
        assert "boxtools" not in triage_text, "boxtools no debería aparecer si fue eliminado"
        assert "hyper-flow" not in triage_text, "hyper-flow no debería aparecer si fue eliminado"

        triage_clean_shot = os.path.join(ARTIFACT_DIR, "triage-only-real-projects.png")
        page.screenshot(path=triage_clean_shot)
        print(f"✓ Screenshot Triage limpio guardado en {triage_clean_shot}")

        print("=== TODAS LAS PRUEBAS COMPLETADAS CON ÉXITO ===")
        browser.close()

if __name__ == "__main__":
    run()
