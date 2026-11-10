-- =============================================================================
-- Linear Studio v1.4.0: issues, subtareas, comentarios + RPC de workspace/equipo
-- BD compartida con boxtools: todo con prefijo ls_, nada de boxtools se toca.
-- =============================================================================

-- ---------- Funciones de acceso (SECURITY DEFINER evita recursion de RLS) ----------
CREATE OR REPLACE FUNCTION public.ls_can_access_repo(p_repo UUID, p_write BOOLEAN DEFAULT FALSE)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.ls_linked_repositories lr
        JOIN public.ls_workspace_members wm ON wm.workspace_id = lr.workspace_id
        WHERE lr.id = p_repo
          AND wm.user_id = auth.uid()
          AND (NOT p_write OR wm.role IN ('owner', 'admin', 'developer'))
    );
$$;

-- ---------- Tablas ----------
CREATE TABLE IF NOT EXISTS public.ls_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES public.ls_linked_repositories(id) ON DELETE CASCADE,
    number INT NOT NULL,
    title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog','todo','in_progress','in_review','done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('urgent','high','medium','low')),
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    assignee_name TEXT NOT NULL DEFAULT '',
    assignee_role TEXT NOT NULL DEFAULT '',
    pr_number INT,
    branch TEXT,
    created_by UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (repository_id, number)
);
CREATE INDEX IF NOT EXISTS ls_issues_repo_status_idx ON public.ls_issues (repository_id, status);

CREATE TABLE IF NOT EXISTS public.ls_subtasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.ls_issues(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ls_subtasks_issue_idx ON public.ls_subtasks (issue_id, position);

CREATE TABLE IF NOT EXISTS public.ls_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES public.ls_issues(id) ON DELETE CASCADE,
    author_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL CHECK (length(btrim(content)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ls_comments_issue_idx ON public.ls_comments (issue_id, created_at);

CREATE OR REPLACE FUNCTION public.ls_can_access_issue(p_issue UUID, p_write BOOLEAN DEFAULT FALSE)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.ls_issues i
        WHERE i.id = p_issue AND public.ls_can_access_repo(i.repository_id, p_write)
    );
$$;

-- ---------- Triggers: numero correlativo por repo + updated_at ----------
CREATE OR REPLACE FUNCTION public.ls_issues_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NEW.number IS NULL OR NEW.number <= 0 THEN
        PERFORM pg_advisory_xact_lock(hashtext(NEW.repository_id::text));
        SELECT COALESCE(MAX(number), 0) + 1 INTO NEW.number
        FROM public.ls_issues WHERE repository_id = NEW.repository_id;
    END IF;
    RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.ls_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS ls_issues_number_trg ON public.ls_issues;
CREATE TRIGGER ls_issues_number_trg BEFORE INSERT ON public.ls_issues
    FOR EACH ROW EXECUTE FUNCTION public.ls_issues_before_insert();

DROP TRIGGER IF EXISTS ls_issues_touch_trg ON public.ls_issues;
CREATE TRIGGER ls_issues_touch_trg BEFORE UPDATE ON public.ls_issues
    FOR EACH ROW EXECUTE FUNCTION public.ls_touch_updated_at();

-- ---------- RLS ----------
ALTER TABLE public.ls_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ls_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ls issues read" ON public.ls_issues;
CREATE POLICY "ls issues read" ON public.ls_issues
    FOR SELECT TO authenticated USING (public.ls_can_access_repo(repository_id, FALSE));
DROP POLICY IF EXISTS "ls issues insert" ON public.ls_issues;
CREATE POLICY "ls issues insert" ON public.ls_issues
    FOR INSERT TO authenticated WITH CHECK (public.ls_can_access_repo(repository_id, TRUE));
DROP POLICY IF EXISTS "ls issues update" ON public.ls_issues;
CREATE POLICY "ls issues update" ON public.ls_issues
    FOR UPDATE TO authenticated
    USING (public.ls_can_access_repo(repository_id, TRUE))
    WITH CHECK (public.ls_can_access_repo(repository_id, TRUE));
DROP POLICY IF EXISTS "ls issues delete" ON public.ls_issues;
CREATE POLICY "ls issues delete" ON public.ls_issues
    FOR DELETE TO authenticated USING (public.ls_can_access_repo(repository_id, TRUE));

DROP POLICY IF EXISTS "ls subtasks read" ON public.ls_subtasks;
CREATE POLICY "ls subtasks read" ON public.ls_subtasks
    FOR SELECT TO authenticated USING (public.ls_can_access_issue(issue_id, FALSE));
DROP POLICY IF EXISTS "ls subtasks write" ON public.ls_subtasks;
CREATE POLICY "ls subtasks write" ON public.ls_subtasks
    FOR ALL TO authenticated
    USING (public.ls_can_access_issue(issue_id, TRUE))
    WITH CHECK (public.ls_can_access_issue(issue_id, TRUE));

DROP POLICY IF EXISTS "ls comments read" ON public.ls_comments;
CREATE POLICY "ls comments read" ON public.ls_comments
    FOR SELECT TO authenticated USING (public.ls_can_access_issue(issue_id, FALSE));
DROP POLICY IF EXISTS "ls comments insert" ON public.ls_comments;
CREATE POLICY "ls comments insert" ON public.ls_comments
    FOR INSERT TO authenticated
    WITH CHECK (author_id = auth.uid() AND public.ls_can_access_issue(issue_id, TRUE));
DROP POLICY IF EXISTS "ls comments modify own" ON public.ls_comments;
CREATE POLICY "ls comments modify own" ON public.ls_comments
    FOR UPDATE TO authenticated
    USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
DROP POLICY IF EXISTS "ls comments delete own" ON public.ls_comments;
CREATE POLICY "ls comments delete own" ON public.ls_comments
    FOR DELETE TO authenticated USING (author_id = auth.uid());

-- ---------- RPC: crear workspace + repo + columnas (el creador queda como owner) ----------
CREATE OR REPLACE FUNCTION public.ls_create_workspace(
    p_name TEXT,
    p_slug TEXT,
    p_repo_full_name TEXT,
    p_github_repo_id BIGINT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_ws UUID;
    v_repo UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'No autenticado' USING ERRCODE = '28000';
    END IF;
    IF length(btrim(coalesce(p_name, ''))) = 0 OR length(btrim(coalesce(p_slug, ''))) = 0
       OR length(btrim(coalesce(p_repo_full_name, ''))) = 0 THEN
        RAISE EXCEPTION 'Nombre, slug y repositorio son obligatorios' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.ls_workspaces (name, slug, owner_id)
    VALUES (btrim(p_name), lower(btrim(p_slug)), v_uid)
    RETURNING id INTO v_ws;

    INSERT INTO public.ls_workspace_members (workspace_id, user_id, role)
    VALUES (v_ws, v_uid, 'owner');

    INSERT INTO public.ls_linked_repositories (workspace_id, github_repo_id, full_name)
    VALUES (v_ws, COALESCE(p_github_repo_id, abs(hashtext(p_repo_full_name))::BIGINT), btrim(p_repo_full_name))
    RETURNING id INTO v_repo;

    INSERT INTO public.ls_kanban_columns (repository_id, name, position, github_state)
    VALUES (v_repo, 'Backlog', 0, 'open'), (v_repo, 'Por Hacer', 1, 'open'),
           (v_repo, 'En Progreso', 2, 'open'), (v_repo, 'En Revisión', 3, 'open'),
           (v_repo, 'Completado', 4, 'closed');

    RETURN v_repo;
END $$;

-- ---------- RPC: invitar a un compañero por email (solo owner/admin) ----------
CREATE OR REPLACE FUNCTION public.ls_add_member_by_email(
    p_workspace UUID,
    p_email TEXT,
    p_role public.ls_user_role DEFAULT 'developer'
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_target UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'No autenticado' USING ERRCODE = '28000';
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.ls_workspace_members
        WHERE workspace_id = p_workspace AND user_id = v_uid AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Solo owner/admin pueden invitar' USING ERRCODE = '42501';
    END IF;
    IF p_role = 'owner' THEN
        RAISE EXCEPTION 'No se puede asignar el rol owner por invitacion' USING ERRCODE = '42501';
    END IF;

    SELECT id INTO v_target FROM auth.users WHERE lower(email) = lower(btrim(p_email));
    IF v_target IS NULL THEN
        RAISE EXCEPTION 'No existe un usuario registrado con ese email' USING ERRCODE = 'P0002';
    END IF;

    INSERT INTO public.ls_workspace_members (workspace_id, user_id, role)
    VALUES (p_workspace, v_target, p_role)
    ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role
        WHERE public.ls_workspace_members.role <> 'owner';
    RETURN v_target;
END $$;

-- Solo usuarios autenticados pueden ejecutar los RPC (nunca anon/public)
REVOKE ALL ON FUNCTION public.ls_create_workspace(TEXT, TEXT, TEXT, BIGINT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ls_add_member_by_email(UUID, TEXT, public.ls_user_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ls_can_access_repo(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ls_can_access_issue(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ls_create_workspace(TEXT, TEXT, TEXT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ls_add_member_by_email(UUID, TEXT, public.ls_user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ls_can_access_repo(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ls_can_access_issue(UUID, BOOLEAN) TO authenticated;

