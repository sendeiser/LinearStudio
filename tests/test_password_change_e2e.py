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

    # 1. Open Landing and test Forgot Password flow
    page.goto("http://localhost:3001/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)

    # Click Iniciar Sesión tab
    page.locator("button:has-text('Iniciar Sesión')").click()
    page.wait_for_timeout(400)

    # Click '¿Olvidaste tu contraseña?'
    forgot_btn = page.locator("button:has-text('¿Olvidaste tu contraseña?')")
    test_results["forgot_password_button_present"] = forgot_btn.is_visible()
    if forgot_btn.is_visible():
        forgot_btn.click()
        page.wait_for_timeout(400)
        
        # Verify forgot mode
        header_forgot = page.locator("h2:has-text('Recuperar Contraseña')")
        test_results["recovery_form_rendered"] = header_forgot.is_visible()

        # Take screenshot of password recovery form
        landing_rec_path = os.path.join(ARTIFACTS_DIR, "landing-password-recovery.png")
        page.screenshot(path=landing_rec_path)

        # Return to signin
        page.locator("button:has-text('Volver a Iniciar Sesión')").first.click()
        page.wait_for_timeout(400)

    # 2. Register dynamic account to enter panel
    test_ts = int(time.time())
    reg_name = f"User Sec {test_ts}"
    reg_email = f"user_sec_{test_ts}@linear.studio"
    initial_pass = "InitialPass123!"

    page.locator("button:has-text('Registrarse')").first.click()
    page.wait_for_timeout(300)

    page.fill("input[placeholder*='Martin Tincho']", reg_name)
    page.fill("form input[type='email']", reg_email)
    page.fill("input[placeholder*='Mínimo 6 caracteres']", initial_pass)
    page.fill("input[placeholder*='Repite la contraseña']", initial_pass)

    page.locator("button[type='submit']:has-text('Registrarse y Entrar al Panel')").click()
    page.wait_for_timeout(2500)

    # 3. Navegar a Configuración & Auth
    page.locator("aside nav button:has-text('Configuración & Auth')").click()
    page.wait_for_timeout(1000)

    # 4. Verificar presencia de la tarjeta 'Seguridad & Cambiar Contraseña'
    sec_header = page.locator("span:has-text('Seguridad & Cambiar Contraseña')").first
    test_results["change_password_card_visible"] = sec_header.is_visible()

    # Tomar captura de Configuración con la tarjeta de Cambio de Contraseña
    settings_pass_path = os.path.join(ARTIFACTS_DIR, "settings-password-change-card.png")
    page.screenshot(path=settings_pass_path)

    # 5. Probar validación de contraseñas no coincidentes
    pass_inputs = page.locator("input[placeholder*='Mínimo 6 caracteres']")
    # In settings, find the new password inputs
    new_pass_input = page.locator("input[placeholder='Mínimo 6 caracteres']").first
    confirm_pass_input = page.locator("input[placeholder='Repite la nueva contraseña']").first

    if new_pass_input.is_visible() and confirm_pass_input.is_visible():
        new_pass_input.fill("PasswordMismatch123!")
        confirm_pass_input.fill("DifferentPass456!")
        page.locator("button:has-text('Actualizar Contraseña')").click()
        page.wait_for_timeout(500)

        mismatch_banner = page.locator("text=Las nuevas contraseñas no coinciden")
        test_results["mismatch_validation_active"] = mismatch_banner.is_visible()

        # 6. Actualizar con contraseñas coincidentes válidas
        updated_password = "NewUpdatedSecurePass2026!"
        new_pass_input.fill(updated_password)
        confirm_pass_input.fill(updated_password)
        page.locator("button:has-text('Actualizar Contraseña')").click()
        page.wait_for_timeout(2000)

        # Verificar feedback de éxito
        success_msg = page.locator("text=Contraseña actualizada correctamente")
        test_results["password_updated_successfully"] = success_msg.is_visible()

        # Tomar captura del éxito
        success_path = os.path.join(ARTIFACTS_DIR, "settings-password-changed-success.png")
        page.screenshot(path=success_path)
    else:
        test_results["password_updated_successfully"] = False

    browser.close()

with open(os.path.join(WORKSPACE_DIR, "tests", "reports", "password_change_results.json"), "w", encoding="utf-8") as f:
    json.dump(test_results, f, indent=2)

print("E2E_PASSWORD_CHANGE_RESULT:", json.dumps(test_results))
