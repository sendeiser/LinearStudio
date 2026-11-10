# SPEC MAESTRO: SISTEMA COLABORATIVO DE PROYECTOS E ISSUES CON GITHUB API, ANTIGRAVITY & IA (ESTILO LINEAR / GITHUB PROJECTS)
**Versión:** 1.2.0  
**Fecha:** 2026-11-10  
**Estado:** Actualizado con Dual-Theme (Light/Dark) e Integración Antigravity & IA  
**Documento:** `docs/specs/01-arquitectura-y-spec.md`  

---

## 1. VISIÓN GENERAL Y ALCANCE FUNCIONAL

El sistema es una aplicación web colaborativa de ingeniería para la gestión de proyectos y tareas (issues) conectada directamente con la **API de GitHub (REST / Octokit)**, respaldada en **Supabase Cloud (PostgreSQL)** y potenciada con **Asistentes de Inteligencia Artificial y el Ecosistema Antigravity**.

### Principios Fundamentales:
1. **Conexión Directa con GitHub (Single Source of Truth):**
   - Autenticación vía **GitHub OAuth**.
   - Acceso a repositorios, issues, pull requests, hitos y etiquetas en tiempo real.
2. **Dual-Theme Engine Nativo (Modo Claro & Modo Oscuro):**
   - **Light Mode:** Canvas blanco puro (`#ffffff`) y gris suave (`#f6f8fa`), bordes nítidos (`#d0d7de`), tipografía de alto contraste (`#1f2328`) y badges semánticos GitHub.
   - **Dark Mode:** Canvas oscuro profundo (`#090d16`), tarjetas slate elevadas (`#111827`), bordes sutiles (`#243044`) y acentos de color de precisión.
   - Selector de tema accesible con persistencia en `localStorage`.
3. **Integración con Antigravity & Inteligencia Artificial (AI Copilot):**
   - **Botón "Resolver con Antigravity":** Permite al desarrollador delegar la resolución de un issue directamente a un agente Antigravity mediante la CLI `agy` o la API de agentes, clonando la rama y ejecutando TDD.
   - **AI Auto-Triage & Smart Labels:** La IA analiza el reporte de error o requerimiento, sugiere etiquetas, asignados, prioridad y estimación en puntos.
   - **AI Issue-to-PR Generator:** Redacción automática de resúmenes de PR y notas de versión cruzadas con los commits.
4. **Persistencia y Colaboración en Supabase Cloud (Sin Docker):**
   - Workspaces, mapeo de tableros Kanban, notas internas del equipo y configuración de prompts de IA con seguridad RLS.

---

## 2. PILA TECNOLÓGICA FORMAL

| Capa / Subsistema | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Frontend Core** | React 18 / 19 + TypeScript | SPA de alta reactividad, tipado estricto extremo con `@octokit/openapi-types`. |
| **Bundler & Dev Server** | Vite 5+ | Compilación instantánea y HMR optimizado. |
| **Sistema de Estilos** | Tailwind CSS con selector `.dark` | Doble paleta completa con tokens de Modo Claro y Modo Oscuro. |
| **Cliente GitHub API** | `@octokit/rest` + Octokit Webhooks | Cliente oficial tipado para todas las operaciones sobre issues y PRs. |
| **Integración IA & Antigravity** | Google Antigravity SDK + Gemini API (`@google/genai`) | Ejecución de triage automático, asistencia contextual y puente de comandos CLI (`agy`). |
| **Caché y Sincronización** | TanStack Query (React Query) | Mutaciones optimistas en tablero y revalidación en segundo plano. |
| **Estado Local de UI** | Zustand | Almacenamiento de filtros activos, estado del tema (light/dark) y drawer. |
| **Drag & Drop** | `@hello-pangea/dnd` | Arrastrar y soltar accesible con soporte táctil. |
| **Iconografía** | Lucide React / Material Symbols | Iconos vectoriales de desarrollo, ramas, PRs, estrellas y chips de IA. |
| **Backend & Base de Datos** | Supabase Cloud (PostgreSQL 15+) | Almacenamiento relacional de metadatos, historial de IA y RLS. |
| **E2E & Diagnóstico Visual** | Playwright v1.60+ | Pruebas visuales y funcionales en Desktop (1440px), Tablet (768px) y Mobile (375px). |

---

## 3. ESPECIFICACIÓN DEL MÓDULO DE IA & ANTIGRAVITY

### 3.1. Acciones y Capacidades del Agente
1. **Acción "Resolver con Antigravity" (`[✦ Resolver con Antigravity]`):**
   - Ubicada en la barra de herramientas del Drawer de detalle del issue.
   - Al pulsar, genera la instrucción contextual para el agente:
     ```bash
     agy --prompt "Resuelve el issue #104: Optimize WebGL canvas render loop for 60fps. Crea la rama perf/webgl-loop-opt, añade tests TDD y abre un PR."
     ```
   - Muestra el estado del agente en tiempo real: *Iniciando sandbox -> Ejecutando tests -> PR Listo*.
2. **AI Auto-Triage & Resumen de Hilos:**
   - Botón *✦ Resumir Discusión*: Genera un resumen ejecutivo de comentarios largos de GitHub destacando decisiones técnicas y bloqueantes.
   - Autocompletado inteligente de subtareas y checklist técnico.
3. **Generador de PR a partir de Issues:**
   - Sintetiza la descripción del issue, rama activa y commits para generar el PR listo con el texto `fixes #<issue_number>`.

---

## 4. INVENTARIO COMPLETO DE PANTALLAS Y COMPONENTES UI

### 4.1. Shell Global
- **Sidebar (Modo Claro & Oscuro con Drawer Mobile):**
  - Selector de Workspace y Repositorio.
  - Navegación: *Tablero Kanban, Lista, Hitos, PRs, Asistente Antigravity, Configuración*.
  - Indicador de cuota de API GitHub y estado de conexión IA.
  - Perfil de usuario con avatar y rol.
- **Topbar:**
  - Buscador global `Ctrl+K`.
  - **Selector de Tema (Botón Sol / Luna):** Alterna instantáneamente entre Modo Claro y Modo Oscuro con transición suave.
  - Botón de Sincronización con GitHub.
  - Botón primario `+ Nuevo Issue`.

### 4.2. Vistas Principales
- **Vista Tablero Kanban:**
  - En Desktop/Tablet: 6 columnas (`Backlog`, `Por Hacer`, `En Progreso`, `En Revisión`, `Completado`) con Drag & Drop.
  - En Mobile (< 768px): Pestañas superiores de columnas donde la seleccionada ocupa el 100% de la pantalla con tarjetas grandes, touch-friendly, y botón flotante FAB.
- **Drawer de Detalle del Issue:**
  - Encabezado con estado, número, enlace a GitHub y botón **✦ Antigravity Copilot**.
  - Markdown interactivo con syntax highlighting para código.
  - Checklist interactivo y módulo de comentarios.
  - Sección de automatizaciones de IA (sugerencia de etiquetas, estimación de esfuerzo).
- **Modal de Creación de Issue:**
  - Formulario con auto-sugerencias de IA en el título y selector de plantilla de GitHub (*Bug*, *Feature*, *Chore*).

---

## 5. ESQUEMA DE DATOS EN SUPABASE CLOUD (SIN DOCKER)

```sql
-- 1. Espacios de trabajo (Workspaces)
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Repositorios Vinculados
CREATE TABLE linked_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    github_repo_id BIGINT NOT NULL,
    full_name TEXT NOT NULL,
    default_branch TEXT NOT NULL DEFAULT 'main',
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    ai_settings JSONB DEFAULT '{"auto_triage": true, "antigravity_bridge": true}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, github_repo_id)
);

-- 3. Columnas del Tablero
CREATE TABLE kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES linked_repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    github_state TEXT NOT NULL DEFAULT 'open',
    filter_label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Metadatos de Equipo e Historial de IA / Antigravity
CREATE TABLE issue_team_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_repo_id BIGINT NOT NULL,
    issue_number INT NOT NULL,
    story_points INT DEFAULT NULL,
    internal_notes TEXT DEFAULT '',
    ai_summary TEXT DEFAULT NULL,
    antigravity_task_id TEXT DEFAULT NULL,
    antigravity_status TEXT DEFAULT 'idle', -- 'idle', 'running', 'pr_ready', 'error'
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(github_repo_id, issue_number)
);

-- 5. Sesiones de Asistencia de IA
CREATE TABLE ai_agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id INT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    agent_type TEXT NOT NULL DEFAULT 'antigravity',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POLÍTICAS RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_team_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_logs ENABLE ROW LEVEL SECURITY;
```

---

## 6. MATRIZ DE PRUEBAS DE VERIFICACIÓN (PLAYWRIGHT)

| ID Test | Escenario y Flujo | Viewport | Criterio de Aprobación |
| :--- | :--- | :--- | :--- |
| **TC-01** | Conmutación de Tema Light ↔ Dark | Desktop (1440x900) | Al pulsar el botón de tema, cambia la clase `.dark`, los fondos se adaptan instantáneamente y se preserva en `localStorage`. |
| **TC-02** | Navegación Mobile-First por Pestañas | Mobile (375x812) | Al tocar cada pestaña de columna (`Por Hacer`, `En Progreso`), se visualiza la columna al 100% de ancho con cero desbordamiento horizontal. |
| **TC-03** | Interacción con Antigravity AI Bridge | Desktop (1440x900) | Al hacer clic en `✦ Resolver con Antigravity` en el Drawer, se muestra la tarjeta de despacho de tarea con indicador de estado agéntico. |
| **TC-04** | Creación y Drag & Drop de Issue | Desktop & Mobile | Funcionalidad intacta tanto en tema claro como en tema oscuro. |
