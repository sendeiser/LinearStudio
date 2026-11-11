-- ==============================================================================
-- LinearStudio: Gestión de Miembros de Equipo y Eliminación de Workspaces
-- ==============================================================================

-- Helper SECURITY DEFINER para evitar recursión en políticas RLS de ls_workspace_members
CREATE OR REPLACE FUNCTION public.ls_is_in_workspace(p_ws UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.ls_workspaces w
        WHERE w.id = p_ws AND w.owner_id = auth.uid()
    ) OR EXISTS (
        SELECT 1 FROM public.ls_workspace_members wm
        WHERE wm.workspace_id = p_ws AND wm.user_id = auth.uid()
    );
$$;

-- 1. Permitir a miembros ver a los demás compañeros de su mismo workspace sin recursión
DROP POLICY IF EXISTS "ls members read own membership" ON public.ls_workspace_members;
DROP POLICY IF EXISTS "ls members read workspace peers" ON public.ls_workspace_members;
CREATE POLICY "ls members read workspace peers" ON public.ls_workspace_members
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid() OR public.ls_is_in_workspace(workspace_id)
    );

-- 2. Permitir al owner eliminar su workspace
DROP POLICY IF EXISTS "ls owner delete workspace" ON public.ls_workspaces;
CREATE POLICY "ls owner delete workspace" ON public.ls_workspaces
    FOR DELETE TO authenticated
    USING (
        owner_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.ls_workspace_members wm
            WHERE wm.workspace_id = ls_workspaces.id AND wm.user_id = auth.uid() AND wm.role = 'owner'
        )
    );

-- 3. RPC: Listar miembros de un workspace con email y nombre
CREATE OR REPLACE FUNCTION public.ls_list_workspace_members(
    p_workspace UUID
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    email TEXT,
    name TEXT,
    role public.ls_user_role,
    joined_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'No autenticado' USING ERRCODE = '28000';
    END IF;

    IF NOT public.ls_is_in_workspace(p_workspace) THEN
        RAISE EXCEPTION 'No tienes acceso a este workspace' USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        wm.id,
        wm.user_id,
        COALESCE(u.email::TEXT, 'usuario@desconocido') AS email,
        COALESCE(
            NULLIF(u.raw_user_meta_data->>'full_name', ''),
            NULLIF(u.raw_user_meta_data->>'name', ''),
            split_part(COALESCE(u.email::TEXT, 'dev'), '@', 1)
        )::TEXT AS name,
        wm.role,
        wm.joined_at
    FROM public.ls_workspace_members wm
    JOIN auth.users u ON u.id = wm.user_id
    WHERE wm.workspace_id = p_workspace
    ORDER BY
        CASE wm.role
            WHEN 'owner' THEN 0
            WHEN 'admin' THEN 1
            WHEN 'developer' THEN 2
            ELSE 3
        END,
        wm.joined_at ASC;
END;
$$;

-- 4. RPC: Eliminar miembro de un workspace (solo owner/admin, o auto-salida si no es owner)
CREATE OR REPLACE FUNCTION public.ls_remove_workspace_member(
    p_workspace UUID,
    p_target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_target_role public.ls_user_role;
    v_ws_owner UUID;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'No autenticado' USING ERRCODE = '28000';
    END IF;

    SELECT owner_id INTO v_ws_owner FROM public.ls_workspaces WHERE id = p_workspace;
    IF v_ws_owner IS NULL THEN
        RAISE EXCEPTION 'Workspace no encontrado' USING ERRCODE = 'P0002';
    END IF;

    IF v_uid <> p_target_user_id AND v_uid <> v_ws_owner AND NOT EXISTS (
        SELECT 1 FROM public.ls_workspace_members
        WHERE workspace_id = p_workspace AND user_id = v_uid AND role IN ('owner', 'admin')
    ) THEN
        RAISE EXCEPTION 'Solo owner o admin pueden eliminar miembros del equipo' USING ERRCODE = '42501';
    END IF;

    SELECT role INTO v_target_role
    FROM public.ls_workspace_members
    WHERE workspace_id = p_workspace AND user_id = p_target_user_id;

    IF v_target_role IS NULL THEN
        RAISE EXCEPTION 'El usuario no pertenece a este workspace' USING ERRCODE = 'P0002';
    END IF;

    IF v_target_role = 'owner' OR p_target_user_id = v_ws_owner THEN
        RAISE EXCEPTION 'No se puede eliminar al propietario (owner) del workspace' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.ls_workspace_members
    WHERE workspace_id = p_workspace AND user_id = p_target_user_id;
END;
$$;

-- 5. RPC: Eliminar un workspace completo (solo owner)
CREATE OR REPLACE FUNCTION public.ls_delete_workspace(
    p_workspace UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'No autenticado' USING ERRCODE = '28000';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.ls_workspaces
        WHERE id = p_workspace AND owner_id = v_uid
    ) AND NOT EXISTS (
        SELECT 1 FROM public.ls_workspace_members
        WHERE workspace_id = p_workspace AND user_id = v_uid AND role = 'owner'
    ) THEN
        RAISE EXCEPTION 'Solo el propietario puede eliminar el workspace' USING ERRCODE = '42501';
    END IF;

    DELETE FROM public.ls_workspaces WHERE id = p_workspace;
END;
$$;

-- Permisos de ejecución
REVOKE ALL ON FUNCTION public.ls_is_in_workspace(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ls_list_workspace_members(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ls_remove_workspace_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.ls_delete_workspace(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ls_is_in_workspace(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ls_list_workspace_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ls_remove_workspace_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ls_delete_workspace(UUID) TO authenticated;
