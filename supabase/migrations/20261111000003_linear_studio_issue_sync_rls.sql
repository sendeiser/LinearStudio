-- ==============================================================================
-- LinearStudio: Permisos RLS para Sincronización y Movimiento de Issues
-- ==============================================================================
-- Asegura que los usuarios autenticados en Supabase puedan crear, mover, 
-- editar y sincronizar issues sobre repositorios vinculados.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.ls_can_access_repo(p_repo uuid, p_write boolean DEFAULT false)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si el usuario está autenticado en Supabase, tiene acceso de lectura y escritura
  IF auth.uid() IS NOT NULL THEN
    RETURN true;
  END IF;

  -- Para peticiones públicas anónimas
  RETURN NOT p_write;
END;
$$;

-- Refrescar políticas sobre ls_issues para garantizar que INSERT/UPDATE/DELETE funcionen
DROP POLICY IF EXISTS ls_issues_write ON public.ls_issues;
DROP POLICY IF EXISTS ls_issues_read ON public.ls_issues;

CREATE POLICY ls_issues_read ON public.ls_issues
  FOR SELECT
  USING (public.ls_can_access_repo(repository_id, false));

CREATE POLICY ls_issues_write ON public.ls_issues
  FOR ALL
  USING (public.ls_can_access_repo(repository_id, true))
  WITH CHECK (public.ls_can_access_repo(repository_id, true));

-- ==============================================================================
