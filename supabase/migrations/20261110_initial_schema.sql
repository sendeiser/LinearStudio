-- =============================================================================
-- MIGRATION: Linear Studio with GitHub API, Supabase Cloud & Antigravity AI
-- Version: 1.2.0
-- =============================================================================

-- 1. Espacios de trabajo (Workspaces)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Miembros del Workspace y Roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'developer', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'developer',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 3. Repositorios de GitHub Vinculados al Workspace
CREATE TABLE IF NOT EXISTS public.linked_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    github_repo_id BIGINT NOT NULL,
    full_name TEXT NOT NULL, -- ej: 'tincho/hyper-flow'
    default_branch TEXT NOT NULL DEFAULT 'main',
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    ai_settings JSONB DEFAULT '{"auto_triage": true, "antigravity_bridge": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, github_repo_id)
);

-- 4. Columnas Kanban Configuradas por Repositorio
CREATE TABLE IF NOT EXISTS public.kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES public.linked_repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- 'Backlog', 'Por Hacer', 'En Progreso', etc.
    position INT NOT NULL DEFAULT 0,
    github_state TEXT NOT NULL DEFAULT 'open',
    filter_label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Metadatos de Equipo e Integración con Antigravity AI
DO $$ BEGIN
    CREATE TYPE agent_execution_status AS ENUM ('idle', 'running', 'pr_ready', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.issue_team_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_repo_id BIGINT NOT NULL,
    issue_number INT NOT NULL,
    story_points INT DEFAULT NULL,
    internal_notes TEXT DEFAULT '',
    ai_summary TEXT DEFAULT NULL,
    antigravity_task_id TEXT DEFAULT NULL,
    antigravity_status agent_execution_status NOT NULL DEFAULT 'idle',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(github_repo_id, issue_number)
);

-- 6. Historial de Sesiones de Agentes Antigravity / IA
CREATE TABLE IF NOT EXISTS public.ai_agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_number INT NOT NULL,
    github_repo_id BIGINT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    agent_type TEXT NOT NULL DEFAULT 'antigravity',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- POLÍTICAS DE SEGURIDAD RLS (Row Level Security)
-- =============================================================================
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linked_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_team_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- 1. Workspaces: Los miembros leen su propio workspace
DROP POLICY IF EXISTS "Miembros leen sus workspaces" ON public.workspaces;
CREATE POLICY "Miembros leen sus workspaces" ON public.workspaces
    FOR SELECT USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
        )
    );

-- 2. Repositorios Vinculados: Lectura para miembros del workspace
DROP POLICY IF EXISTS "Miembros leen repositorios vinculados" ON public.linked_repositories;
CREATE POLICY "Miembros leen repositorios vinculados" ON public.linked_repositories
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm 
            WHERE wm.workspace_id = linked_repositories.workspace_id AND wm.user_id = auth.uid()
        )
    );

-- 3. Columnas Kanban: Miembros leen columnas
DROP POLICY IF EXISTS "Miembros leen columnas kanban" ON public.kanban_columns;
CREATE POLICY "Miembros leen columnas kanban" ON public.kanban_columns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.linked_repositories lr
            JOIN public.workspace_members wm ON wm.workspace_id = lr.workspace_id
            WHERE lr.id = kanban_columns.repository_id AND wm.user_id = auth.uid()
        )
    );

-- 4. Modificación de Metadatos de Equipo e IA: Colaboradores activos
DROP POLICY IF EXISTS "Colaboradores gestionan metadatos de issues" ON public.issue_team_metadata;
CREATE POLICY "Colaboradores gestionan metadatos de issues" ON public.issue_team_metadata
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 5. Logs de IA: Lectura y escritura para usuarios autenticados
DROP POLICY IF EXISTS "Usuarios autenticados leen y escriben logs IA" ON public.ai_agent_logs;
CREATE POLICY "Usuarios autenticados leen y escriben logs IA" ON public.ai_agent_logs
    FOR ALL USING (auth.uid() IS NOT NULL);

