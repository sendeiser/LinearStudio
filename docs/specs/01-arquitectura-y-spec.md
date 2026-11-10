# SPEC MAESTRO: SISTEMA COLABORATIVO DE PROYECTOS E ISSUES CON GITHUB API (ESTILO LINEAR / GITHUB PROJECTS)
**Versión:** 1.1.0  
**Fecha:** 2026-11-10  
**Estado:** Listo para Aprobación del Usuario  
**Documento:** `docs/specs/01-arquitectura-y-spec.md`  

---

## 1. VISIÓN GENERAL Y ALCANCE FUNCIONAL

El sistema es una aplicación web colaborativa de alto rendimiento orientada a equipos de ingeniería que sincroniza e interactúa directamente con la **API de GitHub (REST / Octokit)** y gestiona el ciclo de vida de proyectos y tareas (issues) bajo una experiencia moderna similar a **Linear** y **GitHub Projects**.

### Principios Fundamentales:
1. **Conexión Directa con GitHub (Single Source of Truth):**
   - Autenticación vía **GitHub OAuth**.
   - Acceso a repositorios públicos y privados de las organizaciones o cuentas del usuario.
   - Sincronización bidireccional de issues: crear, editar título/cuerpo, asignar colaboradores, añadir etiquetas (labels), hitos (milestones) y cerrar/reabrir issues directamente en GitHub.
2. **Tableros Flexibles y Metadatos de Equipo:**
   - Visualización en **Tablero Kanban Drag & Drop** donde las columnas pueden asociarse a estados nativos de GitHub (`open`/`closed`) o a etiquetas de flujo (*Backlog, Todo, In Progress, In Review, Done*).
   - Vista de **Lista Tabular de Alta Densidad** con filtrado instantáneo en memoria mediante TanStack Query y Fuse/búsqueda rápida.
3. **Persistencia y Colaboración en Supabase Cloud (Sin Docker):**
   - Gestión de espacios de trabajo del equipo (*Workspaces*), roles internos (*Admin, Developer, Viewer*), tableros personalizados, caché de datos para modo offline/rápido y metadatos complementarios (estimaciones en puntos de historia, notas de equipo).
   - Políticas de seguridad a nivel de fila (**Row Level Security - RLS**) para aislar la información de cada equipo.

---

## 2. PILA TECNOLÓGICA FORMAL

| Capa / Subsistema | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Frontend Core** | React 18 / 19 + TypeScript | SPA de alta reactividad, tipado estricto extremo para los tipos de la API de GitHub (`@octokit/openapi-types`). |
| **Bundler & Dev Server** | Vite 5+ | Inicio en milisegundos, HMR ultraveloz y bundles optimizados. |
| **Sistema de Diseño y CSS** | Tailwind CSS v3 / v4 | Utilidades atómicas, paleta de neutrales oscuros y adaptabilidad responsive completa. |
| **Cliente de GitHub API** | `@octokit/rest` + Octokit Webhooks | Cliente oficial tipado para todas las operaciones sobre issues, repositorios, pull requests y comentarios. |
| **Caché y Sincronización** | TanStack Query (React Query) | Mutaciones optimistas (las tarjetas se mueven instantáneamente en el Kanban y se sincronizan en segundo plano), revalidación automática y deduplicación de peticiones. |
| **Estado Local de UI** | Zustand | Gestión de filtros activos, modales, vistas seleccionadas y estado del Drawer sin renderizados innecesarios. |
| **Drag & Drop** | `@hello-pangea/dnd` | Motor de arrastrar y soltar accesible, con soporte táctil en tablets y animaciones sin jank. |
| **Iconografía** | Lucide React | Iconos SVG optimizados para herramientas de software (GitPullRequest, GitFork, AlertCircle, CheckCircle2, Tag, Kanban, etc.). |
| **Backend & Base de Datos** | Supabase Cloud (PostgreSQL 15+) | Almacenamiento de Workspaces, miembros, configuración de columnas Kanban, caché de issues y tokens de OAuth con RLS estricto. |
| **E2E & Diagnóstico Visual** | Playwright v1.60+ | Pruebas funcionales y capturas en 3 resoluciones: Desktop (1440px), Tablet (768px) y Mobile (375px). |

---

## 3. ESTRATEGIA DE DISEÑO UI/UX: DÚO DINÁMICO ⭐ (OPCIÓN 3)

Se utiliza la combinación entre **`ui-ux-pro-max`** (inteligencia de nicho) y **`frontend-design`** (estructura formal de tokens y prompt para Google Stitch):

### 3.1. Inteligencia Heurística de Nicho (`ui-ux-pro-max`)
- **Estética:** *Modern Dark Developer Studio* (Inspirado en GitHub Dark Mode y Linear App).
- **Paleta Cromática (Tokens Hexadecimales):**
  - Fondo Base (`bg-background`): `#0d1117` (GitHub Dark canvas).
  - Superficie Elevada (`bg-surface`): `#161b22` (Contenedores y tarjetas).
  - Borde Sutil (`border-subtle`): `#30363d` (Bordes de inputs y divisiones).
  - Borde Activo / Foco (`border-focus`): `#58a6ff` (Azul GitHub Focus).
  - Texto Primario (`text-primary`): `#f0f6fc` (Contraste 13:1 con el fondo).
  - Texto Secundario (`text-secondary`): `#8b949e` (Metadatos e IDs).
  - **Acentos Semánticos para Issues y Estados:**
    - Issue Abierto: `#3fb950` (Verde GitHub Open).
    - Issue Cerrado / Hecho: `#a371f7` (Púrpura GitHub Closed).
    - Prioridad Urgente / Bloqueante: `#f85149` (Rojo).
    - Prioridad Alta: `#d29922` (Ámbar).
    - Prioridad Media: `#388bfd` (Azul).
    - Prioridad Baja / Backlog: `#8b949e` (Gris).
- **Tipografía:**
  - UI y Lectura: `Inter`, `-apple-system`, `system-ui`.
  - Código, Commits e Identificadores (`#142`, `feat/auth`): `JetBrains Mono`, `ui-monospace`.
- **Accesibilidad:** WCAG 2.1 AAA en ratios de contraste y áreas táctiles mínimas de 44x44px.

### 3.2. Estructuración Formal (`frontend-design`)
- Escala modular de espaciados (4, 8, 12, 16, 24, 32px).
- Generación del archivo complementario `docs/specs/02-stitch-master-prompt.md` para exportación a Google Stitch MCP.

---

## 4. INVENTARIO COMPLETO DE PANTALLAS, MENÚS Y COMPONENTES UI

### 4.1. Shell Global de la Aplicación
1. **Sidebar Navegable (Colapsable / Drawer en móviles):**
   - Selector de Organización y Repositorio activo (con buscador y dropdown).
   - Acceso rápido a vistas:
     - 📋 **Tablero Kanban** (por estado/workflow).
     - 📝 **Lista de Issues** (tabular con filtros avanzados).
     - 🎯 **Milestones / Hitos** (progreso de sprints).
     - 🔀 **Pull Requests Vinculados** (estado de revisión y checks).
     - ⚙️ **Configuración del Proyecto** (mapeo de columnas, etiquetas, miembros).
   - Perfil de usuario: Avatar de GitHub, nombre de usuario (`@handle`), indicador de límites de API de GitHub (rate limit remaining) y botón de desconexión.
2. **Topbar Superior:**
   - Breadcrumb contextual: `Organización / Repositorio / Vista Activa`.
   - Buscador global contextual (`Cmd+K` / `Ctrl+K`): búsqueda instantánea en títulos, números y comentarios de issues.
   - Botón de Acción Primaria: **`+ Nuevo Issue`** (abre modal/drawer con tecla `C`).
   - Botón de Sincronización Manual (`Refresh / Sync now`) con animación de giro.

### 4.2. Vistas Principales

#### Vista A: Tablero Kanban de Repositorio
- **Header de Controles:**
  - Conmutador de vista: *Kanban* vs *Lista*.
  - Filtros rápidos tipo píldoras: *Mis issues asignados*, *Creados por mí*, *Solo bugs*, *Milestone activo*.
  - Menú de agrupación: Agrupar por Estado, por Prioridad o por Milestone.
- **Columnas Kanban (6 Columnas estándar con Drag & Drop):**
  1. **Backlog** (Issues abiertos sin sprint asignado).
  2. **Por Hacer (Todo)** (Issues priorizados para el ciclo).
  3. **En Progreso (In Progress)** (Con branch activo o asignado trabajando).
  4. **En Revisión (In Review)** (Con Pull Request abierto vinculado).
  5. **Completado (Done)** (Issues resueltos / cerrados).
  6. **Cancelado / Descartado** (Issues cerrados como *not planned*).
- **Tarjeta de Issue (`KanbanCard`):**
  - Número de issue con enlace directo a GitHub (ej: `#84`).
  - Título con truncamiento a 2 líneas y tooltip completo en hover.
  - Badges de etiquetas reales de GitHub con sus colores hexadecimales nativos.
  - Indicador de Pull Request vinculado (ícono de PR + estado: open/merged).
  - Indicador de comentarios (bocadillo con conteo).
  - Avatar del asignado (foto de GitHub con tooltip de nombre).

#### Vista B: Lista Tabular Densa (`IssueListView`)
- Diseñada para escaneo rápido de cientos de issues.
- Columnas configurables: *Checkbox de selección múltiple, Estado, ID, Título, Etiquetas, Milestone, Asignado, Fecha de actualización*.
- Acciones en lote (Bulk Actions bar flotante cuando hay selección): *Cambiar estado, Asignar a usuario, Añadir etiqueta, Cerrar en lote*.

#### Vista C: Panel Detallado del Issue (`IssueDetailDrawer` / Modal en Mobile)
- Se abre lateralmente manteniendo la vista del tablero debajo.
- **Cabecera:** `#Número`, badge de estado, enlace para abrir en `github.com` en nueva pestaña y botón cerrar.
- **Área Principal:**
  - Título editable con auto-guardado en GitHub.
  - Editor Markdown con pestañas *Escribir* y *Vista Previa* (soporte para listas de tareas `- [x]`, bloques de código con syntax highlighting y menciones `@usuario`).
  - Checklist interactivo: marcar tareas actualiza directamente el cuerpo del issue en GitHub.
  - Hilo de discusión: lista cronológica de comentarios con avatares, formateo markdown, reacciones emoji y caja para publicar nuevo comentario.
  - Historial de eventos (Timeline): *"Octocat vinculó el PR #92 hace 3 horas"*, *"TinChoX cambió el estado a In Review"*.
- **Barra Lateral de Metadatos:**
  - **Asignados:** Selector desplegable con colaboradores del repositorio de GitHub.
  - **Etiquetas (Labels):** Selector múltiple con etiquetas del repositorio + opción de crear etiqueta nueva.
  - **Milestone:** Asignación a hito existente.
  - **Estimación Interna (Supabase):** Puntos de historia (1, 2, 3, 5, 8).

### 4.3. Modales y Casos Invisibles (UX Defensiva)
- **Modal de Creación de Issue:**
  - Validación en vivo: Título obligatorio, selector de repositorio, selector de etiquetas iniciales y descripción con template opcional (*Bug report* / *Feature request*).
- **Empty States:**
  - Sin repositorios conectados: Asistente paso a paso para seleccionar organizaciones y repositorios de GitHub.
  - Tablero vacío o filtro sin resultados: Mensaje descriptivo con botón de acción (*"No hay issues en este filtro. Limpiar filtros o crear uno nuevo"*).
  - Sin hitos configurados: Tarjeta explicativa con botón para crear el primer hito en GitHub.
- **Loading Skeletons:**
  - Tarjetas y filas grises pulsantes que calzan 1:1 con la estructura real del Kanban para evitar brincos de layout (CLS = 0).
- **Manejo de Errores y Límites de GitHub:**
  - Detección de Rate Limit de la API de GitHub: Aviso superior informativo con tiempo exacto de reseteo (`Resetea en X minutos`).
  - Fallo de conexión: Notificación Toast roja con botón *Reintentar* y preservación del borrador en `localStorage` para que el usuario no pierda lo que escribió.

---

## 5. ESQUEMA DE DATOS Y RLS EN SUPABASE CLOUD (SIN DOCKER)

Para complementar la API de GitHub sin violar su autoridad como fuente de verdad, Supabase almacena la configuración de equipos, mapeo de tableros y caché:

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

-- 2. Miembros del Workspace
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'developer', 'viewer');

CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role team_role NOT NULL DEFAULT 'developer',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 3. Repositorios de GitHub Vinculados al Workspace
CREATE TABLE linked_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    github_repo_id BIGINT NOT NULL,
    full_name TEXT NOT NULL, -- ej: 'facebook/react'
    default_branch TEXT NOT NULL DEFAULT 'main',
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    sync_settings JSONB DEFAULT '{"sync_issues": true, "sync_prs": true}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, github_repo_id)
);

-- 4. Mapeo de Columnas Kanban para el Repositorio
CREATE TABLE kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES linked_repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Backlog', 'In Progress', etc.
    position INT NOT NULL DEFAULT 0,
    github_state TEXT NOT NULL DEFAULT 'open', -- 'open' o 'closed'
    filter_label TEXT, -- Label opcional de GitHub asociado a la columna (ej: 'in-progress')
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Metadatos de Equipo Locales (Extensiones sobre GitHub)
CREATE TABLE issue_team_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_repo_id BIGINT NOT NULL,
    issue_number INT NOT NULL,
    story_points INT DEFAULT NULL,
    internal_notes TEXT DEFAULT '',
    custom_status TEXT DEFAULT NULL,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(github_repo_id, issue_number)
);

-- POLÍTICAS RLS (Seguridad en Supabase Cloud)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE linked_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_team_metadata ENABLE ROW LEVEL SECURITY;

-- Política de lectura de repositorios vinculados por miembros del workspace
CREATE POLICY "Miembros leen repositorios vinculados" ON linked_repositories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm 
            WHERE wm.workspace_id = linked_repositories.workspace_id 
              AND wm.user_id = auth.uid()
        )
    );

-- Política de escritura de columnas para administradores y developers
CREATE POLICY "Colaboradores configuran columnas" ON kanban_columns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM linked_repositories lr
            JOIN workspace_members wm ON wm.workspace_id = lr.workspace_id
            WHERE lr.id = kanban_columns.repository_id 
              AND wm.user_id = auth.uid()
              AND wm.role IN ('owner', 'admin', 'developer')
        )
    );
```

---

## 6. MATRIZ DE PRUEBAS DE VERIFICACIÓN (PLAYWRIGHT)

| ID Test | Escenario y Flujo | Viewport | Criterio de Aprobación Visual y Funcional |
| :--- | :--- | :--- | :--- |
| **TC-01** | Renderizado del Tablero Kanban | Desktop (1440x900) | Se despliegan las 6 columnas con sus cabeceras, contadores y tarjetas de issue alineadas con espaciado uniforme. Cero desbordamiento horizontal. |
| **TC-02** | Interacción Drag & Drop | Desktop (1440x900) | Mover una tarjeta de 'Todo' a 'In Progress' actualiza los contadores de ambas columnas y activa la llamada a la API sin glitch visual. |
| **TC-03** | Apertura y Edición en Drawer de Detalle | Desktop (1440x900) | Al hacer clic en un issue se abre el Drawer lateral fluidamente; el editor Markdown permite alternar entre vista de edición y previsualización. |
| **TC-04** | Responsive y Menú Mobile | Mobile (375x812) | La barra lateral se convierte en menú hamburguesa táctil. Las columnas del Kanban se desplazan horizontalmente de forma suave y contenida sin romper la barra superior. |
| **TC-05** | Vista de Lista con Filtros Rápidos | Tablet (768x1024) | Al aplicar el filtro rápido "Solo Bugs" y "Mis Issues", la tabla se filtra de forma instantánea sin parpadeos. |
| **TC-06** | Empty States y Modal de Creación | Desktop (1440x900) | El modal de creación valida campos requeridos; al abrir un repositorio sin issues se muestra la ilustración y el botón de crear primer issue. |

---

## 7. CRITERIOS DE TRANSICIÓN A LA FASE 2

1. Guardado completo del Spec en `docs/specs/01-arquitectura-y-spec.md` (Completado).
2. Aprobación formal del usuario en el chat.
3. Inicio de la **FASE 2**:
   - Creación de Git Worktree aislado (`superpowers:using-git-worktrees`).
   - Redacción del Prompt Maestro para Google Stitch en `docs/specs/02-stitch-master-prompt.md`.
   - Generación / Maquetación de pantallas mediante Google Stitch MCP.
   - Capturas de diagnóstico con Playwright (Desktop 1440px, Tablet 768px, Mobile 375px).
   - Auditoría y reparación total con Impeccable (visual + código).
   - Checkpoint de aprobación visual de las capturas antes de pasar a la base de datos.
