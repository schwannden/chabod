-- Function to check tenant group limits
CREATE OR REPLACE FUNCTION "public"."check_tenant_group_limit"("tenant_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Get the current count of groups for this tenant
  SELECT COUNT(*) INTO current_count 
  FROM public.groups 
  WHERE tenant_id = tenant_uuid;
  
  -- Get the group limit from the price tier
  SELECT pt.group_limit INTO max_limit
  FROM public.tenants t
  JOIN public.price_tiers pt ON t.price_tier_id = pt.id
  WHERE t.id = tenant_uuid;
  
  -- Return true if we're under the limit
  RETURN current_count < max_limit;
END;
$$;
ALTER FUNCTION "public"."check_tenant_group_limit"("tenant_uuid" "uuid") OWNER TO "postgres";

-- When a user is removed from a tenant, remove them from all groups in that tenant
-- we need this as a function, not as a cascade rule, because when a user is removed from a tenant, it might still exist in the system.
CREATE OR REPLACE FUNCTION "public"."remove_user_from_groups"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  DELETE FROM public.group_members gm
  USING public.groups g
  WHERE gm.group_id = g.id
  AND g.tenant_id = OLD.tenant_id
  AND gm.user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$;
ALTER FUNCTION "public"."remove_user_from_groups"() OWNER TO "postgres";

-- Tables
CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."groups" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "group_id" "uuid" NOT NULL REFERENCES "public"."groups"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "group_members_group_id_user_id_key" UNIQUE ("group_id", "user_id")
);
ALTER TABLE "public"."group_members" OWNER TO "postgres";

-- Triggers
CREATE OR REPLACE TRIGGER "remove_user_from_groups" AFTER DELETE ON "public"."tenant_members" FOR EACH ROW EXECUTE FUNCTION "public"."remove_user_from_groups"();

-- RLS Policies
CREATE POLICY "Tenant owners can insert groups" ON "public"."groups" FOR INSERT WITH CHECK ("public"."is_tenant_owner"("tenant_id") AND "public"."check_tenant_group_limit"("tenant_id"));

CREATE POLICY "Tenant owners can update groups" ON "public"."groups" FOR UPDATE USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Tenant owners can delete groups" ON "public"."groups" FOR DELETE USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Tenant owners can insert group members" ON "public"."group_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."groups" "g"
  WHERE (("group_members"."group_id" = "g"."id") AND "public"."is_tenant_owner"("g"."tenant_id")))));

CREATE POLICY "Tenant owners can update group members" ON "public"."group_members" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."groups" "g"
  WHERE (("group_members"."group_id" = "g"."id") AND "public"."is_tenant_owner"("g"."tenant_id")))));

CREATE POLICY "Tenant owners can delete group members" ON "public"."group_members" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."groups" "g"
  WHERE (("group_members"."group_id" = "g"."id") AND "public"."is_tenant_owner"("g"."tenant_id")))));

CREATE POLICY "Users can view groups in their tenants" ON "public"."groups" FOR SELECT USING ("public"."is_tenant_member"("tenant_id"));

CREATE POLICY "Users can view group members in their tenants" ON "public"."group_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."groups" "g"
  WHERE (("group_members"."group_id" = "g"."id") AND "public"."is_tenant_member"("g"."tenant_id")))));

-- Enable RLS
ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON FUNCTION "public"."check_tenant_group_limit"("tenant_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_tenant_group_limit"("tenant_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_tenant_group_limit"("tenant_uuid" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."remove_user_from_groups"() TO "anon";
GRANT ALL ON FUNCTION "public"."remove_user_from_groups"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_user_from_groups"() TO "service_role";

GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";

GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role"; 