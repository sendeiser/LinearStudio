# PROMPT MAESTRO HIPERDETALLADO PARA GOOGLE STITCH MCP
**Proyecto:** Linear / GitHub Projects Studio Web Client  
**Versión:** 1.0.0  
**Fecha:** 2026-11-10  
**Archivo:** `docs/specs/02-stitch-master-prompt.md`  

---

## 1. SISTEMA DE DISEÑO Y DESIGN TOKENS FORMALES

### 1.1. Dirección Conceptual de Diseño
- **Arquetipo:** *High-Performance Cyber-Minimalist Developer Studio* (Inspirado en Linear.app, Raycast y GitHub Dark Pro).
- **Densidad:** Controlada (alta densidad para monitores de ingeniería con espaciados calculados en múltiplos de 4px).
- **Profundidad y Atmósfera:** Canvas oscuro profundo (`#0d1117`) con gradiente radial sutil (`radial-gradient(ellipse at 50% 0%, #161b22 0%, #0d1117 100%)`), bordes definidos de 1px con brillo sutil (`#30363d`), tarjetas elevadas (`#161b22`) con `backdrop-filter: blur(8px)` y sombras nítidas de elevación.

### 1.2. Paleta Cromática y Tokens Semánticos
```css
:root {
  /* Fondos y Superficies */
  --bg-canvas: #090d16;
  --bg-surface: #111827;
  --bg-surface-elevated: #162032;
  --bg-surface-hover: #1e293b;
  --bg-overlay: rgba(9, 13, 22, 0.85);

  /* Bordes y Líneas */
  --border-subtle: #243044;
  --border-muted: #1e293b;
  --border-focus: #38bdf8;
  --border-glow: rgba(56, 189, 248, 0.25);

  /* Textos y Contrastes */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --text-inverse: #090d16;

  /* Estados de GitHub & Issues */
  --state-open: #22c55e;
  --state-open-bg: rgba(34, 197, 94, 0.12);
  --state-closed: #a855f7;
  --state-closed-bg: rgba(168, 85, 247, 0.12);

  /* Prioridades Semánticas */
  --priority-urgent: #ef4444;
  --priority-urgent-bg: rgba(239, 68, 68, 0.15);
  --priority-high: #f59e0b;
  --priority-high-bg: rgba(245, 158, 11, 0.15);
  --priority-medium: #38bdf8;
  --priority-medium-bg: rgba(56, 189, 248, 0.15);
  --priority-low: #64748b;
  --priority-low-bg: rgba(100, 116, 139, 0.15);

  /* Tipografías */
  --font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
}
```

---

## 2. PANTALLAS MAESTRAS Y ESPECIFICACIÓN PARA STITCH MCP

### Pantalla 1: Tablero Kanban de Ingeniería (`Screen: KanbanBoardView`)
- **Objetivo:** Visualizar y orquestar el flujo de desarrollo de un repositorio activo de GitHub mediante tarjetas arrastrables divididas en 6 columnas verticales.
- **Estructura del Layout:**
  - **Topbar Global (64px):**
    - Logo minimalista del sistema con badge `STUDIO`.
    - Selector desplegable de Repositorio activo (ej: `tincho/hyper-flow-app`) con icono de GitHub y contador de estrellas ⭐.
    - Buscador rápido centralizado con atajo visual `Ctrl+K`.
    - Selector de vistas: Píldora conmutadora `[ ▦ Kanban | ☰ Lista | 🎯 Milestones ]`.
    - Botón de Acción Primaria: `+ Nuevo Issue` (color `#38bdf8` con hover y micro-escala).
  - **Filtros Rápidos (Barra de 44px):**
    - Chips interactivos con toggles: `Mis Asignaciones`, `Solo Bugs`, `Sprint Actual`, `Sin Asignar`.
    - Menú desplegable para ordenar por Prioridad o Fecha.
  - **Área de Tablero Kanban (Scroll horizontal asistido sin romper la ventana):**
    - 6 Columnas con cabecera estilizada, punto indicador de estado y contador de tarjetas:
      1. **Backlog** (Gris `#64748b`, 5 issues).
      2. **Por Hacer / Todo** (Azul `#38bdf8`, 4 issues).
      3. **En Progreso / In Progress** (Ámbar `#f59e0b`, 3 issues).
      4. **En Revisión / In Review** (Índigo `#818cf8`, con badge de PR vinculado, 2 issues).
      5. **Completado / Done** (Púrpura `#a855f7`, 8 issues).
      6. **Descartado / Canceled** (Rojo atenuado, 1 issue).
  - **Componente Tarjeta Kanban (`KanbanCard`):**
    - Borde sutil `1px solid var(--border-subtle)` con hover `border-color: var(--border-focus)` y elevación de sombra.
    - Fila superior: ID con tipografía mono (`#142`), icono de prioridad con tooltip, y badge de repositorio.
    - Título del issue: 2 líneas con texto blanco `#f8fafc` y peso font-semibold.
    - Tags de colores nativos de GitHub (`frontend`, `bug:critical`, `api`).
    - Fila inferior: Indicador de comentarios `💬 4`, subtareas `✓ 3/5`, y Avatar circular con borde del asignado.

### Pantalla 2: Panel Lateral de Detalle del Issue (`Screen: IssueDetailDrawer`)
- **Objetivo:** Drawer flotante de 540px de ancho que se abre desde el borde derecho con transición suave (`transform translateX`).
- **Estructura:**
  - **Header:** Estado badge (`Open` en verde o `Closed` en púrpura), número `#142`, botón de copiar enlace al portapapeles y botón para abrir directamente en `github.com`.
  - **Cuerpo Izquierdo:**
    - Título editable con click-to-edit.
    - Descripción completa en Markdown con syntax highlighter para bloques de código TypeScript/Python.
    - Lista interactiva de tareas (Checklist con checkbox accesibles y barra de progreso calculada).
    - Módulo de comentarios: Avatares, fecha relativa (*hace 2 horas*), badges de colaborador (*Author*, *Maintainer*), reacciones emoji (👍, ❤️, 🚀) y caja de texto para redactar comentarios con preview Markdown.
  - **Sidebar de Metadatos Derecho:**
    - Dropdown de Asignados con avatares reales y buscador.
    - Dropdown de Etiquetas con vista previa de color y botón *+ Nueva etiqueta*.
    - Selector de Milestone con fecha límite.
    - Selector de Estimación en puntos (1, 2, 3, 5, 8).

### Pantalla 3: Modal de Creación Rápida (`Screen: CreateIssueModal`)
- **Objetivo:** Modal centrado con fondo desenfocado (`backdrop-blur-md`) activable con la tecla `C`.
- **Estructura:**
  - Input para Título del issue (*"Ej: Corregir desbordamiento en vista móvil"*).
  - Textarea con pestañas *Escribir* y *Vista Previa*.
  - Fila inferior de selección rápida: Repositorio destino, Asignar a mí, Etiqueta y Prioridad.
  - Botones accesibles: Cancelar (Esc) y Crear Issue (Cmd+Enter).

### Pantalla 4: Vista Móvil Optimizada (`Screen: MobileWorkspaceView` - 375px)
- **Objetivo:** Experiencia táctil adaptada para smartphones sin pérdidas funcionales.
- **Estructura:**
  - Barra superior condensada con botón hamburguesa táctil (48x48px) para abrir el drawer de repositorios.
  - Pestañas horizontales de columnas Kanban con deslizamiento táctil (swipe horizontal o selector por pestañas).
  - Tarjetas con paddings optimizados y botones de acción rápida agrandados a un mínimo de 44px de altura.
  - Botón de acción flotante (FAB) en la esquina inferior derecha para crear nuevo issue.

---

## 3. PROMPT CONSOLIDADO PARA INVOCACIÓN DE STITCH MCP

```text
Create a high-performance modern developer web application called "Linear Studio for GitHub Projects".
Aesthetic: Dark mode cyberpunk-clean developer tool with deep slate background (#090d16), surface cards (#111827), subtle border accents (#243044), and crisp typography (Plus Jakarta Sans for headings, JetBrains Mono for issue keys like #104).
Views to generate:
1. Full Kanban Board with 6 workflow columns (Backlog, Todo, In Progress, In Review, Done, Canceled) with realistic issue cards, labels, assignees, and pull request indicators.
2. An Issue Detail Drawer sliding from the right with markdown preview, checklist tasks, and activity comments.
3. Quick filter bar with search (Ctrl+K), repository switcher, and active chips.
4. Seamless responsive mobile layout (375px) with swipeable columns and hamburger drawer.
```

