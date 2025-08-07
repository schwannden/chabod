-- Simplified Account Deletion Database Functions
-- Replaces edge function dependency with SECURITY DEFINER database functions
-- Email typing confirmation is sufficient, no token system needed

-- Function to check if user can delete their account
CREATE OR REPLACE FUNCTION "public"."check_user_deletion_eligibility"("p_user_id" uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_blocker_tenants json[];
    v_tenant record;
    v_other_owners_count integer;
BEGIN
    v_blocker_tenants := ARRAY[]::json[];

    -- Check if user is sole owner of any tenants
    FOR v_tenant IN 
        SELECT t.id, t.name, t.slug 
        FROM public.tenants t
        JOIN public.tenant_members tm ON t.id = tm.tenant_id
        WHERE tm.user_id = p_user_id AND tm.role = 'owner'
    LOOP
        -- Count other owners for this tenant
        SELECT COUNT(*) INTO v_other_owners_count
        FROM public.tenant_members tm2
        WHERE tm2.tenant_id = v_tenant.id 
        AND tm2.role = 'owner' 
        AND tm2.user_id != p_user_id;
        
        -- If no other owners, this is a blocker
        IF v_other_owners_count = 0 THEN
            v_blocker_tenants := v_blocker_tenants || json_build_object(
                'type', 'sole_tenant_owner',
                'tenantId', v_tenant.id,
                'tenantName', v_tenant.name
            );
        END IF;
    END LOOP;

    -- Return eligibility result
    RETURN json_build_object(
        'canDelete', array_length(v_blocker_tenants, 1) IS NULL,
        'blockers', v_blocker_tenants
    );
END;
$$;

ALTER FUNCTION "public"."check_user_deletion_eligibility"("p_user_id" uuid) OWNER TO "postgres";

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION "public"."check_user_deletion_eligibility"("uuid") TO authenticated;

-- Simplified function to delete user account directly
-- Email confirmation handled in UI, no tokens needed
CREATE OR REPLACE FUNCTION "public"."delete_user_account"(
    "p_user_id" uuid
)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_eligibility json;
BEGIN
    -- CRITICAL: Validate user identity - can only delete own account
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: Cannot delete other users account'
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    
    -- Check business rules - user must not be sole owner of any tenants
    SELECT public.check_user_deletion_eligibility(p_user_id) INTO v_eligibility;
    
    IF NOT (v_eligibility->>'canDelete')::boolean THEN
        RAISE EXCEPTION 'Account deletion blocked: %', 
            (v_eligibility->>'blockers')::text
            USING ERRCODE = 'check_violation';
    END IF;
    
    -- CASCADE DELETE: Deleting from auth.users will cascade to:
    -- - profiles (ON DELETE CASCADE)
    -- - tenant_members (ON DELETE CASCADE) 
    -- - events.created_by will be set to NULL (preserve events but anonymize)
    DELETE FROM auth.users WHERE id = p_user_id;
    
    -- If we reach here, deletion was successful
    RETURN json_build_object(
        'success', true,
        'deleted_at', now(),
        'message', 'Account successfully deleted'
    );
END;
$$;

ALTER FUNCTION "public"."delete_user_account"("p_user_id" uuid) OWNER TO "postgres";


-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION "public"."delete_user_account"("uuid") TO authenticated;

-- Comments for documentation
COMMENT ON FUNCTION "public"."delete_user_account"("uuid") IS 'Securely deletes user account after validating eligibility. Email confirmation handled in UI.';

-- Simplified Account Deletion System Functions:
-- - check_user_deletion_eligibility: validates if user can be deleted
-- - delete_user_account: deletes user account with eligibility check