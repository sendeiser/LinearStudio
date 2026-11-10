-- Prueba de RLS y RPC de Linear Studio. TODO se revierte: termina siempre con RAISE EXCEPTION.
-- Resultado esperado: mensaje 'RLS_TESTS_PASSED ...'. Cualquier otro mensaje = fallo.
DO $$
DECLARE
    ua UUID := gen_random_uuid();
    ub UUID := gen_random_uuid();
    uc UUID := gen_random_uuid();
    v_repo UUID;
    v_ws UUID;
    v_issue UUID;
    n INT;
    n1 INT; n2 INT;
    log TEXT := '';
BEGIN
    INSERT INTO auth.users (id, email, aud, role) VALUES
        (ua, 'a-' || ua || '@ls.test', 'authenticated', 'authenticated'),
        (ub, 'b-' || ub || '@ls.test', 'authenticated', 'authenticated'),
        (uc, 'c-' || uc || '@ls.test', 'authenticated', 'authenticated');

    -- === Usuario A ===
    PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', ua::text, true);
    SET LOCAL ROLE authenticated;

    v_repo := public.ls_create_workspace('Equipo A', 'equipo-a-' || substr(ua::text, 1, 8), 'tincho/hyper-flow');
    SELECT workspace_id INTO v_ws FROM public.ls_linked_repositories WHERE id = v_repo;
    SELECT count(*) INTO n FROM public.ls_kanban_columns WHERE repository_id = v_repo;
    IF n <> 5 THEN RAISE EXCEPTION 'FAIL: columnas por defecto = %', n; END IF;

    INSERT INTO public.ls_issues (repository_id, title) VALUES (v_repo, 'Issue uno') RETURNING number, id INTO n1, v_issue;
    INSERT INTO public.ls_issues (repository_id, title) VALUES (v_repo, 'Issue dos') RETURNING number INTO n2;
    IF n1 <> 1 OR n2 <> 2 THEN RAISE EXCEPTION 'FAIL: numeracion % %', n1, n2; END IF;
    INSERT INTO public.ls_subtasks (issue_id, title) VALUES (v_issue, 'Paso 1');
    INSERT INTO public.ls_comments (issue_id, author_name, content) VALUES (v_issue, 'A', 'hola');
    log := log || 'A-crea-ok;';

    -- A no puede falsificar autor de comentario
    BEGIN
        INSERT INTO public.ls_comments (issue_id, author_id, author_name, content) VALUES (v_issue, ub, 'X', 'falso');
        RAISE EXCEPTION 'FAIL: A pudo comentar como B';
    EXCEPTION WHEN insufficient_privilege THEN log := log || 'A-no-falsifica-autor;'; END;

    -- === Usuario B (sin membresia) ===
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', ub::text, true);
    SET LOCAL ROLE authenticated;

    SELECT count(*) INTO n FROM public.ls_issues;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: B ve % issues ajenos', n; END IF;
    SELECT count(*) INTO n FROM public.ls_comments;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: B ve comentarios ajenos'; END IF;
    SELECT count(*) INTO n FROM public.ls_workspaces;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: B ve workspaces ajenos'; END IF;
    BEGIN
        INSERT INTO public.ls_issues (repository_id, title) VALUES (v_repo, 'intruso');
        RAISE EXCEPTION 'FAIL: B inserto en repo ajeno';
    EXCEPTION WHEN insufficient_privilege THEN log := log || 'B-no-inserta;'; END;
    UPDATE public.ls_issues SET title = 'hackeado' WHERE id = v_issue;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: B actualizo issue ajeno'; END IF;
    BEGIN
        PERFORM public.ls_add_member_by_email(v_ws, 'c-' || uc || '@ls.test', 'developer');
        RAISE EXCEPTION 'FAIL: B invito sin ser admin';
    EXCEPTION WHEN insufficient_privilege THEN log := log || 'B-no-invita;'; END;

    -- === A invita a B como viewer ===
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', ua::text, true);
    SET LOCAL ROLE authenticated;
    PERFORM public.ls_add_member_by_email(v_ws, 'b-' || ub || '@ls.test', 'viewer');
    BEGIN
        PERFORM public.ls_add_member_by_email(v_ws, 'b-' || ub || '@ls.test', 'owner');
        RAISE EXCEPTION 'FAIL: se asigno owner por invitacion';
    EXCEPTION WHEN insufficient_privilege THEN log := log || 'no-owner-por-invitacion;'; END;

    -- === B como viewer: lee pero no escribe ===
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', ub::text, true);
    SET LOCAL ROLE authenticated;
    SELECT count(*) INTO n FROM public.ls_issues;
    IF n <> 2 THEN RAISE EXCEPTION 'FAIL: viewer deberia ver 2 issues y ve %', n; END IF;
    SELECT count(*) INTO n FROM public.ls_comments;
    IF n <> 1 THEN RAISE EXCEPTION 'FAIL: viewer deberia ver 1 comentario'; END IF;
    BEGIN
        INSERT INTO public.ls_issues (repository_id, title) VALUES (v_repo, 'viewer escribe');
        RAISE EXCEPTION 'FAIL: viewer inserto';
    EXCEPTION WHEN insufficient_privilege THEN log := log || 'viewer-solo-lee;'; END;

    -- === A sube a B a developer: ahora escribe ===
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', ua, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', ua::text, true);
    SET LOCAL ROLE authenticated;
    PERFORM public.ls_add_member_by_email(v_ws, 'b-' || ub || '@ls.test', 'developer');
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', json_build_object('sub', ub, 'role', 'authenticated')::text, true);
    PERFORM set_config('request.jwt.claim.sub', ub::text, true);
    SET LOCAL ROLE authenticated;
    INSERT INTO public.ls_issues (repository_id, title) VALUES (v_repo, 'developer escribe') RETURNING number INTO n;
    IF n <> 3 THEN RAISE EXCEPTION 'FAIL: numero 3 esperado, fue %', n; END IF;
    UPDATE public.ls_issues SET status = 'done' WHERE id = v_issue;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n <> 1 THEN RAISE EXCEPTION 'FAIL: developer no pudo mover issue'; END IF;
    log := log || 'developer-escribe;';

    -- === anon: nada de datos ni RPC ===
    RESET ROLE;
    PERFORM set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
    PERFORM set_config('request.jwt.claim.sub', '', true);
    SET LOCAL ROLE anon;
    SELECT count(*) INTO n FROM public.ls_issues;
    IF n <> 0 THEN RAISE EXCEPTION 'FAIL: anon ve issues'; END IF;
    BEGIN
        PERFORM public.ls_create_workspace('x', 'x', 'x/x');
        RAISE EXCEPTION 'FAIL: anon ejecuto RPC';
    EXCEPTION WHEN insufficient_privilege THEN log := log || 'anon-bloqueado;'; END;

    RESET ROLE;
    RAISE EXCEPTION 'RLS_TESTS_PASSED %', log;
END $$;

