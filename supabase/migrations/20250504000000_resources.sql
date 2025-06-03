-- Tables
CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "name" "text" NOT NULL,
    "description" "text",
    "url" "text",
    "icon" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."resources" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."resources_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "resource_id" "uuid" NOT NULL REFERENCES "public"."resources"("id") ON DELETE CASCADE,
    "group_id" "uuid" NOT NULL REFERENCES "public"."groups"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "resources_groups_resource_id_group_id_key" UNIQUE ("resource_id", "group_id")
);
ALTER TABLE "public"."resources_groups" OWNER TO "postgres";

-- Triggers
CREATE OR REPLACE TRIGGER "handle_updated_at_resources" BEFORE UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "handle_updated_at_resources_groups" BEFORE UPDATE ON "public"."resources_groups" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

-- RLS Policies

-- Resources RLS
CREATE POLICY "Tenant owners can insert resources" ON "public"."resources" FOR INSERT WITH CHECK ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Tenant owners can update resources" ON "public"."resources" FOR UPDATE USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Tenant owners can delete resources" ON "public"."resources" FOR DELETE USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Tenant members can view resources" ON "public"."resources" FOR SELECT USING ("public"."is_tenant_member"("tenant_id"));

-- Resources Groups RLS
CREATE POLICY "Tenant owners can insert resource-group associations" ON "public"."resources_groups" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."resources" "r"
  WHERE (("r"."id" = "resources_groups"."resource_id") AND "public"."is_tenant_owner"("r"."tenant_id")))));

CREATE POLICY "Tenant owners can update resource-group associations" ON "public"."resources_groups" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."resources" "r"
  WHERE (("r"."id" = "resources_groups"."resource_id") AND "public"."is_tenant_owner"("r"."tenant_id")))));

CREATE POLICY "Tenant owners can delete resource-group associations" ON "public"."resources_groups" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."resources" "r"
  WHERE (("r"."id" = "resources_groups"."resource_id") AND "public"."is_tenant_owner"("r"."tenant_id")))));

CREATE POLICY "Tenant members can view resource-group associations" ON "public"."resources_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."resources" "r"
  WHERE (("r"."id" = "resources_groups"."resource_id") AND "public"."is_tenant_member"("r"."tenant_id")))));

-- Enable RLS
ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."resources_groups" ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";

GRANT ALL ON TABLE "public"."resources_groups" TO "anon";
GRANT ALL ON TABLE "public"."resources_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."resources_groups" TO "service_role"; 