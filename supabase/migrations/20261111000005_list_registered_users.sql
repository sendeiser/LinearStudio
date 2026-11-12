-- ==============================================================================
-- LinearStudio: Listar Usuarios Registrados para Invitar Colaboradores
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.ls_list_registered_users(
    p_workspace UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    email TEXT,
    name TEXT,
    already_member BOOLEAN
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

    RETURN QUERY
    SELECT
        u.id,
        COALESCE(u.email::TEXT, '') AS email,
        COALESCE(
            NULLIF(u.raw_user_meta_data->>'full_name', ''),
            NULLIF(u.raw_user_meta_data->>'name', ''),
            split_part(COALESCE(u.email::TEXT, 'dev'), '@', 1)
        )::TEXT AS name,
        CASE
            WHEN p_workspace IS NOT NULL THEN EXISTS (
                SELECT 1 FROM public.ls_workspace_members wm
                WHERE wm.workspace_id = p_workspace AND wm.user_id = u.id
            )
            ELSE false
        END AS already_member
    FROM auth.users u
    WHERE u.id <> v_uid
      AND u.email IS NOT NULL
      AND length(btrim(u.email)) > 0
    ORDER BY already_member ASC, name ASC, email ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.ls_list_registered_users(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ls_list_registered_users(UUID) TO authenticated;

