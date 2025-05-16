INSERT INTO "public"."price_tiers"
  ("id", "name", "price_monthly", "price_yearly", "description", "user_limit", "group_limit", "event_limit", "is_active")
VALUES
  ('0d8a9b6d-094d-48ef-9664-fe4d35ce3389', 'Free', '0.00', '0.00', '適合您開始嘗試所有的功能', '20', '5', '10', 'true'),
  ('dae40b57-0e84-475d-88db-a33063f70957', 'Starter', '300.00', '3000.00', '適合小型教會', '100', '10', '1000', 'true'),
  ('6352529f-90f4-4622-aeb3-cf542931cd88', 'Advanced', '600.00', '6000.00', '適合中小型教會', '800', '40', '5000', 'true'),
  ('b1f987b3-f3b4-4c71-ae4d-68d990c1c79f', 'Pro', '1000.00', '10000.00', '適合大型教會', '10000', '200', '30000', 'true');

SELECT auth.create_user('0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', 'admin@fruitful-tools.com', 'strongAndFruitfulPassword');
SELECT auth.create_user('d2e0a602-1214-4399-96ad-7d4f3dca75e5', 'love@fruitful-tools.com', 'strongAndFruitfulPassword');
SELECT auth.create_user('e7a6bea4-7f8b-436c-b87a-6846468aef8e', 'joy@fruitful-tools.com', 'strongAndFruitfulPassword');
SELECT auth.create_user('f1c713ff-cbb3-412a-858c-0f17dbde5f6a', 'peace@fruitful-tools.com', 'strongAndFruitfulPassword');


INSERT INTO "public"."profiles"
  ("id", "email", "full_name", "first_name", "last_name")
VALUES 
  ('0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', 'admin@fruitful-tools.com', '果頭', '頭', '果'), 
  ('d2e0a602-1214-4399-96ad-7d4f3dca75e5', 'love@fruitful-tools.com', '果仁愛', '仁愛', '果'), 
  ('e7a6bea4-7f8b-436c-b87a-6846468aef8e', 'joy@fruitful-tools.com', '果喜樂', '喜樂', '果'), 
  ('f1c713ff-cbb3-412a-858c-0f17dbde5f6a', 'peace@fruitful-tools.com', '果和平', '和平', '果');

INSERT INTO "public"."tenants"
  ("id", "name", "slug", "price_tier_id")
VALUES
  ('87332c35-a227-42f9-93cf-bf652f146dde', '多節果子教會', 'fruitful-church', 'dae40b57-0e84-475d-88db-a33063f70957'),
  ('c2e64a3f-2004-4f9c-8f41-0a61fbc6540b', '免費教會', 'free-church', '0d8a9b6d-094d-48ef-9664-fe4d35ce3389');
  
INSERT INTO
  "public"."tenant_members" ("tenant_id", "user_id", "role")
VALUES
  ('87332c35-a227-42f9-93cf-bf652f146dde', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', 'owner'),
  ('87332c35-a227-42f9-93cf-bf652f146dde', 'd2e0a602-1214-4399-96ad-7d4f3dca75e5', 'member'),
  ('87332c35-a227-42f9-93cf-bf652f146dde', 'e7a6bea4-7f8b-436c-b87a-6846468aef8e', 'member'),
  ('87332c35-a227-42f9-93cf-bf652f146dde', 'f1c713ff-cbb3-412a-858c-0f17dbde5f6a', 'member'),
  ('c2e64a3f-2004-4f9c-8f41-0a61fbc6540b', 'd2e0a602-1214-4399-96ad-7d4f3dca75e5', 'owner'),
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

INSERT INTO "public"."services"
  ("id", "name", "default_start_time", "default_end_time", "tenant_id")
VALUES
  ('37105f07-80d5-4755-b5d5-bc8278a4f4d7', '主日敬拜', '09:30:00', '11:30:00', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('a18bbdb8-b5aa-417e-a561-d86bc7bbb073', '禱告會', '19:30:00', '20:30:00', '87332c35-a227-42f9-93cf-bf652f146dde');

INSERT INTO "public"."service_roles"
  ("id", "name", "service_id", "tenant_id", "description")
VALUES
  ('12fdf75a-c30a-4e72-9552-dd27d5893e2c', '司琴', '37105f07-80d5-4755-b5d5-bc8278a4f4d7', '87332c35-a227-42f9-93cf-bf652f146dde', null),
  ('173be789-b4c6-4ff2-9e20-0502974d7f40', '領會', 'a18bbdb8-b5aa-417e-a561-d86bc7bbb073', '87332c35-a227-42f9-93cf-bf652f146dde', null),
  ('8cb49ff8-03df-4fb2-bb58-6075c0bc3e7f', '吉他', '37105f07-80d5-4755-b5d5-bc8278a4f4d7', '87332c35-a227-42f9-93cf-bf652f146dde', null),
  ('90abcc6d-5504-4a8a-9b29-790efdf66592', 'Vocal 1', '37105f07-80d5-4755-b5d5-bc8278a4f4d7', '87332c35-a227-42f9-93cf-bf652f146dde', null),
  ('ac1c18fe-ca4f-4699-9f42-772a55b0da14', '領會', '37105f07-80d5-4755-b5d5-bc8278a4f4d7', '87332c35-a227-42f9-93cf-bf652f146dde', null),
  ('da141d34-4ad2-4d20-87c7-5e698a2c457a', 'Vocal 2', '37105f07-80d5-4755-b5d5-bc8278a4f4d7', '87332c35-a227-42f9-93cf-bf652f146dde', null);

INSERT INTO "public"."service_notes"
  ("id", "text", "link", "service_id", "tenant_id")
VALUES
  ('0e9674dc-cee2-4891-b305-230047a1f3e0', '安排敬拜練習時間時，要記得包含練習前靈修的時間', null, '37105f07-80d5-4755-b5d5-bc8278a4f4d7', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('eafc67f7-d3ea-4df9-8a21-35b200715954', '9:50分會前禱告', null, '37105f07-80d5-4755-b5d5-bc8278a4f4d7', '87332c35-a227-42f9-93cf-bf652f146dde');

INSERT INTO "public"."service_groups"
  ("id", "group_id", "service_id")
VALUES
  ('30338996-4a36-4dbf-a28a-4bba05377261', 'adcf8b80-04f2-432a-9b56-185b4fdfd5bb', 'a18bbdb8-b5aa-417e-a561-d86bc7bbb073'),
  ('454fb53c-9a8d-43df-943d-b3175b0f3ec5', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e', 'a18bbdb8-b5aa-417e-a561-d86bc7bbb073'),
  ('61cdcc0e-3ca4-4226-be26-a180961e24e4', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e', '37105f07-80d5-4755-b5d5-bc8278a4f4d7');

INSERT INTO "public"."service_admins"
  ("id", "service_id", "user_id")
VALUES
  ('4dd9c66b-19b3-4814-bd99-7d5011b66a04', '37105f07-80d5-4755-b5d5-bc8278a4f4d7', 'e7a6bea4-7f8b-436c-b87a-6846468aef8e'),
  ('692fd5ab-bce9-484b-b42b-8180d8c6629f', 'a18bbdb8-b5aa-417e-a561-d86bc7bbb073', 'd2e0a602-1214-4399-96ad-7d4f3dca75e5');

INSERT INTO "public"."service_events"
  ("id", "service_id", "subtitle", "date", "start_time", "end_time", "tenant_id")
VALUES
  ('b435a298-294f-4f62-a8c4-7965f0af9cb1', '37105f07-80d5-4755-b5d5-bc8278a4f4d7', '約翰一書', CURRENT_DATE + 3, '09:30:00', '11:30:00', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('c140be1b-9b9d-47e6-b022-058af98d391c', 'a18bbdb8-b5aa-417e-a561-d86bc7bbb073', '可領聖餐', CURRENT_DATE + 14, '19:30:00', '20:30:00', '87332c35-a227-42f9-93cf-bf652f146dde');

INSERT INTO "public"."service_event_owners"
  ("service_event_id", "user_id", "service_role_id", "tenant_id")
VALUES
  ('c140be1b-9b9d-47e6-b022-058af98d391c', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', '173be789-b4c6-4ff2-9e20-0502974d7f40', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('b435a298-294f-4f62-a8c4-7965f0af9cb1', 'd2e0a602-1214-4399-96ad-7d4f3dca75e5', 'ac1c18fe-ca4f-4699-9f42-772a55b0da14', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('b435a298-294f-4f62-a8c4-7965f0af9cb1', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', '90abcc6d-5504-4a8a-9b29-790efdf66592', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('b435a298-294f-4f62-a8c4-7965f0af9cb1', 'e7a6bea4-7f8b-436c-b87a-6846468aef8e', '12fdf75a-c30a-4e72-9552-dd27d5893e2c', '87332c35-a227-42f9-93cf-bf652f146dde');

INSERT INTO "public"."events" 
  ("id", "date", "start_time", "end_time", "name", "description", "created_by", "event_link", "visibility", "tenant_id")
VALUES
  ('0f7fb345-dd64-4eb3-bc58-0de570dccfda', '2025-07-26', '09:30:00', '12:00:00', '長執會', '宣福組提聖誕計畫', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'private', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('651aa7de-01a4-425f-9982-c91610acc5ed', '2025-11-22', '09:30:00', '12:00:00', '長執會', '確認明年度預算', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'private', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('73e562bf-3a68-4acc-8859-dae47ed9a87b', '2025-09-27', '09:30:00', '12:00:00', '長執會', '各組提預算', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'private', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('82acc7b9-2adf-461b-ae80-af8187410d7b', '2025-01-04', '09:30:00', '12:00:00', '長執會暨擴大同工會', '安排教會年度行事曆', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('a17f2133-d77a-4af3-af04-011e6e71cbe3', '2025-03-29', '09:30:00', '12:00:00', '長執會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'private', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('b607565e-0d03-4038-8831-1901f350e448', '2025-05-17', '09:30:00', '12:00:00', '長執會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'private', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('07ac45d8-a3c7-4ede-a9a1-f7e5f7fde6d2', '2025-01-11', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('2d50a88d-e429-4ec9-a535-b3c26b68650d', '2025-02-01', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('8c5fe9b7-3ad2-4d19-c2fb-45f9b6a85da4', '2025-03-01', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('9d6af0c8-4be3-4e0a-d3ac-56a0c7b96eb5', '2025-04-12', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('4c1fe5bd-9ad8-4d5f-c8fb-01f5bc41da0a', '2025-04-03', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('7f4cb8ea-2dab-4a8c-fbce-34c8ef74ad3a', '2025-06-07', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('9b6edaac-4fcd-4c0e-bdea-56e0ab96cf5a', '2025-07-05', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('3f0cbed4-8dab-4a4c-fbce-90c4ef30ad9a', '2025-07-02', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('7d4afcb8-2bef-4e8a-dfac-34a8cd74eb3a', '2025-09-06', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('3d0afcbe-8bef-4e4b-dfac-90a9cd30eb9a', '2025-10-04', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('7b4ed8a6-2fc1-4c28-b1ea-34e3ab74cf3a', '2025-11-01', '12:30:00', '13:30:00', '小家長聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('1f8cbeda-6dab-4a2d-fbce-78c7ef18ad7a', '2025-11-06', '12:30:00', '13:30:00', '小家長聚會(會餐)', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('1a95d8a3-92c5-4b62-9e9b-f71c2c6848b5', '2025-01-22', null, null, '兒童冬令營', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('3c8bf01a-1f20-4f12-8c70-cd2e13e49b48', '2025-02-02', null, null, '大年初五新春禮拜', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('4e17a933-9cb7-4d85-8bf2-93bb01cd3a5f', '2025-02-22', null, null, '免費市集外籍生專場', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('5f2cb6e4-8d9a-4e56-9f78-12c8f3e52a71', '2025-02-23', null, null, '第一季成人主日學開始', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('6a3dc7f5-1eb0-4f37-a0d9-23d7f4e63b82', '2025-02-28', null, null, '兒主退修會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('7b4ed8a6-2fc1-4c28-b1ea-34e8a5f74c93', '2025-03-01', null, null, '兒主退修會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('0e7ba1d9-5cf4-4f1b-e4bd-67b1d8a07fc6', '2025-04-18', null, null, '受難日擘餅禱告會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('1f8cb2ea-6da5-4a2c-f5ce-78c2e9b18ad7', '2025-04-20', null, null, '復活節特別聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('2a9dc3fb-7eb6-4b3d-a6df-89d3fa29be8a', '2025-04-20', null, null, '第一季成人主日學結束', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('3b0ed4ac-8fc7-4c4e-b7ea-90e4ab30cf9a', '2025-04-27', '13:00:00', '14:00:00', '禱告小組凝聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('5d2af6ce-0be9-4e6a-d9ac-12a6cd52eb1a', '2025-04-04', null, null, '第二季成人主日學開始', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('6e3ba7df-1cfa-4f7b-eabd-23b7de63fc2a', '2025-04-11', null, null, '母親節福音特別聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('8a5dc9fb-3ebc-4b9d-acdf-45d9fa85be4a', '2025-06-29', null, null, '第二季成人主日學結束', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('0c7febb1-5ade-4d1f-cefb-67f1bc07da6a', '2025-07-07', null, null, '兒童夏令營', '(7/8~7-9)', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('1d8afcc2-6bef-4e2a-dfac-78a2cd18eb7a', '2025-07-08', null, null, '兒童夏令營', '(7/8~7-9)', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('2e9badd3-7cfa-4f3b-eabd-89b3de29fc8a', '2025-07-09', null, null, '兒童夏令營', '(7/8~7-9)', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('4a1dcfe5-9ebc-4b5d-acdf-01d5fa41be0a', '2025-07-03', null, null, '音控訓練', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('5b2edaf6-0fcd-4c6e-bdea-12e6ab52cf1a', '2025-07-17', null, null, '宣教月特別活動（座談會）', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('6c3feba7-1ade-4d7f-cefb-23f7bc63da2a', '2025-07-24', null, null, '宣教月特別活動(海外短宣隊分享)', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('9f6cbeda-4dab-4a0c-fbce-56e0ab96cf5a', '2025-09-20', null, null, '樂服協會理監事會議', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('1b8edafc-6fcd-4c2f-bdea-78e7ab18cf7a', '2025-09-14', '13:00:00', '14:00:00', '禱告小組凝聚會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('4e1badcf-9cfa-4f5c-eabd-01b0de41fc0a', '2025-10-04', null, null, '中秋免費市集外籍生專場(待訂)', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('8e5badc9-3cfa-4f9b-eabd-45b9de85fc4a', '2025-09-07', '13:00:00', '14:00:00', '第三季成人主日學第一堂', '(于厚恩牧師)', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('0a7dcfeb-5ebc-4b1e-acdf-67d6fa07be6a', '2025-09-21', '13:00:00', '14:00:00', '第三季成人主日學第二堂', '(于厚恩牧師)', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('2c9febad-7ade-4d3a-cefb-89f8bc29da8a', '2025-09-28', '13:00:00', '14:00:00', '第三季成人主日學第三堂', '(于厚恩牧師)', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('5f2cbeda-0dab-4a6d-fbce-12c1ef52ad1a', '2025-10-19', '13:00:00', '14:00:00', '第三季成人主日學第四堂', '(于厚恩牧師)', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('6a3dc7f5-1eb0-4f37-a0d9-23d2fa63be2a', '2025-10-26', '13:00:00', '14:00:00', '第三季成人主日學第五堂', '(于厚恩牧師)', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('8c5febad-3ade-4d9a-cefb-45f4bc85da4a', '2025-11-02', '13:00:00', '14:00:00', '第三季成人主日學第六堂', '(于厚恩牧師)', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('9d6afcbe-4bef-4e0b-dfac-56a5cd96eb5a', '2025-11-09', '13:00:00', '14:00:00', '第三季成人主日學第七堂', '(于厚恩牧師)', '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('0e7badcf-5cfa-4f1c-eabd-67b6de07fc6a', '2025-11-16', '13:00:00', '14:00:00', 'JK 20週年年度感恩茶會', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('2a9dc3fb-7ebc-4b3e-acdf-89d8fa29be8a', '2025-11-20', null, null, '聖誕特別活動', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('3b0ed4ac-8fcd-4c4f-bdea-90e9ab30cf9a', '2025-11-21', null, null, '聖誕福音主日', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde'),
  ('4c1febad-9ade-4d5a-cefb-01f0bc41da0a', '2025-11-28', null, null, '年終感恩聚餐(一家一菜)', null, '0b56e2b5-e3cf-43d0-9aca-f8a538fb512b', null, 'public', '87332c35-a227-42f9-93cf-bf652f146dde');

INSERT INTO "public"."events_groups" 
  ("event_id", "group_id")
VALUES
  ('b607565e-0d03-4038-8831-1901f350e448', '492030d6-b314-4731-bd7d-edf83d60ad83'),
  ('82acc7b9-2adf-461b-ae80-af8187410d7b', 'adcf8b80-04f2-432a-9b56-185b4fdfd5bb'),
  ('a17f2133-d77a-4af3-af04-011e6e71cbe3', '492030d6-b314-4731-bd7d-edf83d60ad83'),
  ('b607565e-0d03-4038-8831-1901f350e448', 'adcf8b80-04f2-432a-9b56-185b4fdfd5bb'),
  ('82acc7b9-2adf-461b-ae80-af8187410d7b', '492030d6-b314-4731-bd7d-edf83d60ad83'),
  ('0f7fb345-dd64-4eb3-bc58-0de570dccfda', '492030d6-b314-4731-bd7d-edf83d60ad83'),
  ('651aa7de-01a4-425f-9982-c91610acc5ed', '492030d6-b314-4731-bd7d-edf83d60ad83'),
  ('a17f2133-d77a-4af3-af04-011e6e71cbe3', 'adcf8b80-04f2-432a-9b56-185b4fdfd5bb'),
  ('0f7fb345-dd64-4eb3-bc58-0de570dccfda', 'adcf8b80-04f2-432a-9b56-185b4fdfd5bb'),
  ('73e562bf-3a68-4acc-8859-dae47ed9a87b', '492030d6-b314-4731-bd7d-edf83d60ad83'),
  ('73e562bf-3a68-4acc-8859-dae47ed9a87b', 'adcf8b80-04f2-432a-9b56-185b4fdfd5bb'),
  ('651aa7de-01a4-425f-9982-c91610acc5ed', 'adcf8b80-04f2-432a-9b56-185b4fdfd5bb'),
  ('07ac45d8-a3c7-4ede-a9a1-f7e5f7fde6d2', '751d28e2-9763-4826-a596-254028625e51'),
  ('1a95d8a3-92c5-4b62-9e9b-f71c2c6848b5', '2addaa35-bbad-43b8-8fe7-ffc505a2576f'),
  ('2d50a88d-e429-4ec9-a535-b3c26b68650d', '751d28e2-9763-4826-a596-254028625e51'),
  ('3c8bf01a-1f20-4f12-8c70-cd2e13e49b48', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e'),
  ('4e17a933-9cb7-4d85-8bf2-93bb01cd3a5f', '2addaa35-bbad-43b8-8fe7-ffc505a2576f'),
  ('5f2cb6e4-8d9a-4e56-9f78-12c8f3e52a71', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('6a3dc7f5-1eb0-4f37-a0d9-23d7f4e63b82', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('7b4ed8a6-2fc1-4c28-b1ea-34e8a5f74c93', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('8c5fe9b7-3ad2-4d19-c2fb-45f9b6a85da4', '751d28e2-9763-4826-a596-254028625e51'),
  ('9d6af0c8-4be3-4e0a-d3ac-56a0c7b96eb5', '751d28e2-9763-4826-a596-254028625e51'),
  ('0e7ba1d9-5cf4-4f1b-e4bd-67b1d8a07fc6', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e'),
  ('1f8cb2ea-6da5-4a2c-f5ce-78c2e9b18ad7', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e'),
  ('2a9dc3fb-7eb6-4b3d-a6df-89d3fa29be8a', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('3b0ed4ac-8fc7-4c4e-b7ea-90e4ab30cf9a', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e'),
  ('4c1fe5bd-9ad8-4d5f-c8fb-01f5bc41da0a', '751d28e2-9763-4826-a596-254028625e51'),
  ('5d2af6ce-0be9-4e6a-d9ac-12a6cd52eb1a', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('6e3ba7df-1cfa-4f7b-eabd-23b7de63fc2a', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e'),
  ('7f4cb8ea-2dab-4a8c-fbce-34c8ef74ad3a', '751d28e2-9763-4826-a596-254028625e51'),
  ('8a5dc9fb-3ebc-4b9d-acdf-45d9fa85be4a', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('9b6edaac-4fcd-4c0e-bdea-56e0ab96cf5a', '751d28e2-9763-4826-a596-254028625e51'),
  ('0c7febb1-5ade-4d1f-cefb-67f1bc07da6a', '2addaa35-bbad-43b8-8fe7-ffc505a2576f'),
  ('1d8afcc2-6bef-4e2a-dfac-78a2cd18eb7a', '2addaa35-bbad-43b8-8fe7-ffc505a2576f'),
  ('2e9badd3-7cfa-4f3b-eabd-89b3de29fc8a', '2addaa35-bbad-43b8-8fe7-ffc505a2576f'),
  ('3f0cbed4-8dab-4a4c-fbce-90c4ef30ad9a', '751d28e2-9763-4826-a596-254028625e51'),
  ('4a1dcfe5-9ebc-4b5d-acdf-01d5fa41be0a', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e'),
  ('5b2edaf6-0fcd-4c6e-bdea-12e6ab52cf1a', '2addaa35-bbad-43b8-8fe7-ffc505a2576f'),
  ('6c3feba7-1ade-4d7f-cefb-23f7bc63da2a', '2addaa35-bbad-43b8-8fe7-ffc505a2576f'),
  ('7d4afcb8-2bef-4e8a-dfac-34a8cd74eb3a', '751d28e2-9763-4826-a596-254028625e51'),
  ('8e5badc9-3cfa-4f9b-eabd-45b9de85fc4a', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('0a7dcfeb-5ebc-4b1e-acdf-67d6fa07be6a', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('1b8edafc-6fcd-4c2f-bdea-78e7ab18cf7a', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e'),
  ('2c9febad-7ade-4d3a-cefb-89f8bc29da8a', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('3d0afcbe-8bef-4e4b-dfac-90a9cd30eb9a', '751d28e2-9763-4826-a596-254028625e51'),
  ('4e1badcf-9cfa-4f5c-eabd-01b0de41fc0a', '2addaa35-bbad-43b8-8fe7-ffc505a2576f'),
  ('5f2cbeda-0dab-4a6d-fbce-12c1ef52ad1a', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('6a3dc7f5-1eb0-4f37-a0d9-23d2fa63be2a', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('7b4ed8a6-2fc1-4c28-b1ea-34e3ab74cf3a', '751d28e2-9763-4826-a596-254028625e51'),
  ('8c5febad-3ade-4d9a-cefb-45f4bc85da4a', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('9d6afcbe-4bef-4e0b-dfac-56a5cd96eb5a', '4bee998c-a65e-4f65-9b39-8aeaf983269b'),
  ('0e7badcf-5cfa-4f1c-eabd-67b6de07fc6a', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e'),
  ('1f8cbeda-6dab-4a2d-fbce-78c7ef18ad7a', '751d28e2-9763-4826-a596-254028625e51'),
  ('2a9dc3fb-7ebc-4b3e-acdf-89d8fa29be8a', '2addaa35-bbad-43b8-8fe7-ffc505a2576f'),
  ('3b0ed4ac-8fcd-4c4f-bdea-90e9ab30cf9a', '39646a19-ec3a-46a0-9ca9-bfecb556eb5e'),
  ('4c1febad-9ade-4d5a-cefb-01f0bc41da0a', 'ab25cfe2-8d48-41e0-b312-9b1c37d423cc');
