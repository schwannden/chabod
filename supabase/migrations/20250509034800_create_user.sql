set check_function_bodies = off;

CREATE OR REPLACE FUNCTION auth.create_user(user_id uuid, email text, password text)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
  declare
  encrypted_pw text;
BEGIN
  encrypted_pw := crypt(password, gen_salt('bf'));
  
  INSERT INTO auth.users
    (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES
    ('00000000-0000-0000-0000-000000000000', user_id, 'authenticated', 'authenticated', email, encrypted_pw, '1483-11-10 00:00:00.000000+00', '{"provider":"email","providers":["email"]}', '{}', '1483-11-10 00:00:00.000000+00', '1483-11-10 00:00:00.000000+00', '', '', '', '');
  
  INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), user_id, user_id, format('{"sub":"%s","email":"%s"}', user_id::text, email)::jsonb, 'email', '1483-11-10 00:00:00.000000+00', '1483-11-10 00:00:00.000000+00', '1483-11-10 00:00:00.000000+00');
END;
$function$;