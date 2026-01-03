-- Enable public tenant joining via SECURITY DEFINER function
-- This bypasses RLS "chicken and egg" issues where non-members can't INSERT
-- into tenant_members even with permissive policies

-- ============================================
-- 1. Improve helper functions (SECURITY DEFINER for RLS bypass)
-- ============================================

-- Fix check_tenant_user_limit to properly bypass RLS and handle NULLs
CREATE OR REPLACE FUNCTION "public"."check_tenant_user_limit"("tenant_uuid" "uuid")
RETURNS boolean
LANGUAGE "sql"
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COUNT(*) < COALESCE(
    (SELECT pt.user_limit
     FROM tenants t
     JOIN price_tiers pt ON t.price_tier_id = pt.id
     WHERE t.id = tenant_uuid
    ),
    0
  )
  FROM tenant_members
  WHERE tenant_id = tenant_uuid;
$$;

ALTER FUNCTION "public"."check_tenant_user_limit"("tenant_uuid" "uuid") OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."check_tenant_user_limit"("tenant_uuid" "uuid") TO authenticated;

-- Fix is_tenant_owner to bypass RLS
CREATE OR REPLACE FUNCTION "public"."is_tenant_owner"("tenant_uuid" "uuid")
RETURNS boolean
LANGUAGE "sql"
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = tenant_uuid
    AND user_id = auth.uid()
    AND role = 'owner'
  );
$$;

ALTER FUNCTION "public"."is_tenant_owner"("tenant_uuid" "uuid") OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."is_tenant_owner"("tenant_uuid" "uuid") TO authenticated;

-- Fix is_tenant_member to bypass RLS
CREATE OR REPLACE FUNCTION "public"."is_tenant_member"("tenant_uuid" "uuid")
RETURNS boolean
LANGUAGE "sql"
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = tenant_uuid
    AND user_id = auth.uid()
  );
$$;

ALTER FUNCTION "public"."is_tenant_member"("tenant_uuid" "uuid") OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."is_tenant_member"("tenant_uuid" "uuid") TO authenticated;

-- ============================================
-- 2. Create join_tenant_as_member function (THE FIX)
-- ============================================

CREATE OR REPLACE FUNCTION "public"."join_tenant_as_member"(
  "p_tenant_id" "uuid",
  "p_user_id" "uuid"
)
RETURNS "uuid"
LANGUAGE "plpgsql"
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_member_id uuid;
BEGIN
  -- Security checks
  -- 1. User must be joining themselves
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot join another user to tenant';
  END IF;

  -- 2. Tenant must be under user limit
  IF NOT check_tenant_user_limit(p_tenant_id) THEN
    RAISE EXCEPTION 'Tenant has reached maximum user limit';
  END IF;

  -- 3. User cannot already be a member (idempotent)
  IF EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id
  ) THEN
    SELECT id INTO v_member_id
    FROM tenant_members
    WHERE tenant_id = p_tenant_id AND user_id = p_user_id;
    RETURN v_member_id;
  END IF;

  -- Insert the member (bypasses RLS)
  INSERT INTO tenant_members (tenant_id, user_id, role)
  VALUES (p_tenant_id, p_user_id, 'member')
  RETURNING id INTO v_member_id;

  RETURN v_member_id;
END;
$$;

ALTER FUNCTION "public"."join_tenant_as_member"("p_tenant_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";
GRANT EXECUTE ON FUNCTION "public"."join_tenant_as_member"("p_tenant_id" "uuid", "p_user_id" "uuid") TO authenticated;

COMMENT ON FUNCTION "public"."join_tenant_as_member" IS
  'Allows authenticated users to join a tenant as a member. Bypasses RLS via SECURITY DEFINER.';
