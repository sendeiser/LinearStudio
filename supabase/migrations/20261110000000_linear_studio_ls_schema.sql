-- =============================================================================
-- MIGRATION: Linear Studio (GitHub Projects + Antigravity AI)
-- Version: 1.3.0
-- Base de datos COMPARTIDA con boxtools (proyecto ydoviusjpgmjsxpspexu).
-- Todas las tablas y tipos usan el prefijo ls_ para no colisionar con boxtools
-- (categories, tools, tool_media, combos, combo_tools, ai_settings).
-- Esta migracion NO toca ninguna tabla de boxtools.
-- =============================================================================

-- 1. Espacios de trabajo (Workspaces)
CREATE TABLE IF NOT EXISTS public.ls_workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Miembros del Workspace y Roles
DO $$ BEGIN
    CREATE TYPE public.ls_user_role AS ENUM ('owner', 'admin', 'developer', 'viewer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.ls_workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.ls_workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.ls_user_role NOT NULL DEFAULT 'developer',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

-- 3. Repositorios de GitHub vinculados al Workspace
CREATE TABLE IF NOT EXISTS public.ls_linked_repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.ls_workspaces(id) ON DELETE CASCADE,
    github_repo_id BIGINT NOT NULL,
    full_name TEXT NOT NULL, -- ej: 'tincho/hyper-flow'
    default_branch TEXT NOT NULL DEFAULT 'main',
    is_private BOOLEAN NOT NULL DEFAULT FALSE,
    ai_settings JSONB DEFAULT '{"auto_triage": true, "antigravity_bridge": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workspace_id, github_repo_id)
);

-- 4. Columnas Kanban configuradas por repositorio
CREATE TABLE IF NOT EXISTS public.ls_kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES public.ls_linked_repositories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INT NOT NULL DEFAULT 0,
    github_state TEXT NOT NULL DEFAULT 'open',
    filter_label TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Metadatos de equipo e integracion con Antigravity AI
DO $$ BEGIN
    CREATE TYPE public.ls_agent_execution_status AS ENUM ('idle', 'running', 'pr_ready', 'error');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.ls_issue_team_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_repo_id BIGINT NOT NULL,
    issue_number INT NOT NULL,
    story_points INT DEFAULT NULL,
    internal_notes TEXT DEFAULT '',
    ai_summary TEXT DEFAULT NULL,
    antigravity_task_id TEXT DEFAULT NULL,
    antigravity_status public.ls_agent_execution_status NOT NULL DEFAULT 'idle',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(github_repo_id, issue_number)
);

-- 6. Historial de sesiones de agentes Antigravity / IA
CREATE TABLE IF NOT EXISTS public.ls_ai_agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_number INT NOT NULL,
    github_repo_id BIGINT NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    agent_type TEXT NOT NULL DEFAULT 'antigravity',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- Como la BD es compartida con boxtools (que tiene usuarios autenticados y
-- politicas publicas propias), aqui NUNCA basta con "estar autenticado":
-- siempre se exige pertenecer a un workspace de Linear Studio.
-- =============================================================================
ALTER TABLE public.ls_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_linked_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_issue_team_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_ai_agent_logs ENABLE ROW LEVEL SECURITY;

-- 1. Membresias: cada usuario ve las suyas
DROP POLICY IF EXISTS "ls members read own membership" ON public.ls_workspace_members;
CREATE POLICY "ls members read own membership" ON public.ls_workspace_members
    FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 2. Workspaces: propietario o miembro
DROP POLICY IF EXISTS "ls members read workspaces" ON public.ls_workspaces;
CREATE POLICY "ls members read workspaces" ON public.ls_workspaces
    FOR SELECT TO authenticated USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.ls_workspace_members wm
            WHERE wm.workspace_id = ls_workspaces.id AND wm.user_id = auth.uid()
        )
    );

-- 3. Repositorios vinculados: miembros del workspace
DROP POLICY IF EXISTS "ls members read linked repos" ON public.ls_linked_repositories;
CREATE POLICY "ls members read linked repos" ON public.ls_linked_repositories
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.ls_workspace_members wm
            WHERE wm.workspace_id = ls_linked_repositories.workspace_id AND wm.user_id = auth.uid()
        )
    );

-- 4. Columnas Kanban: miembros del workspace dueño del repo
DROP POLICY IF EXISTS "ls members read kanban columns" ON public.ls_kanban_columns;
CREATE POLICY "ls members read kanban columns" ON public.ls_kanban_columns
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.ls_linked_repositories lr
            JOIN public.ls_workspace_members wm ON wm.workspace_id = lr.workspace_id
            WHERE lr.id = ls_kanban_columns.repository_id AND wm.user_id = auth.uid()
        )
    );

-- 5. Metadatos de issues: miembros de un workspace que vincula ese repo
DROP POLICY IF EXISTS "ls members manage issue metadata" ON public.ls_issue_team_metadata;
CREATE POLICY "ls members manage issue metadata" ON public.ls_issue_team_metadata
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ls_linked_repositories lr
            JOIN public.ls_workspace_members wm ON wm.workspace_id = lr.workspace_id
            WHERE lr.github_repo_id = ls_issue_team_metadata.github_repo_id AND wm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ls_linked_repositories lr
            JOIN public.ls_workspace_members wm ON wm.workspace_id = lr.workspace_id
            WHERE lr.github_repo_id = ls_issue_team_metadata.github_repo_id AND wm.user_id = auth.uid()
        )
    );

-- 6. Logs de IA: mismo criterio por repositorio
DROP POLICY IF EXISTS "ls members manage ai logs" ON public.ls_ai_agent_logs;
CREATE POLICY "ls members manage ai logs" ON public.ls_ai_agent_logs
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.ls_linked_repositories lr
            JOIN public.ls_workspace_members wm ON wm.workspace_id = lr.workspace_id
            WHERE lr.github_repo_id = ls_ai_agent_logs.github_repo_id AND wm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ls_linked_repositories lr
            JOIN public.ls_workspace_members wm ON wm.workspace_id = lr.workspace_id
            WHERE lr.github_repo_id = ls_ai_agent_logs.github_repo_id AND wm.user_id = auth.uid()
        )
    );
