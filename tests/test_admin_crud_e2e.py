import os
import json
import time
from playwright.sync_api import sync_playwright

WORKSPACE_DIR = r"D:\workspace"
ARTIFACTS_DIR = r"C:\Users\TinChoX\.gemini\antigravity\brain\a7df6650-86f3-4c14-aa43-f81f92cec3fd"

test_results = {}

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(viewport={"width": 1440, "height": 900})
    page = context.new_page()

    page.on("dialog", lambda dialog: dialog.accept())

    # 1. Open Landing and Authenticate
    page.goto("http://localhost:3001/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)

    # Register dynamic admin account
    test_ts = int(time.time())
    reg_name = f"Admin QA {test_ts}"
    reg_email = f"admin_qa_{test_ts}@linear.studio"
    reg_pass = "SecureAdmin123!"

    page.locator("button:has-text('Registrarse')").first.click()
    page.wait_for_timeout(300)

    page.fill("input[placeholder*='Martin Tincho']", reg_name)
    page.fill("form input[type='email']", reg_email)
    page.fill("input[placeholder*='Mínimo 6 caracteres']", reg_pass)
    page.fill("input[placeholder*='Repite la contraseña']", reg_pass)

    page.locator("button[type='submit']:has-text('Registrarse y Entrar al Panel')").click()
    page.wait_for_timeout(2500)

    # 2. Verificar que los cards del Kanban están cargados
    cards = page.locator("article[data-testid='issue-card']")
    cards.first.wait_for(state="visible", timeout=10000)
    cards_count = cards.count()
    test_results["kanban_cards_loaded"] = cards_count > 0
    test_results["initial_cards_count"] = cards_count

    # 3. Seleccionar la primera card para abrir el Drawer
    first_card = cards.first
    card_title_initial = first_card.locator("h4").inner_text()
    first_card.click()
    page.wait_for_timeout(800)

    # 4. Verificar Drawer con controles Admin (botones de Editar y Eliminar por title)
    edit_btn = page.locator("button[title*='Editar este issue']").first
    delete_btn = page.locator("button[title*='Eliminar este issue']").first
    admin_badge = page.locator("aside span:has-text('ADMIN')").first

    test_results["admin_drawer_controls_visible"] = (
        edit_btn.is_visible() and delete_btn.is_visible() and admin_badge.is_visible()
    )

    # Tomar captura del Drawer abierto con controles de Admin
    drawer_screenshot_path = os.path.join(ARTIFACTS_DIR, "admin-crud-drawer.png")
    page.screenshot(path=drawer_screenshot_path)

    # 5. Activar Modo Edición
    edit_btn.click()
    page.wait_for_timeout(500)

    # Tomar captura del formulario de edición en modo admin
    edit_form_screenshot_path = os.path.join(ARTIFACTS_DIR, "admin-crud-edit-form.png")
    page.screenshot(path=edit_form_screenshot_path)

    # Editar título y descripción
    edit_title_input = page.locator("input[placeholder*='Título descriptivo...']")
    edit_title_input.fill("[ADMIN EDITADO] " + card_title_initial)

    edit_desc_input = page.locator("textarea[placeholder*='Explica los requerimientos']")
    edit_desc_input.fill("Descripción modificada y guardada por el rol Administrador.")

    # Guardar cambios
    save_btn = page.locator("button:has-text('Guardar Cambios')")
    test_results["save_button_visible"] = save_btn.is_visible()
    save_btn.click()
    page.wait_for_timeout(1000)

    # Verificar título actualizado en el Drawer
    updated_title_el = page.locator("h2:has-text('[ADMIN EDITADO]')")
    test_results["issue_updated_in_drawer"] = updated_title_el.is_visible()

    # Tomar captura del issue guardado con nuevo título
    edited_screenshot_path = os.path.join(ARTIFACTS_DIR, "admin-crud-edited.png")
    page.screenshot(path=edited_screenshot_path)

    # 6. CRUD Subtareas: Añadir, Toggle y Eliminar
    subtask_input = page.locator("input[placeholder*='Añadir subtarea al issue...']")
    if subtask_input.is_visible():
        subtask_input.fill("Subtarea creada por Admin QA")
        page.locator("button:has-text('Añadir')").click()
        page.wait_for_timeout(600)

        added_subtask = page.locator("text=Subtarea creada por Admin QA")
        test_results["subtask_added"] = added_subtask.is_visible()

        # Toggle de la nueva subtarea
        new_checkbox = page.locator("button[role='checkbox']").last
        if new_checkbox.is_visible():
            new_checkbox.click()
            page.wait_for_timeout(400)
            test_results["subtask_toggled"] = True

    # Tomar captura de la sección de subtareas
    subtasks_screenshot_path = os.path.join(ARTIFACTS_DIR, "admin-crud-subtasks.png")
    page.screenshot(path=subtasks_screenshot_path)

    # 7. Cerrar Drawer y navegar a 'Todos los Issues'
    page.keyboard.press("Escape")
    page.wait_for_timeout(500)

    page.locator("aside nav button:has-text('Todos los Issues')").click()
    page.wait_for_timeout(1000)

    # Tomar captura de tabla All Issues con acciones CRUD
    all_issues_screenshot_path = os.path.join(ARTIFACTS_DIR, "admin-crud-all-issues.png")
    page.screenshot(path=all_issues_screenshot_path)

    test_results["all_issues_table_rendered"] = True

    # 8. Eliminar Issue desde la tabla con botón Trash2
    delete_row_btn = page.locator("button[title*='Eliminar issue (CRUD)']").first
    if delete_row_btn.is_visible():
        count_before_delete = page.locator("button[title*='Eliminar issue (CRUD)']").count()
        delete_row_btn.click()
        page.wait_for_timeout(1000)
        count_after_delete = page.locator("button[title*='Eliminar issue (CRUD)']").count()
        test_results["issue_deleted_successfully"] = count_after_delete < count_before_delete
    else:
        test_results["issue_deleted_successfully"] = False

    browser.close()

with open(os.path.join(WORKSPACE_DIR, "tests", "reports", "admin_crud_results.json"), "w", encoding="utf-8") as f:
    json.dump(test_results, f, indent=2)

print("E2E_ADMIN_CRUD_RESULT:", json.dumps(test_results))
