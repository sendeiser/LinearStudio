-- =============================================================================
-- MIGRATION: Linear Studio User Integrations & Repo Management
-- Version: 1.4.0
-- Permite almacenar la API Key / Token de GitHub vinculado estrictamente
-- a cada usuario individual en Supabase Cloud, protegido por RLS.
-- Tambien habilita CRUD completo de repositorios vinculados para Triage.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.ls_user_integrations (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    github_token TEXT,
    github_user JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ls_user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ls users manage own integration" ON public.ls_user_integrations;
CREATE POLICY "ls users manage own integration" ON public.ls_user_integrations
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Politicas para permitir gestion completa de repositorios federados en ls_linked_repositories
DROP POLICY IF EXISTS "ls members update linked repos" ON public.ls_linked_repositories;
DROP POLICY IF EXISTS "ls members delete linked repos" ON public.ls_linked_repositories;
DROP POLICY IF EXISTS "ls members insert linked repos" ON public.ls_linked_repositories;
DROP POLICY IF EXISTS "ls members read linked repos" ON public.ls_linked_repositories;
DROP POLICY IF EXISTS "ls authenticated read linked repos" ON public.ls_linked_repositories;
DROP POLICY IF EXISTS "ls authenticated insert linked repos" ON public.ls_linked_repositories;
DROP POLICY IF EXISTS "ls authenticated update linked repos" ON public.ls_linked_repositories;
DROP POLICY IF EXISTS "ls authenticated delete linked repos" ON public.ls_linked_repositories;

CREATE POLICY "ls authenticated read linked repos"
    ON public.ls_linked_repositories
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "ls authenticated insert linked repos"
    ON public.ls_linked_repositories
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "ls authenticated update linked repos"
    ON public.ls_linked_repositories
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "ls authenticated delete linked repos"
    ON public.ls_linked_repositories
    FOR DELETE TO authenticated
    USING (true);
