SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."services" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "name" "text" NOT NULL,
    "default_start_time" time without time zone,
    "default_end_time" time without time zone,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "services_name_tenant_id_key" UNIQUE ("name", "tenant_id")
);
ALTER TABLE "public"."services" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_admins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "service_id" "uuid" NOT NULL REFERENCES "public"."services"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "service_admins_service_id_user_id_key" UNIQUE ("service_id", "user_id")
);
ALTER TABLE "public"."service_admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "group_id" "uuid" NOT NULL REFERENCES "public"."groups"("id") ON DELETE CASCADE,
    "service_id" "uuid" NOT NULL REFERENCES "public"."services"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "service_groups_group_id_service_id_key" UNIQUE ("group_id", "service_id")
);
ALTER TABLE "public"."service_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "text" "text" NOT NULL,
    "link" "text",
    "service_id" "uuid" NOT NULL REFERENCES "public"."services"("id") ON DELETE CASCADE,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);
ALTER TABLE "public"."service_notes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "name" "text" NOT NULL,
    "service_id" "uuid" NOT NULL REFERENCES "public"."services"("id") ON DELETE CASCADE,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    CONSTRAINT "service_roles_name_service_id_tenant_id_key" UNIQUE ("name", "service_id", "tenant_id")
);
ALTER TABLE "public"."service_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "service_id" "uuid" NOT NULL REFERENCES "public"."services"("id") ON DELETE CASCADE,
    "subtitle" "text",
    "date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."service_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."service_event_owners" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "service_event_id" "uuid" NOT NULL REFERENCES "public"."service_events"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL REFERENCES "public"."profiles"("id") ON DELETE CASCADE,
    "service_role_id" "uuid" NOT NULL REFERENCES "public"."service_roles"("id") ON DELETE CASCADE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    CONSTRAINT "service_event_owners_service_event_id_user_id_service_role_id_key" UNIQUE ("service_event_id", "user_id", "service_role_id")
);
ALTER TABLE "public"."service_event_owners" OWNER TO "postgres";


CREATE OR REPLACE TRIGGER "handle_updated_at_service_admins" BEFORE UPDATE ON "public"."service_admins" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "handle_updated_at_service_event_owners" BEFORE UPDATE ON "public"."service_event_owners" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "handle_updated_at_service_events" BEFORE UPDATE ON "public"."service_events" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "handle_updated_at_service_groups" BEFORE UPDATE ON "public"."service_groups" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "handle_updated_at_service_notes" BEFORE UPDATE ON "public"."service_notes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "handle_updated_at_service_roles" BEFORE UPDATE ON "public"."service_roles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "handle_updated_at_services" BEFORE UPDATE ON "public"."services" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();


-- RLS Policies

-- service RLS

CREATE POLICY "Authenticated tenant user can view service event owners" ON "public"."service_event_owners" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_event_owners"."tenant_id") AND ("tenant_members"."user_id" = (select auth.uid()))))));

CREATE POLICY "Service groups can be managed by tenant owners" ON "public"."service_groups" USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."tenant_members" "tm" ON (("tm"."tenant_id" = "s"."tenant_id")))
  WHERE (("s"."id" = "service_groups"."service_id") AND ("tm"."user_id" = (select auth.uid())) AND ("tm"."role" = 'owner'::"text")))));

CREATE POLICY "Service groups can be viewed by tenant members" ON "public"."service_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."tenant_members" "tm" ON (("tm"."tenant_id" = "s"."tenant_id")))
  WHERE (("s"."id" = "service_groups"."service_id") AND ("tm"."user_id" = (select auth.uid()))))));

CREATE POLICY "Service notes can be managed by tenant owners and service admin" ON "public"."service_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_notes"."tenant_id") AND ("tenant_members"."user_id" = (select auth.uid())) AND (("tenant_members"."role" = 'owner'::"text") OR (EXISTS ( SELECT 1
           FROM "public"."service_admins"
          WHERE (("service_admins"."service_id" = "service_notes"."service_id") AND ("service_admins"."user_id" = (select auth.uid()))))))))));

CREATE POLICY "Service notes can be viewed by tenant members" ON "public"."service_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_notes"."tenant_id") AND ("tenant_members"."user_id" = (select auth.uid()))))));

CREATE POLICY "Service roles can be managed by tenant owners" ON "public"."service_roles" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_roles"."tenant_id") AND ("tenant_members"."user_id" = (select auth.uid())) AND ("tenant_members"."role" = 'owner'::"text")))));

CREATE POLICY "Service roles can be viewed by tenant members" ON "public"."service_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_roles"."tenant_id") AND ("tenant_members"."user_id" = (select auth.uid()))))));

CREATE POLICY "Tenant members can view services" ON "public"."services" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "services"."tenant_id") AND ("tenant_members"."user_id" = (select auth.uid()))))));

CREATE POLICY "Tenant owners can manage services" ON "public"."services" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "services"."tenant_id") AND ("tenant_members"."user_id" = (select auth.uid())) AND ("tenant_members"."role" = 'owner'::"text")))));

CREATE POLICY "Service admins can be managed by tenant owners" ON "public"."service_admins" USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."tenant_members" "tm" ON (("tm"."tenant_id" = "s"."tenant_id")))
  WHERE (("s"."id" = "service_admins"."service_id") AND ("tm"."user_id" = (select auth.uid())) AND ("tm"."role" = 'owner'::"text")))));

CREATE POLICY "Service admins can be viewed by tenant members" ON "public"."service_admins" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."tenant_members" "tm" ON (("tm"."tenant_id" = "s"."tenant_id")))
  WHERE (("s"."id" = "service_admins"."service_id") AND ("tm"."user_id" = (select auth.uid()))))));

-- service events RLS

CREATE POLICY "Authenticated tenant user can view service events" ON "public"."service_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_events"."tenant_id") AND ("tenant_members"."user_id" = (select auth.uid()))))));

CREATE POLICY "Service admins can manage service event owners" ON "public"."service_event_owners" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."service_events" "se"
     JOIN "public"."service_admins" "sa" ON (("sa"."service_id" = "se"."service_id")))
  WHERE (("se"."id" = "service_event_owners"."service_event_id") AND ("sa"."user_id" = (select auth.uid()))))));

CREATE POLICY "Service admins can manage service events" ON "public"."service_events" USING ((EXISTS ( SELECT 1
   FROM "public"."service_admins"
  WHERE (("service_admins"."service_id" = "service_events"."service_id") AND ("service_admins"."user_id" = (select auth.uid()))))));

CREATE POLICY "Tenant owners can manage service event owners" ON "public"."service_event_owners" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members" "tm"
  WHERE (("tm"."tenant_id" = "service_event_owners"."tenant_id") AND ("tm"."user_id" = (select auth.uid())) AND ("tm"."role" = 'owner'::"text")))));

CREATE POLICY "Tenant owners can manage service events" ON "public"."service_events" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members" "tm"
  WHERE (("tm"."tenant_id" = "service_events"."tenant_id") AND ("tm"."user_id" = (select auth.uid())) AND ("tm"."role" = 'owner'::"text")))));


ALTER TABLE "public"."service_admins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_event_owners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;


GRANT ALL ON TABLE "public"."service_admins" TO "anon";
GRANT ALL ON TABLE "public"."service_admins" TO "authenticated";
GRANT ALL ON TABLE "public"."service_admins" TO "service_role";

GRANT ALL ON TABLE "public"."service_event_owners" TO "anon";
GRANT ALL ON TABLE "public"."service_event_owners" TO "authenticated";
GRANT ALL ON TABLE "public"."service_event_owners" TO "service_role";

GRANT ALL ON TABLE "public"."service_events" TO "anon";
GRANT ALL ON TABLE "public"."service_events" TO "authenticated";
GRANT ALL ON TABLE "public"."service_events" TO "service_role";

GRANT ALL ON TABLE "public"."service_groups" TO "anon";
GRANT ALL ON TABLE "public"."service_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."service_groups" TO "service_role";

GRANT ALL ON TABLE "public"."service_notes" TO "anon";
GRANT ALL ON TABLE "public"."service_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."service_notes" TO "service_role";

GRANT ALL ON TABLE "public"."service_roles" TO "anon";
GRANT ALL ON TABLE "public"."service_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."service_roles" TO "service_role";

GRANT ALL ON TABLE "public"."services" TO "anon";
GRANT ALL ON TABLE "public"."services" TO "authenticated";
GRANT ALL ON TABLE "public"."services" TO "service_role";


ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";


RESET ALL;
