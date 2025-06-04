-- Function to check tenant event limits
CREATE OR REPLACE FUNCTION "public"."check_tenant_event_limit"("tenant_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET search_path = ''
    AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Get the current count of events for this tenant
  SELECT COUNT(*) INTO current_count 
  FROM public.events 
  WHERE tenant_id = tenant_uuid;
  
  -- Get the event limit from the price tier
  SELECT COALESCE(pt.event_limit, 0) INTO max_limit
  FROM public.tenants t
  JOIN public.price_tiers pt ON t.price_tier_id = pt.id
  WHERE t.id = tenant_uuid;
  
  -- If no limit found, default to 0 (block creation)
  IF max_limit IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Return true if we're under the limit
  RETURN current_count < max_limit;
END;
$$;
ALTER FUNCTION "public"."check_tenant_event_limit"("tenant_uuid" "uuid") OWNER TO "postgres";

-- Helper function to validate event creation in tests
CREATE OR REPLACE FUNCTION "public"."validate_event_creation"(
  "tenant_uuid" "uuid",
  "user_uuid" "uuid"
) 
RETURNS TABLE(
  is_member boolean,
  under_limit boolean,
  can_create boolean
)
LANGUAGE "plpgsql" 
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  member_check boolean;
  limit_check boolean;
BEGIN
  -- Check if user is tenant member
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = tenant_uuid
    AND user_id = user_uuid
  ) INTO member_check;
  
  -- Check if under event limit
  SELECT public.check_tenant_event_limit(tenant_uuid) INTO limit_check;
  
  -- Return all checks
  RETURN QUERY SELECT 
    member_check as is_member,
    limit_check as under_limit,
    (member_check AND limit_check) as can_create;
END;
$$;

-- Tables
CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "name" "text" NOT NULL,
    "description" "text",
    "created_by" "uuid" REFERENCES "auth"."users"("id") ON DELETE SET NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_link" "text",
    "visibility" "public"."event_visibility" DEFAULT 'public'::"public"."event_visibility" NOT NULL,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."events" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."events_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "event_id" "uuid" NOT NULL REFERENCES "public"."events"("id") ON DELETE CASCADE,
    "group_id" "uuid" NOT NULL REFERENCES "public"."groups"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "events_groups_event_id_group_id_key" UNIQUE ("event_id", "group_id")
);
ALTER TABLE "public"."events_groups" OWNER TO "postgres";

-- Triggers
CREATE OR REPLACE TRIGGER "handle_updated_at_events" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

-- RLS Policies

-- Events RLS
CREATE POLICY "Anyone can view public events" ON "public"."events" FOR SELECT USING (("visibility" = 'public'::"public"."event_visibility"));

CREATE POLICY "Tenant members can view all events" ON "public"."events" FOR SELECT USING ("public"."is_tenant_member"("tenant_id"));

CREATE POLICY "Event creator can update and delete their own events" ON "public"."events" 
FOR UPDATE 
TO "public"
USING ("created_by" = (select auth.uid()))
WITH CHECK ("created_by" = (select auth.uid()));

CREATE POLICY "Event creator can delete their own events" ON "public"."events" 
FOR DELETE 
TO "public"
USING ("created_by" = (select auth.uid()));

CREATE POLICY "Tenant owners can update events within the tenant" ON "public"."events" 
FOR UPDATE 
TO "public"
USING ("public"."is_tenant_owner"("tenant_id"))
WITH CHECK ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Tenant owners can delete events within the tenant" ON "public"."events" 
FOR DELETE 
TO "public"
USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Users can create events within their tenants" ON "public"."events" FOR INSERT 
TO "authenticated"
WITH CHECK (
  -- Must be a tenant member
  "public"."is_tenant_member"("tenant_id") 
  -- Must match the created_by field (ensures user can only create events for themselves)
  AND "created_by" = (select auth.uid())
  -- Must not exceed tenant event limits (this combines the separate limit policy)
  AND "public"."check_tenant_event_limit"("tenant_id")
);

CREATE POLICY "Block anonymous event creation" ON "public"."events"
FOR INSERT
TO "anon"
WITH CHECK (FALSE);

-- Events Groups RLS
CREATE POLICY "Anyone can view groups for public events" ON "public"."events_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "events_groups"."event_id") AND ("events"."visibility" = 'public'::"public"."event_visibility")))));

CREATE POLICY "Tenant members can view all event groups" ON "public"."events_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "events_groups"."event_id") AND "public"."is_tenant_member"("e"."tenant_id")))));

CREATE POLICY "Event creator their own event groups" ON "public"."events_groups" 
FOR ALL
USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "events_groups"."event_id") AND ("e"."created_by" = (select auth.uid()))))));

CREATE POLICY "Tenant owners can manage event groups within the tenant" ON "public"."events_groups" 
FOR ALL
USING (EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "events_groups"."event_id") AND "public"."is_tenant_owner"("e"."tenant_id"))));

CREATE POLICY "Users can create event groups within their tenants" ON "public"."events_groups" FOR INSERT 
TO "authenticated" 
WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "events_groups"."event_id") AND "public"."is_tenant_member"("e"."tenant_id")))));

-- Enable RLS
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events_groups" ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON FUNCTION "public"."check_tenant_event_limit"("tenant_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_tenant_event_limit"("tenant_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_tenant_event_limit"("tenant_uuid" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."validate_event_creation"("tenant_uuid" "uuid", "user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_event_creation"("tenant_uuid" "uuid", "user_uuid" "uuid") TO "service_role";
GRANT ALL ON FUNCTION "public"."validate_event_creation"("tenant_uuid" "uuid", "user_uuid" "uuid") TO "anon";

GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";

GRANT ALL ON TABLE "public"."events_groups" TO "anon";
GRANT ALL ON TABLE "public"."events_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."events_groups" TO "service_role"; 