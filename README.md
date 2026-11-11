# LinearStudio 🚀

> **Next-Generation Federated Project & Issue Management** powered by **Supabase Cloud**, **GitHub Bi-directional Sync**, and autonomous **Antigravity AI Agent** workflows.

LinearStudio combines the speed and elegance of modern issue tracking with federated cross-repository triage, real-time collaboration via Supabase Cloud, and deep AI agent automation.

---

## ✨ Características Principales

* 🔒 **Autenticación y Seguridad RLS en Supabase Cloud:**
  * Página principal pública con flujos de registro (`Sign Up`) e inicio de sesión (`Sign In`).
  * Bloqueo estricto del panel (*Auth Gate*): nadie sin sesión puede acceder al tablero.
  * Todas las tablas y políticas están aisladas con el prefijo `ls_` y protegidas mediante *Row Level Security* (RLS) multi-tenant por workspace.
* 📋 **Tablero Kanban Interactivo & Detalle de Issues:**
  * Estados ágiles: `Backlog`, `Todo`, `In Progress` y `Done`.
  * Asignación de prioridades (`Urgent`, `High`, `Medium`, `Low`, `None`).
  * Estimación de esfuerzo en puntos Fibonacci (`1, 2, 3, 5, 8, 13`), etiquetas y fechas límite.
  * Hilo de comentarios y checklist interactiva de subtareas.
* 🌐 **Triage Global Multi-Proyecto:**
  * Vista centralizada para inspeccionar y mover issues a través de todos los repositorios federados sin cambiar de contexto.
* 🐙 **Sincronización con GitHub:**
  * Conexión mediante API Key / Personal Access Token (PAT).
  * Conversión automática de listas de tareas Markdown (`- [ ]`, `- [x]`) en subtareas interactivas en LinearStudio.
* 🤖 **Integración Nativa con Antigravity AI:**
  * Skill especializada en `.agents/skills/linear-studio` y CLI en `scripts/linear_studio.py`.
  * El agente Antigravity puede escanear TODOs en el código, crear issues automáticamente en cualquier proyecto y actualizar su estado a `in_progress` o `done`.
* 🌓 **Diseño Adaptativo y Tema Dual:**
  * Soporte nativo para modo Oscuro y Claro.
  * Navegación mobile-first optimizada con pestañas para columnas Kanban.

---

## 🛠️ Stack Tecnológico

* **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
* **Estilos:** [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
* **Estado & Cache:** [Zustand](https://github.com/pmndrs/zustand), [TanStack React Query](https://tanstack.com/query)
* **Backend & Base de Datos:** [Supabase Cloud](https://supabase.com/) (PostgreSQL + Auth + Row Level Security)
* **Testing:** [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)

---

## 🚀 Inicio Rápido

### 1. Clonar el repositorio
```bash
git clone https://github.com/sendeiser/LinearStudio.git
cd LinearStudio
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea tu archivo `.env.local` a partir de `.env.example`:
```bash
cp .env.example .env.local
```

Configura tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
GITHUB_PAT=<tu-github-pat-opcional>
```

### 4. Ejecutar en desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) (o el puerto asignado por Vite) en tu navegador.

---

## 🧪 Pruebas y Calidad de Código

* **Ejecutar tests unitarios:**
  ```bash
  npm test
  ```
* **Compilación de producción:**
  ```bash
  npm run build
  ```

---

## 🌐 Despliegue en Netlify

El repositorio ya incluye `netlify.toml` y `public/_redirects` optimizados para Single Page Applications (SPA).

### Pasos para desplegar:
1. Conecta tu repositorio de GitHub `sendeiser/LinearStudio` en [app.netlify.com](https://app.netlify.com/).
2. **Build settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. **Variables de Entorno (Site configuration > Environment variables):**
   - `VITE_SUPABASE_URL`: `https://ydoviusjpgmjsxpspexu.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: (tu llave pública anon de Supabase)
   - `VITE_GITHUB_TOKEN`: (opcional)

---

## 🤖 Uso con el Agente Antigravity

LinearStudio incluye una Skill de Antigravity que permite interactuar con el tablero desde el chat del asistente:

```bash
# Listar proyectos activos
python scripts/linear_studio.py list-projects

# Crear un nuevo issue desde Antigravity
python scripts/linear_studio.py create-issue --project "sendeiser/LinearStudio" --title "Optimizar bundle" --description "Analizar dynamic imports" --priority high

# Actualizar el estado de un issue
python scripts/linear_studio.py update-status --project "sendeiser/LinearStudio" --number 1 --status in_progress
```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT.

