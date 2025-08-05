-- Tenant metadata feature implementation
-- Adds tenant_meta table with administrative information for churches

BEGIN;

-- Function to handle updated_at trigger for tenant_meta
CREATE OR REPLACE FUNCTION "public"."set_tenant_meta_updated_at"()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create tenant metadata when tenant is created
CREATE OR REPLACE FUNCTION "public"."create_tenant_meta_on_tenant_insert"()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO "public"."tenant_meta" ("tenant_id", "contact_email", "address")
  VALUES (NEW.id, '', '');  -- Empty defaults for required fields
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create tenant_meta table
CREATE TABLE IF NOT EXISTS "public"."tenant_meta" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  "tenant_id" uuid NOT NULL UNIQUE REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
  "tax_id" text,                                  -- 統一編號 (optional)
  "contact_email" text NOT NULL,                  -- 聯絡電子郵件 (required)
  "address" text NOT NULL,                        -- 地址 (required)  
  "website" text,                                 -- 網址 (optional)
  "phone_number" text,                            -- 教會電話 (optional)
  "verified" boolean NOT NULL DEFAULT false,      -- 驗證通過 (required, default false)
  "verified_time" timestamptz,                    -- 驗證通過時間 (optional)
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE "public"."tenant_meta" OWNER TO "postgres";

-- Triggers
CREATE TRIGGER "set_tenant_meta_updated_at"
  BEFORE UPDATE ON "public"."tenant_meta"  
  FOR EACH ROW EXECUTE FUNCTION "public"."set_tenant_meta_updated_at"();

CREATE TRIGGER "create_tenant_meta_on_tenant_creation"
  AFTER INSERT ON "public"."tenants"
  FOR EACH ROW EXECUTE FUNCTION "public"."create_tenant_meta_on_tenant_insert"();

-- RLS Policies
CREATE POLICY "Allow all users to read tenant meta" ON "public"."tenant_meta"
  FOR SELECT USING (true);

CREATE POLICY "Only tenant owners can update tenant meta" ON "public"."tenant_meta"  
  FOR UPDATE USING ("public"."is_tenant_owner"("tenant_id"));

-- Allow automatic creation of tenant meta via trigger (when tenant is created)
CREATE POLICY "Allow automatic tenant meta creation" ON "public"."tenant_meta"
  FOR INSERT WITH CHECK (true);

-- Service role access for admin operations
CREATE POLICY "Service role can manage tenant meta" ON "public"."tenant_meta"
  FOR ALL TO "service_role" USING (true) WITH CHECK (true);

-- Enable RLS
ALTER TABLE "public"."tenant_meta" ENABLE ROW LEVEL SECURITY;

-- Function grants
GRANT ALL ON FUNCTION "public"."set_tenant_meta_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_tenant_meta_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_tenant_meta_updated_at"() TO "service_role";

GRANT ALL ON FUNCTION "public"."create_tenant_meta_on_tenant_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_tenant_meta_on_tenant_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_tenant_meta_on_tenant_insert"() TO "service_role";

-- Table grants
GRANT ALL ON TABLE "public"."tenant_meta" TO "anon";
GRANT ALL ON TABLE "public"."tenant_meta" TO "authenticated";  
GRANT ALL ON TABLE "public"."tenant_meta" TO "service_role";

COMMIT;