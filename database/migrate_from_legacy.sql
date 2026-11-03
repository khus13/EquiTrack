-- =====================================================================
-- OPTIONAL: carry data over from the ORIGINAL EquiTrack database
-- (tables: users, categories, buildings, locations, reports)
--
-- Only needed if you already have a live database with real data.
-- Fresh installs can ignore this file.
--
-- STEP 1  Rename the old tables so the new schema does not drop them:
--           RENAME TABLE users TO legacy_users, categories TO legacy_categories,
--                        buildings TO legacy_buildings, locations TO legacy_locations,
--                        reports TO legacy_reports;
-- STEP 2  Import database/schema.sql  (creates the new tables + seed data)
-- STEP 3  Import THIS file (it copies rows from the legacy_* tables)
-- STEP 4  Copy old photos from  backend/public/uploads/*  into  backend/uploads/reports/
--         (this file stores each old photo as  reports/<old file name>)
--
-- Mapping rules
--   legacy role 'admin' -> admin,  'user' -> user   (super_admin only comes from seed)
--   legacy status: Unresolved -> Pending, Work In Progress -> In Progress, Resolved -> Solved
--   every migrated report gets priority 'Medium' and damage type 'Other'
--   all legacy buildings are assumed to be on the Talamban Campus (id 1)
-- =====================================================================

USE equitrack;

-- 1. Users (skip e-mails that already exist from the seed)
INSERT INTO users (role_id, first_name, last_name, email, password_hash, status, created_at)
SELECT CASE WHEN lu.role = 'admin' THEN 2 ELSE 1 END,
       lu.first_name, lu.last_name, lu.email, lu.password_hash, 'active', lu.created_at
FROM legacy_users lu
WHERE lu.email NOT IN (SELECT email FROM users);

-- 2. Categories and buildings that are not in the seed yet
INSERT INTO categories (name)
SELECT lc.name FROM legacy_categories lc
WHERE lc.name NOT IN (SELECT name FROM categories);

INSERT INTO buildings (campus_id, name)
SELECT 1, lb.name FROM legacy_buildings lb
WHERE lb.name NOT IN (SELECT name FROM buildings WHERE campus_id = 1);

-- 3. Locations -> rooms
INSERT INTO rooms (building_id, name)
SELECT nb.id, ll.name
FROM legacy_locations ll
JOIN legacy_buildings lb ON lb.id = ll.building_id
JOIN buildings nb        ON nb.name = lb.name AND nb.campus_id = 1
WHERE NOT EXISTS (SELECT 1 FROM rooms r WHERE r.building_id = nb.id AND r.name = ll.name);

-- 4. Reports (the 7 demo reports are already in the seed, so skip titles that match)
INSERT INTO reports (user_id, item_name, category_id, campus_id, building_id, room_id,
                     damage_type_id, description, priority, status, created_at, updated_at)
SELECT nu.id, lr.title, nc.id, 1, nb.id, nr.id,
       (SELECT id FROM damage_types WHERE name = 'Other'), lr.description, 'Medium',
       CASE lr.status WHEN 'Resolved' THEN 'Solved' WHEN 'Work In Progress' THEN 'In Progress' ELSE 'Pending' END,
       lr.created_at, lr.updated_at
FROM legacy_reports lr
JOIN legacy_users lu     ON lu.id = lr.user_id
JOIN users nu            ON nu.email = lu.email
JOIN legacy_categories c ON c.id = lr.category_id
JOIN categories nc       ON nc.name = c.name
JOIN legacy_buildings lb ON lb.id = lr.building_id
JOIN buildings nb        ON nb.name = lb.name AND nb.campus_id = 1
JOIN legacy_locations ll ON ll.id = lr.location_id
JOIN rooms nr            ON nr.building_id = nb.id AND nr.name = ll.name
WHERE NOT EXISTS (SELECT 1 FROM reports r WHERE r.item_name = lr.title AND r.user_id = nu.id);

-- 5. Reference numbers for the migrated rows
UPDATE reports SET reference_no = CONCAT('ET-', YEAR(created_at), '-', LPAD(id, 6, '0'))
WHERE reference_no IS NULL;

-- 6. Photos (file must be copied to backend/uploads/reports/ - see step 4 above)
INSERT INTO report_images (report_id, file_path, original_name, mime_type, file_size)
SELECT nr.id, CONCAT('reports/', lr.image_path), lr.image_path,
       CASE WHEN lr.image_path LIKE '%.png' THEN 'image/png' ELSE 'image/jpeg' END, 0
FROM legacy_reports lr
JOIN legacy_users lu ON lu.id = lr.user_id
JOIN users nu        ON nu.email = lu.email
JOIN reports nr      ON nr.item_name = lr.title AND nr.user_id = nu.id
WHERE lr.image_path IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM report_images ri WHERE ri.report_id = nr.id);

-- 7. First timeline entry for migrated reports
INSERT INTO report_status_history (report_id, old_status, new_status, changed_by, remarks, created_at)
SELECT r.id, NULL, r.status, r.user_id, 'Migrated from the original EquiTrack', r.created_at
FROM reports r
WHERE NOT EXISTS (SELECT 1 FROM report_status_history h WHERE h.report_id = r.id);
