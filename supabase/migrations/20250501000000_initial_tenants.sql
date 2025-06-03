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
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current user ID
  current_user_id := auth.uid();
  
  -- If no authenticated user, return false
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is a member of the tenant
  RETURN EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = tenant_uuid
    AND user_id = current_user_id
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

-- Function to automatically create tenant owner when tenant is created
CREATE OR REPLACE FUNCTION "public"."create_tenant_owner"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Only create tenant owner if there's an authenticated user, this allows seeding to work
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.tenant_members (tenant_id, user_id, role)
    VALUES (NEW.id, auth.uid(), 'owner');
  END IF;
  
  RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."create_tenant_owner"() OWNER TO "postgres";

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

-- Triggers
CREATE OR REPLACE TRIGGER "handle_updated_at_price_tiers" BEFORE UPDATE ON "public"."price_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();
CREATE OR REPLACE TRIGGER "create_tenant_owner" AFTER INSERT ON "public"."tenants" FOR EACH ROW EXECUTE FUNCTION "public"."create_tenant_owner"();
CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

-- RLS Policies

-- Tenants RLS
CREATE POLICY "Allow public tenant reads" ON "public"."tenants" FOR SELECT USING (true);

CREATE POLICY "Only owners can delete tenants" ON "public"."tenants" FOR DELETE 
USING ("public"."is_tenant_owner"("id"));

CREATE POLICY "Only owners can update tenants" ON "public"."tenants" FOR UPDATE 
USING ("public"."is_tenant_owner"("id"));

CREATE POLICY "Authenticated users can create tenants" ON "public"."tenants" FOR INSERT 
TO "authenticated" 
WITH CHECK (true);

-- Invitations RLS
CREATE POLICY "Tenant owners can create invitations" ON "public"."invitations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "invitations"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()) AND ("tenant_members"."role" = 'owner'::"text")))));

CREATE POLICY "Tenant owners can delete invitations" ON "public"."invitations" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "invitations"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()) AND ("tenant_members"."role" = 'owner'::"text")))));

CREATE POLICY "Tenant owners can view invitations" ON "public"."invitations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members"
  WHERE (("tenant_members"."tenant_id" = "invitations"."tenant_id") AND ("tenant_members"."user_id" = "auth"."uid"()) AND ("tenant_members"."role" = 'owner'::"text")))));

-- Tenant Members RLS
CREATE POLICY "Tenant owners can delete tenant members" ON "public"."tenant_members" FOR DELETE USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Tenant owners can insert tenant members" ON "public"."tenant_members" FOR INSERT WITH CHECK ("public"."is_tenant_owner"("tenant_id") AND "public"."check_tenant_user_limit"("tenant_id"));

CREATE POLICY "Allow initial owner creation" ON "public"."tenant_members" FOR INSERT 
WITH CHECK (
  role = 'owner' AND 
  NOT EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = tenant_members.tenant_id
  )
);

CREATE POLICY "Tenant owners can update tenant members" ON "public"."tenant_members" FOR UPDATE USING ("public"."is_tenant_owner"("tenant_id"));

CREATE POLICY "Users can read tenant memberships" ON "public"."tenant_members" 
FOR SELECT TO "authenticated" 
USING (
  "auth"."uid"() = "user_id" OR 
  "public"."is_tenant_member"("tenant_id")
);

-- Profiles RLS
CREATE POLICY "Users can update their own profile" ON "public"."profiles" FOR UPDATE USING ("auth"."uid"() = "id");

CREATE POLICY "Tenant owners can update user profiles" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."tenant_members" "tm"
  WHERE (("tm"."user_id" = "profiles"."id") AND "public"."is_tenant_owner"("tm"."tenant_id")))));

CREATE POLICY "Users can view profiles of tenant members" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."tenant_members" "tm"
  WHERE (("tm"."user_id" = "profiles"."id") AND "public"."is_tenant_member"("tm"."tenant_id"))))));

-- Price Tiers RLS
CREATE POLICY "All can view price tiers" ON "public"."price_tiers" FOR SELECT USING (true);

-- Enable RLS
ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."price_tiers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tenant_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tenants" ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

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

GRANT ALL ON FUNCTION "public"."create_tenant_owner"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_tenant_owner"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_tenant_owner"() TO "service_role";

GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";

GRANT ALL ON TABLE "public"."price_tiers" TO "anon";
GRANT ALL ON TABLE "public"."price_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."price_tiers" TO "service_role";

GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";

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