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


CREATE TYPE "public"."event_visibility" AS ENUM (
    'public',
    'private'
);
ALTER TYPE "public"."event_visibility" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_tenant_event_limit"("tenant_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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
  SELECT pt.event_limit INTO max_limit
  FROM public.tenants t
  JOIN public.price_tiers pt ON t.price_tier_id = pt.id
  WHERE t.id = tenant_uuid;
  
  -- Return true if we're under the limit
  RETURN current_count < max_limit;
END;
$$;
ALTER FUNCTION "public"."check_tenant_event_limit"("tenant_uuid" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."check_tenant_user_limit"("tenant_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_count INTEGER;
  max_limit INTEGER;
BEGIN
  -- Get the current count of members for this tenant
  SELECT COUNT(*) INTO current_count 
  FROM public.tenant_members 
  WHERE tenant_id = tenant_uuid;
  
  -- Get the user limit from the price tier
  SELECT pt.user_limit INTO max_limit
  FROM public.tenants t
  JOIN public.price_tiers pt ON t.price_tier_id = pt.id
  WHERE t.id = tenant_uuid;
  
  -- Return true if we're under the limit or at the limit
  RETURN current_count < max_limit;
END;
$$;
ALTER FUNCTION "public"."check_tenant_user_limit"("tenant_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_tenant_member"("tenant_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = tenant_uuid
    AND user_id = auth.uid()
  );
END;
$$;
ALTER FUNCTION "public"."is_tenant_member"("tenant_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_tenant_owner"("tenant_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.tenant_members
        WHERE tenant_id = tenant_uuid 
        AND user_id = auth.uid()
        AND role = 'owner'
    );
END;
$$;
ALTER FUNCTION "public"."is_tenant_owner"("tenant_uuid" "uuid") OWNER TO "postgres";


-- When a user is removed from a tenant, remove them from all groups in that tenant
-- we need this as a function, not as a cascade rule, because when a user is removed fro a tenant, it might still exists in the system.
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

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."price_tiers" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" text NOT NULL,
    "price_monthly" numeric(10,2) NOT NULL,
    "price_yearly" numeric(10,2) NOT NULL,
    "description" text,
    "user_limit" integer NOT NULL,
    "group_limit" integer NOT NULL,
    "event_limit" integer NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE "public"."price_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" uuid NOT NULL PRIMARY KEY,
    "email" text NOT NULL,
    "full_name" text,
    "avatar_url" text,
    "updated_at" timestamptz DEFAULT now(),
    "first_name" text,
    "last_name" text,
    CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS public.tenants (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "created_at" timestamptz DEFAULT now() NOT NULL,
    "updated_at" timestamptz DEFAULT now() NOT NULL,
    "price_tier_id" uuid NOT NULL REFERENCES "public"."price_tiers"("id") ON DELETE RESTRICT
);
CREATE INDEX "idx_tenants_slug" ON "public"."tenants" USING "btree" ("slug");
ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenant_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "user_id" "uuid" NOT NULL REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tenant_members_tenant_id_user_id_key" UNIQUE ("tenant_id", "user_id"),
    CONSTRAINT "tenant_members_user_id_profiles_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE
);
ALTER TABLE "public"."tenant_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "email" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "token" "text" NOT NULL UNIQUE,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 days'::interval) NOT NULL
);
ALTER TABLE "public"."invitations" OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL PRIMARY KEY,
    "tenant_id" "uuid" NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "name" "text" NOT NULL,
    "description" "text",
    "url" "text" NOT NULL,
    "icon" "text" NOT NULL,
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
CREATE OR REPLACE TRIGGER "handle_updated_at_resources" BEFORE UPDATE ON "public"."resources" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "handle_updated_at_events" BEFORE UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "handle_updated_at_price_tiers" BEFORE UPDATE ON "public"."price_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "handle_updated_at_resources_groups" BEFORE UPDATE ON "public"."resources_groups" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();

CREATE OR REPLACE TRIGGER "remove_user_from_groups" AFTER DELETE ON "public"."tenant_members" FOR EACH ROW EXECUTE FUNCTION "public"."remove_user_from_groups"();

-- RLS Policies

-- Tenants RLS
CREATE POLICY "Allow public tenant reads" ON "public"."tenants" FOR SELECT USING (true);

CREATE POLICY "Only owners can delete tenants" ON "public"."tenants" FOR DELETE 
USING ("public"."is_tenant_owner"("id"));

CREATE POLICY "Only owners can update tenants" ON "public"."tenants" FOR UPDATE 
USING ("public"."is_tenant_owner"("id"));

CREATE POLICY "Tenant owners can create invitations" ON "public"."invitations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "invitations"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()) AND ("tenant_members"."role" = 'owner'::"text")))));

CREATE POLICY "Tenant owners can delete invitations" ON "public"."invitations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "invitations"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()) AND ("tenant_members"."role" = 'owner'::"text")))));

CREATE POLICY "Tenant owners can view invitations" ON "public"."invitations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "invitations"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()) AND ("tenant_members"."role" = 'owner'::"text")))));

CREATE POLICY "Tenant owners can delete tenant members" ON "public"."tenant_members" FOR DELETE USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Tenant owners can insert tenant members" ON "public"."tenant_members" FOR INSERT WITH CHECK ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Tenant owners can update tenant members" ON "public"."tenant_members" FOR UPDATE USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Users can read tenant memberships" ON "public"."tenant_members" 
FOR SELECT TO "authenticated" 
USING (
  "auth"."uid"() = "user_id" OR 
  "public"."is_tenant_member"("tenant_id")
);

CREATE POLICY "enforce_tenant_event_limit" ON "public"."events" FOR INSERT WITH CHECK ("public"."check_tenant_event_limit"("tenant_id"));

CREATE POLICY "enforce_tenant_group_limit" ON "public"."groups" FOR INSERT WITH CHECK ("public"."check_tenant_group_limit"("tenant_id"));

CREATE POLICY "enforce_tenant_user_limit" ON "public"."tenant_members" FOR INSERT WITH CHECK ("public"."check_tenant_user_limit"("tenant_id"));

-- users RLS

CREATE POLICY "Users can update own profile or owners can update members" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() = "id") OR (EXISTS ( SELECT 1
   FROM ("public"."tenant_members" "tm1"
     JOIN "public"."tenant_members" "tm2" ON (("tm1"."tenant_id" = "tm2"."tenant_id")))
  WHERE (("tm1"."user_id" = "auth"."uid"()) AND ("tm1"."role" = 'owner'::"text") AND ("tm2"."user_id" = "profiles"."id"))))));

CREATE POLICY "Users can view profiles of tenant members" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."tenant_members" "tm"
  WHERE (("tm"."user_id" = "profiles"."id") AND (EXISTS ( SELECT 1
           FROM "public"."tenant_members" "self"
          WHERE (("self"."user_id" = "auth"."uid"()) AND ("self"."tenant_id" = "tm"."tenant_id")))))))));

-- price_tiers RLS
CREATE POLICY "All can view price tiers" ON "public"."price_tiers" FOR SELECT USING (true);

CREATE POLICY "Only allow administrators to modify price_tiers" ON "public"."price_tiers" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."user_id" = "auth"."uid"()) AND ("tenant_members"."role" = 'owner'::"text")))));

-- events RLS
-- TODO: this appears to be not working, as we need that everyone can view roups as well
CREATE POLICY "Anyone can view groups for public events" ON "public"."events_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."events"
  WHERE (("events"."id" = "events_groups"."event_id") AND ("events"."visibility" = 'public'::"public"."event_visibility")))));

CREATE POLICY "Anyone can view public events" ON "public"."events" FOR SELECT USING (("visibility" = 'public'::"public"."event_visibility"));

CREATE POLICY "Authenticated users can view private events" ON "public"."events" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("visibility" = 'private'::"public"."event_visibility")));

CREATE POLICY "Creators and tenant owners can modify events" ON "public"."events" USING ((("created_by" = "auth"."uid"()) OR ( SELECT "public"."is_tenant_owner"("events"."tenant_id") AS "is_tenant_owner"))) WITH CHECK ((("created_by" = "auth"."uid"()) OR ( SELECT "public"."is_tenant_owner"("events"."tenant_id") AS "is_tenant_owner")));

CREATE POLICY "Only event creators and tenant owners can modify event groups" ON "public"."events_groups" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "events_groups"."event_id") AND (("e"."created_by" = "auth"."uid"()) OR ( SELECT "public"."is_tenant_owner"("e"."tenant_id") AS "is_tenant_owner")))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "events_groups"."event_id") AND (("e"."created_by" = "auth"."uid"()) OR ( SELECT "public"."is_tenant_owner"("e"."tenant_id") AS "is_tenant_owner"))))));

CREATE POLICY "Owners and creators can delete events" ON "public"."events" FOR DELETE USING ((("created_by" = "auth"."uid"()) OR "public"."is_tenant_owner"("tenant_id")));

CREATE POLICY "Owners and creators can manage event group associations" ON "public"."events_groups" USING ((EXISTS ( SELECT 1
   FROM "public"."events" "e"
  WHERE (("e"."id" = "events_groups"."event_id") AND (("e"."created_by" = "auth"."uid"()) OR "public"."is_tenant_owner"("e"."tenant_id"))))));

CREATE POLICY "Owners and creators can update events" ON "public"."events" FOR UPDATE USING ((("created_by" = "auth"."uid"()) OR "public"."is_tenant_owner"("tenant_id")));

CREATE POLICY "Tenant members can view all event groups" ON "public"."events_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."events" "e"
     JOIN "public"."tenant_members" "tm" ON (("tm"."tenant_id" = "e"."tenant_id")))
  WHERE (("e"."id" = "events_groups"."event_id") AND ("tm"."user_id" = "auth"."uid"())))));

CREATE POLICY "Tenant members can view all events" ON "public"."events" FOR SELECT USING ((( SELECT (EXISTS ( SELECT 1
           FROM "public"."tenant_members"
          WHERE (("tenant_members"."tenant_id" = "events"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"())))) AS "exists") IS TRUE));

CREATE POLICY "Users can create events" ON "public"."events" FOR INSERT WITH CHECK ((("auth"."role"() = 'authenticated'::"text") AND ("tenant_id" IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "events"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()))))));

-- service RLS

CREATE POLICY "Authenticated tenant user can view service event owners" ON "public"."service_event_owners" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_event_owners"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"())))));

CREATE POLICY "Service groups can be managed by tenant owners" ON "public"."service_groups" USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."tenant_members" "tm" ON (("tm"."tenant_id" = "s"."tenant_id")))
  WHERE (("s"."id" = "service_groups"."service_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'owner'::"text")))));

CREATE POLICY "Service groups can be viewed by tenant members" ON "public"."service_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."tenant_members" "tm" ON (("tm"."tenant_id" = "s"."tenant_id")))
  WHERE (("s"."id" = "service_groups"."service_id") AND ("tm"."user_id" = "auth"."uid"())))));

CREATE POLICY "Service notes can be managed by tenant owners and service admin" ON "public"."service_notes" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_notes"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()) AND (("tenant_members"."role" = 'owner'::"text") OR (EXISTS ( SELECT 1
           FROM "public"."service_admins"
          WHERE (("service_admins"."service_id" = "service_notes"."service_id") AND ("service_admins"."user_id" = "auth"."uid"())))))))));

CREATE POLICY "Service notes can be viewed by tenant members" ON "public"."service_notes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_notes"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"())))));

CREATE POLICY "Service roles can be managed by tenant owners" ON "public"."service_roles" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_roles"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()) AND ("tenant_members"."role" = 'owner'::"text")))));

CREATE POLICY "Service roles can be viewed by tenant members" ON "public"."service_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_roles"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"())))));

CREATE POLICY "Tenant members can view services" ON "public"."services" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "services"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"())))));

CREATE POLICY "Tenant owners can manage services" ON "public"."services" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "services"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()) AND ("tenant_members"."role" = 'owner'::"text")))));

CREATE POLICY "Service admins can be managed by tenant owners" ON "public"."service_admins" USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."tenant_members" "tm" ON (("tm"."tenant_id" = "s"."tenant_id")))
  WHERE (("s"."id" = "service_admins"."service_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'owner'::"text")))));

CREATE POLICY "Service admins can be viewed by tenant members" ON "public"."service_admins" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."services" "s"
     JOIN "public"."tenant_members" "tm" ON (("tm"."tenant_id" = "s"."tenant_id")))
  WHERE (("s"."id" = "service_admins"."service_id") AND ("tm"."user_id" = "auth"."uid"())))));

-- service events RLS

CREATE POLICY "Authenticated tenant user can view service events" ON "public"."service_events" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "service_events"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"())))));

CREATE POLICY "Service admins can manage service event owners" ON "public"."service_event_owners" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."service_events" "se"
     JOIN "public"."service_admins" "sa" ON (("sa"."service_id" = "se"."service_id")))
  WHERE (("se"."id" = "service_event_owners"."service_event_id") AND ("sa"."user_id" = "auth"."uid"())))));

CREATE POLICY "Service admins can manage service events" ON "public"."service_events" USING ((EXISTS ( SELECT 1
   FROM "public"."service_admins"
  WHERE (("service_admins"."service_id" = "service_events"."service_id") AND ("service_admins"."user_id" = "auth"."uid"())))));

CREATE POLICY "Tenant owners can manage service event owners" ON "public"."service_event_owners" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members" "tm"
  WHERE (("tm"."tenant_id" = "service_event_owners"."tenant_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'owner'::"text")))));

CREATE POLICY "Tenant owners can manage service events" ON "public"."service_events" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members" "tm"
  WHERE (("tm"."tenant_id" = "service_events"."tenant_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'owner'::"text")))));

-- resources RLS

CREATE POLICY "Only tenant owners can create resources" ON "public"."resources" FOR INSERT
WITH CHECK ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Only tenant owners can delete resources" ON "public"."resources" FOR DELETE
USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Only tenant owners can update resources" ON "public"."resources" FOR UPDATE
USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Tenant members can view resources" ON "public"."resources" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "resources"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"())))));

CREATE POLICY "Tenant members can view resource-group associations" ON "public"."resources_groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."resources" "r"
     JOIN "public"."tenant_members" "tm" ON (("r"."tenant_id" = "tm"."tenant_id")))
  WHERE (("r"."id" = "resources_groups"."resource_id") AND ("tm"."user_id" = "auth"."uid"())))));

CREATE POLICY "Tenant owners can manage resource-group associations" ON "public"."resources_groups" USING ((EXISTS ( SELECT 1
   FROM ("public"."resources" "r"
     JOIN "public"."tenant_members" "tm" ON (("r"."tenant_id" = "tm"."tenant_id")))
  WHERE (("r"."id" = "resources_groups"."resource_id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'owner'::"text")))));

-- groups RLS

CREATE POLICY "Tenant owners can manage groups" ON "public"."groups" USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "groups"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()) AND ("tenant_members"."role" = 'owner'::"text")))));

CREATE POLICY "Tenant owners can manage group members" ON "public"."group_members" USING ((EXISTS ( SELECT 1
   FROM ("public"."groups" "g"
     JOIN "public"."tenant_members" "tm" ON (("g"."tenant_id" = "tm"."tenant_id")))
  WHERE (("group_members"."group_id" = "g"."id") AND ("tm"."user_id" = "auth"."uid"()) AND ("tm"."role" = 'owner'::"text")))));

CREATE POLICY "Users can view groups in their tenants" ON "public"."groups" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "groups"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"())))));

CREATE POLICY "Users can view group members in their tenants" ON "public"."group_members" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."groups" "g"
     JOIN "public"."tenant_members" "tm" ON (("g"."tenant_id" = "tm"."tenant_id")))
  WHERE (("group_members"."group_id" = "g"."id") AND ("tm"."user_id" = "auth"."uid"())))));




ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."price_tiers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."resources_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_admins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_event_owners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."services" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tenant_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;



ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


GRANT ALL ON FUNCTION "public"."check_tenant_event_limit"("tenant_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_tenant_event_limit"("tenant_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_tenant_event_limit"("tenant_uuid" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."check_tenant_group_limit"("tenant_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_tenant_group_limit"("tenant_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_tenant_group_limit"("tenant_uuid" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."check_tenant_user_limit"("tenant_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_tenant_user_limit"("tenant_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_tenant_user_limit"("tenant_uuid" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."is_tenant_member"("tenant_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_tenant_member"("tenant_uuid" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."is_tenant_owner"("tenant_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_tenant_owner"("tenant_uuid" "uuid") TO "service_role";

GRANT ALL ON FUNCTION "public"."remove_user_from_groups"() TO "anon";
GRANT ALL ON FUNCTION "public"."remove_user_from_groups"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_user_from_groups"() TO "service_role";

GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";

GRANT ALL ON TABLE "public"."events_groups" TO "anon";
GRANT ALL ON TABLE "public"."events_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."events_groups" TO "service_role";

GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";

GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";

GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";

GRANT ALL ON TABLE "public"."price_tiers" TO "anon";
GRANT ALL ON TABLE "public"."price_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."price_tiers" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";

GRANT ALL ON TABLE "public"."resources_groups" TO "anon";
GRANT ALL ON TABLE "public"."resources_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."resources_groups" TO "service_role";

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

GRANT ALL ON TABLE "public"."tenant_members" TO "anon";
GRANT ALL ON TABLE "public"."tenant_members" TO "authenticated";
GRANT ALL ON TABLE "public"."tenant_members" TO "service_role";

GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";


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
