-- Allow users to join any tenant as a member
-- This enables public signup from tenant auth pages

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Users can join tenant as member" ON "public"."tenant_members";

-- Create new policy allowing authenticated users to add themselves as members
CREATE POLICY "Users can join tenant as member"
ON "public"."tenant_members"
FOR INSERT
WITH CHECK (
  -- User can only add themselves
  user_id = auth.uid()
  -- Must be member role (not owner)
  AND role = 'member'
  -- Tenant must not exceed user limit
  AND check_tenant_user_limit(tenant_id)
);
