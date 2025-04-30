-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."profiles";

-- Create the new policy that allows both self-updates and updates by tenant owners
CREATE POLICY "Users can update own profile or owners can update members" 
ON "public"."profiles"
FOR UPDATE 
USING (
  auth.uid() = profiles.id OR 
  EXISTS (
    SELECT 1 
    FROM tenant_members tm1
    JOIN tenant_members tm2 ON tm1.tenant_id = tm2.tenant_id
    WHERE tm1.user_id = auth.uid() 
    AND tm1.role = 'owner'
    AND tm2.user_id = profiles.id
  )
); 