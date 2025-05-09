INSERT INTO "public"."price_tiers"
  ("id", "name", "price_monthly", "price_yearly", "description", "user_limit", "group_limit", "event_limit", "is_active")
VALUES
  ('0d8a9b6d-094d-48ef-9664-fe4d35ce3389', 'Free', '0.00', '0.00', '適合您開始嘗試所有的功能', '20', '5', '10', 'true'),
  ('dae40b57-0e84-475d-88db-a33063f70957', 'Starter', '300.00', '3000.00', '適合小型教會', '100', '10', '1000', 'true'),
  ('6352529f-90f4-4622-aeb3-cf542931cd88', 'Advanced', '600.00', '6000.00', '適合中小型教會', '800', '40', '5000', 'true'),
  ('b1f987b3-f3b4-4c71-ae4d-68d990c1c79f', 'Pro', '1000.00', '10000.00', '適合大型教會', '10000', '200', '30000', 'true');

SELECT auth.create_user('0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', 'admin@fruitful-tools.com', 'password');
SELECT auth.create_user('d2e0a602-1214-4399-96ad-7d4f3dca75e5', 'love@fruitful-tools.com', 'password');
SELECT auth.create_user('e7a6bea4-7f8b-436c-b87a-6846468aef8e', 'joy@fruitful-tools.com', 'password');
SELECT auth.create_user('f1c713ff-cbb3-412a-858c-0f17dbde5f6a', 'peace@fruitful-tools.com', 'password');


INSERT INTO "public"."profiles"
  ("id", "email", "full_name", "first_name", "last_name")
VALUES 
  ('0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', 'admin@fruitful-tools.com', '果頭', '頭', '果'), 
  ('d2e0a602-1214-4399-96ad-7d4f3dca75e5', 'love@fruitful-tools.com', '果仁愛', '仁愛', '果'), 
  ('e7a6bea4-7f8b-436c-b87a-6846468aef8e', 'joy@fruitful-tools.com', '果喜樂', '喜樂', '果'), 
  ('f1c713ff-cbb3-412a-858c-0f17dbde5f6a', 'peace@fruitful-tools.com', '果和平', '和平', '果');

INSERT INTO "public"."tenants"
  ("id", "name", "slug", "owner_id", "price_tier_id")
VALUES
  ('87332c35-a227-42f9-93cf-bf652f146dde', '多節果子教會', 'fruitful-church', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', 'dae40b57-0e84-475d-88db-a33063f70957'),
  ('c2e64a3f-2004-4f9c-8f41-0a61fbc6540b', '免費教會', 'free-church', 'd2e0a602-1214-4399-96ad-7d4f3dca75e5', '0d8a9b6d-094d-48ef-9664-fe4d35ce3389');
  
INSERT INTO
  "public"."tenant_members" ("tenant_id", "user_id", "role")
VALUES
  ('87332c35-a227-42f9-93cf-bf652f146dde', 'f1c713ff-cbb3-412a-858c-0f17dbde5f6a', 'member'),
  ('87332c35-a227-42f9-93cf-bf652f146dde', 'd2e0a602-1214-4399-96ad-7d4f3dca75e5', 'member'),
  ('87332c35-a227-42f9-93cf-bf652f146dde', 'e7a6bea4-7f8b-436c-b87a-6846468aef8e', 'member'),
  ('c2e64a3f-2004-4f9c-8f41-0a61fbc6540b', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', 'member');

INSERT INTO "public"."groups"
  ("id", "tenant_id", "name", "description")
VALUES
  ('2addaa35-bbad-43b8-8fe7-ffc505a2576f', '87332c35-a227-42f9-93cf-bf652f146dde', '宣福組', '福音，宣教'),
  ('39646a19-ec3a-46a0-9ca9-bfecb556eb5e', '87332c35-a227-42f9-93cf-bf652f146dde', '敬拜組', '敬拜，特殊節期'),
  ('492030d6-b314-4731-bd7d-edf83d60ad83', '87332c35-a227-42f9-93cf-bf652f146dde', '長執會', '長執會，年度計劃，教會預算'),
  ('4bee998c-a65e-4f65-9b39-8aeaf983269b', '87332c35-a227-42f9-93cf-bf652f146dde', '教育組', '成主、兒主'),
  ('751d28e2-9763-4826-a596-254028625e51', '87332c35-a227-42f9-93cf-bf652f146dde', '關懷組', '小家長，探訪'),
  ('ab25cfe2-8d48-41e0-b312-9b1c37d423cc', '87332c35-a227-42f9-93cf-bf652f146dde', '行政組', '行政，財務，總務，維修，維護'),
  ('adcf8b80-04f2-432a-9b56-185b4fdfd5bb', '87332c35-a227-42f9-93cf-bf652f146dde', '教牧', '教會全職傳道人與牧師');