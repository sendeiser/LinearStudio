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

    # Intercept GitHub API calls to mock user repos and issues reliably in testing
    def handle_github_api(route):
        url = route.request.url
        if "api.github.com/user/repos" in url:
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps([
                    {
                        "id": 890123,
                        "name": "LinearStudio",
                        "full_name": "sendeiser/LinearStudio",
                        "private": False,
                        "description": "Federated multi-project issue tracker with Supabase Cloud & GitHub sync",
                        "html_url": "https://github.com/sendeiser/LinearStudio",
                        "open_issues_count": 8,
                        "stargazers_count": 14,
                        "default_branch": "main",
                        "updated_at": "2026-11-10T20:50:00Z",
                        "owner": {"login": "sendeiser", "avatar_url": "https://avatars.githubusercontent.com/u/101010"}
                    },
                    {
                        "id": 890124,
                        "name": "boxtools-api",
                        "full_name": "sendeiser/boxtools-api",
                        "private": True,
                        "description": "Core services and API infrastructure",
                        "html_url": "https://github.com/sendeiser/boxtools-api",
                        "open_issues_count": 3,
                        "stargazers_count": 2,
                        "default_branch": "main",
                        "updated_at": "2026-11-09T14:20:00Z",
                        "owner": {"login": "sendeiser", "avatar_url": "https://avatars.githubusercontent.com/u/101010"}
                    },
                    {
                        "id": 890125,
                        "name": "hyper-flow",
                        "full_name": "sendeiser/hyper-flow",
                        "private": False,
                        "description": "High performance stream pipeline",
                        "html_url": "https://github.com/sendeiser/hyper-flow",
                        "open_issues_count": 12,
                        "stargazers_count": 45,
                        "default_branch": "main",
                        "updated_at": "2026-11-08T11:00:00Z",
                        "owner": {"login": "sendeiser", "avatar_url": "https://avatars.githubusercontent.com/u/101010"}
                    }
                ])
            )
        elif "api.github.com/user" in url and "repos" not in url:
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps({
                    "login": "sendeiser",
                    "id": 101010,
                    "avatar_url": "https://avatars.githubusercontent.com/u/101010",
                    "name": "Sendeiser Dev",
                    "bio": "Full-stack builder",
                    "public_repos": 18,
                    "html_url": "https://github.com/sendeiser"
                })
            )
        elif "api.github.com/repos" in url and "/issues" in url:
            route.fulfill(
                status=200,
                content_type="application/json",
                body=json.dumps([
                    {
                        "number": 1,
                        "title": "Configurar selector de repositorios en Settings",
                        "body": "Permitir al usuario elegir qué repo sincronizar.\n\n- [x] Mock API\n- [ ] UI Selector",
                        "state": "open",
                        "labels": [{"name": "enhancement"}, {"name": "high"}],
                        "user": {"login": "sendeiser"},
                        "created_at": "2026-11-10T12:00:00Z",
                        "updated_at": "2026-11-10T15:00:00Z"
                    },
                    {
                        "number": 2,
                        "title": "Optimizar consultas RLS de boxtools",
                        "body": "Analizar índices en ls_issues",
                        "state": "open",
                        "labels": [{"name": "performance"}, {"name": "urgent"}],
                        "user": {"login": "sendeiser"},
                        "created_at": "2026-11-09T10:00:00Z",
                        "updated_at": "2026-11-10T09:00:00Z"
                    }
                ])
            )
        else:
            route.continue_()

    page.route("**/api.github.com/**", handle_github_api)

    # 1. Open Landing and Authenticate
    page.goto("http://localhost:3001/")
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(800)

    # Register dynamic account in Supabase Cloud
    test_ts = int(time.time())
    reg_name = f"QA Sendeiser {test_ts}"
    reg_email = f"qa_sendeiser_{test_ts}@linear.studio"
    reg_pass = "SecurePass123!"

    page.locator("button:has-text('Registrarse')").first.click()
    page.wait_for_timeout(300)

    page.fill("input[placeholder*='Martin Tincho']", reg_name)
    page.fill("form input[type='email']", reg_email)
    page.fill("input[placeholder*='Mínimo 6 caracteres']", reg_pass)
    page.fill("input[placeholder*='Repite la contraseña']", reg_pass)

    page.locator("button[type='submit']:has-text('Registrarse y Entrar al Panel')").click()
    page.wait_for_timeout(3000)

    # 2. Navegar a Configuración & Auth
    page.locator("aside nav button:has-text('Configuración & Auth')").click()
    page.wait_for_timeout(1000)

    # 3. Vincular GitHub PAT
    pat_input = page.locator("input[placeholder*='ghp_']")
    if pat_input.is_visible():
        pat_input.fill("ghp_valid_mock_token_secret_123")
        page.locator("button:has-text('Vincular API Key de GitHub')").click()
        page.wait_for_timeout(2000)

    # 4. Verificar que se muestra la tarjeta de GitHub y el Selector de Repositorios
    user_card = page.locator("text=@sendeiser").first
    test_results["github_user_connected"] = user_card.is_visible()

    repo_selector = page.locator("select:has-text('LinearStudio')")
    test_results["repo_selector_rendered"] = repo_selector.is_visible()

    # Seleccionar sendeiser/LinearStudio
    if repo_selector.is_visible():
        repo_selector.select_option("sendeiser/LinearStudio")
        page.wait_for_timeout(500)

    # Verificar metadata card del repo seleccionado
    meta_card = page.locator("text=sendeiser/LinearStudio")
    test_results["selected_repo_meta_visible"] = meta_card.count() > 0

    # 5. Tomar screenshot de la sección de GitHub con el selector
    selector_screenshot_path = os.path.join(ARTIFACTS_DIR, "github-repo-selector.png")
    page.screenshot(path=selector_screenshot_path, full_page=True)

    # 6. Sincronizar issues
    sync_btn = page.locator("button:has-text('Sincronizar Issues')")
    test_results["sync_button_present"] = sync_btn.is_visible()
    
    if sync_btn.is_visible():
        sync_btn.click()
        page.wait_for_timeout(3000)

    # Verificar feedback de éxito
    success_banner = page.locator("text=sincronizados exitosamente")
    test_results["sync_success_displayed"] = success_banner.is_visible()

    # Botón Ver en Tablero Activo
    board_btn = page.locator("button:has-text('Ver en Tablero Activo')")
    test_results["board_cta_visible"] = board_btn.is_visible()

    if board_btn.is_visible():
        board_btn.click()
        page.wait_for_timeout(1500)
        # Tomar captura del tablero con los issues sincronizados
        board_screenshot_path = os.path.join(ARTIFACTS_DIR, "board-after-github-sync.png")
        page.screenshot(path=board_screenshot_path, full_page=True)
        test_results["board_navigated"] = True
    else:
        test_results["board_navigated"] = False

    browser.close()

with open(os.path.join(WORKSPACE_DIR, "tests", "reports", "github_repo_selector_results.json"), "w", encoding="utf-8") as f:
    json.dump(test_results, f, indent=2)

print("E2E_GITHUB_SELECTOR_TEST_RESULT:", json.dumps(test_results))
