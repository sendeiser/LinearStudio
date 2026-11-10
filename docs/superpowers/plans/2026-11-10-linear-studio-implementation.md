# Linear Studio & Antigravity AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conectar los componentes y tableros aprobados en UI con Supabase Cloud y la API de GitHub, implementando el ciclo de vida de issues, soporte Dual-Theme y el puente agéntico de Antigravity mediante TDD estricto.

**Architecture:** Arquitectura modular desacoplada: cliente de datos con Supabase/GitHub con fallback resiliente, servicio de orquestación de tareas agénticas de Antigravity, y suite E2E de Playwright validando la reactividad en tiempo real.

**Tech Stack:** React 19 + TypeScript, Tailwind CSS, Playwright, Supabase Cloud (PostgreSQL/RLS), Antigravity SDK.

**Spec:** `docs/specs/01-arquitectura-y-spec.md`

---

## Global Constraints
- Prohibido alterar las clases tipográficas (`Plus Jakarta Sans`, `JetBrains Mono`) y los tokens cromáticos aprobados por Impeccable.
- Todos los tests deben seguir el semáforo TDD: **ROJO** (fallo controlado comprobado) ➔ **VERDE** (código mínimo para pasar) ➔ **AZUL** (refactorización y limpieza).
- Cero dependencias locales de Docker para la base de datos.

---

## Tasks

### Task 1: Cliente de Supabase y Fallback Resiliente de Datos
**Files:**
- Create: `src/lib/supabase.ts`
- Create: `tests/supabaseClient.test.ts`

- [ ] **Step 1 (RED):** Escribir test que verifique la inicialización de Supabase con URL y claves, asegurando que cuando no haya conexión remota activa active el almacenamiento local resiliente sin lanzar excepciones fatales.
- [ ] **Step 2 (GREEN):** Implementar `src/lib/supabase.ts` instanciando `@supabase/supabase-js` con variables de entorno y fallback seguro.
- [ ] **Step 3 (BLUE):** Refactorizar y exportar tipos universales con `src/types/database.types.ts`.
- [ ] **Step 4:** Commit: `feat(db): initialize resilient supabase client with local fallback`.

---

### Task 2: Servicio de Datos de Issues y Sincronización
**Files:**
- Create: `src/services/dataService.ts`
- Create: `tests/dataService.test.ts`

- [ ] **Step 1 (RED):** Escribir test para `getIssues()`, `moveIssue(id, fromCol, toCol)` y `createIssue(data)`.
- [ ] **Step 2 (GREEN):** Implementar `dataService.ts` gestionando la lectura de issues, mutación optimista de columnas y persistencia.
- [ ] **Step 3 (BLUE):** Optimizar con ordenamiento por prioridad y filtros de texto en memoria.
- [ ] **Step 4:** Commit: `feat(services): implement dataService with optimistic kanban mutations`.

---

### Task 3: Servicio de Orquestación Agéntica de Antigravity
**Files:**
- Create: `src/services/antigravityService.ts`
- Create: `tests/antigravityService.test.ts`

- [ ] **Step 1 (RED):** Escribir test para `dispatchAntigravityTask(issueNumber, title)` que verifique la transición de estados `idle -> running -> pr_ready` y la generación del comando CLI `agy`.
- [ ] **Step 2 (GREEN):** Implementar `antigravityService.ts` conectando la simulación agéntica con telemetría en tiempo real.
- [ ] **Step 3 (BLUE):** Validar tipos con `AgentExecutionStatus` y limpieza de timers.
- [ ] **Step 4:** Commit: `feat(ai): implement Antigravity agent bridge and CLI telemetry service`.

---

### Task 4: Suite Integral E2E en Playwright (Semáforo TDD Completo)
**Files:**
- Create: `tests/e2eFlow.spec.ts`

- [ ] **Step 1 (RED):** Crear test E2E en Playwright que navegue por el tablero, verifique el cambio de tema Light/Dark, arrastre un issue entre columnas, cree un nuevo issue y despache un agente Antigravity comprobando que la UI responda en menos de 2 segundos.
- [ ] **Step 2 (GREEN):** Ejecutar la suite hasta verificar que todos los casos pasen en **VERDE**.
- [ ] **Step 3 (BLUE):** Limpiar logs de prueba y generar reporte final.
- [ ] **Step 4:** Commit: `test(e2e): full verified user journey test suite in playwright`.

