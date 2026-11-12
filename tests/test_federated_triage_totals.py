import os
import time
from playwright.sync_api import sync_playwright

ARTIFACT_DIR = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd"

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 850})
        page = context.new_page()

        print("1. Navegando a localhost:3001...")
        page.goto("http://localhost:3001/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        if page.locator("text=Iniciar Sesión").is_visible():
            print("2. Iniciando sesión como martingt010@gmail.com...")
            page.locator("button:has-text('Iniciar Sesión')").click()
            time.sleep(0.3)
            page.locator("input[type='email']").fill("martingt010@gmail.com")
            page.locator("input[type='password']").fill("Martin/123")
            page.locator("button:has-text('Iniciar Sesión en Supabase')").click()
            time.sleep(3)
            page.wait_for_load_state("networkidle")

        page.wait_for_selector("[data-testid='sidebar']", timeout=10000)
        time.sleep(1)

        sidebar_w = page.evaluate("() => document.querySelector('[data-testid=\"sidebar\"]').getBoundingClientRect().width")
        if sidebar_w == 0:
            print("Expandiendo sidebar...")
            page.keyboard.press("Control+b")
            time.sleep(0.5)

        print("3. Abriendo Proyectos & Triage Global...")
        page.locator("button:has-text('Proyectos & Triage Global')").click()
        time.sleep(2)
        page.wait_for_load_state("networkidle")

        # Limpiar residuos previos si existieran
        while page.locator("span:has-text('__E2E_FEDERATED_TRIAGE_')").count() > 0:
            page.locator("span:has-text('__E2E_FEDERATED_TRIAGE_')").first.click()
            time.sleep(0.8)
            page.locator("[data-testid='issue-detail-drawer'] button[title='Eliminar este issue (CRUD)']").click()
            time.sleep(0.4)
            page.locator("button:has-text('Sí, Eliminar')").click()
            time.sleep(1.5)

        test_title = f"__E2E_FEDERATED_TRIAGE_{int(time.time())}__"
        try:
            # Crear issue temporal en ExamenesIAForms desde el creador rápido de Triage
            print("4. Creando issue temporal en 'sendeiser/ExamenesIAForms'...")
            proj_select = page.locator("form select").first
            proj_select.select_option(value="sendeiser/ExamenesIAForms")
            page.locator("input[placeholder*='Título del nuevo issue']").fill(test_title)
            page.locator("button:has-text('Enviar Issue')").click()
            time.sleep(2.5)
            page.wait_for_load_state("networkidle")

            # Cambiar el repo activo en el modal de Workspaces a SecuenciaDidacticaAI (que tiene 0 issues)
            print("5. Cambiando repo activo en modal Workspaces a 'sendeiser/SecuenciaDidacticaAI'...")
            page.locator("header button[title='Cambiar repositorio o workspace']").click()
            time.sleep(1.2)
            page.locator("button:has-text('sendeiser/SecuenciaDidacticaAI')").click()
            time.sleep(2)
            page.wait_for_load_state("networkidle")

            # Asegurar que el modal se cerró
            if page.locator("text=Workspaces de Equipo (Supabase Cloud — boxtools)").is_visible():
                page.keyboard.press("Escape")
                time.sleep(0.5)

            # Verificar que en Triage Multi-Proyecto siguen saliendo TODOS los issues federados
            todos_btn_text = page.locator("button:has-text('Todos (')").inner_text()
            print(f"Botón Todos muestra: {todos_btn_text}")
            assert "Todos (2)" in todos_btn_text or "Todos (0)" not in todos_btn_text, f"Todos no debe mostrar 0! Mostró: {todos_btn_text}"

            ponele_card_text = page.locator("[data-testid='project-card-sendeiser/PonelePlay']").inner_text()
            examenes_card_text = page.locator("[data-testid='project-card-sendeiser/ExamenesIAForms']").inner_text()
            print("PonelePlay card:", ponele_card_text.replace("\n", " | "))
            print("ExamenesIAForms card:", examenes_card_text.replace("\n", " | "))

            assert "Progreso (0/1)" in ponele_card_text, f"PonelePlay debe mostrar Progreso (0/1), obtuvo: {ponele_card_text}"
            assert "Progreso (0/1)" in examenes_card_text, f"ExamenesIAForms debe mostrar Progreso (0/1), obtuvo: {examenes_card_text}"
            assert test_title in page.content(), "El issue creado en ExamenesIAForms debe verse en la tabla federada"

            shot = os.path.join(ARTIFACT_DIR, "triage-federated-all-repos.png")
            page.screenshot(path=shot)
            print(f"✓ Screenshot guardado en {shot}")
        finally:
            print("6. Limpiando issue de prueba y restaurando repo activo...")
            while page.locator("span:has-text('__E2E_FEDERATED_TRIAGE_')").count() > 0:
                page.locator("span:has-text('__E2E_FEDERATED_TRIAGE_')").first.click()
                time.sleep(0.8)
                page.locator("[data-testid='issue-detail-drawer'] button[title='Eliminar este issue (CRUD)']").click()
                time.sleep(0.4)
                page.locator("button:has-text('Sí, Eliminar')").click()
                time.sleep(1.5)

            page.locator("header button[title='Cambiar repositorio o workspace']").click()
            time.sleep(1.2)
            page.locator("button:has-text('sendeiser/PonelePlay')").click()
            time.sleep(1)

        browser.close()
        print("✓ Verificación E2E de Triage Federado Multi-Proyecto completada con éxito.")

if __name__ == "__main__":
    run()
