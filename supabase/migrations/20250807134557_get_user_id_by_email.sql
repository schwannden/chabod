set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(p_email text, p_tenant_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = ''
AS $function$
BEGIN
    -- CRITICAL: Only allow tenant owners to call this function
    -- Use existing is_tenant_owner function pattern
    IF NOT public.is_tenant_owner(p_tenant_id) THEN
        RAISE EXCEPTION 'Access denied: Only tenant owners can look up users' USING ERRCODE = 'P0001';
    END IF;

    -- Return user ID if found, NULL if not found
    RETURN (
        SELECT id
        FROM auth.users
        WHERE email = p_email
        LIMIT 1
    );
END;
$function$;

-- Grant execution to authenticated users (RLS handles authorization)
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text, uuid) TO authenticated;