-- =====================================================================
-- EquiTrack v2  -  MySQL 5.7+ / MariaDB 10.3+ schema + seed data
-- Import with:   mysql -u root -p < database/schema.sql
--          or:   phpMyAdmin -> Import (choose this file)
--
-- Design notes (student-friendly):
--   * Every table has an integer primary key `id`.
--   * Lookup values (roles, campuses, categories ...) live in their own
--     tables so the data is NORMALIZED (no repeated text in `reports`).
--   * Foreign keys keep the data consistent (e.g. a room must belong to a
--     real building).  ON DELETE rules are explained next to each key.
--   * Indexes are created at the bottom of each table group for the
--     columns we search / filter / sort by most.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS equitrack
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE equitrack;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS report_status_history;
DROP TABLE IF EXISTS report_images;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS equipment_types;
DROP TABLE IF EXISTS damage_types;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS buildings;
DROP TABLE IF EXISTS campuses;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. ROLES + USERS
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(30)  NOT NULL UNIQUE,      -- user | admin | super_admin
  description VARCHAR(190) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id       INT UNSIGNED NOT NULL,
  first_name    VARCHAR(80)  NOT NULL,
  last_name     VARCHAR(80)  NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,            -- result of password_hash()
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- RESTRICT: a role that still has users cannot be deleted
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_users_role   ON users (role_id);
CREATE INDEX idx_users_status ON users (status);

-- ---------------------------------------------------------------------
-- 2. LOCATION HIERARCHY:  campus -> building -> room
-- ---------------------------------------------------------------------
CREATE TABLE campuses (
  id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name    VARCHAR(120) NOT NULL UNIQUE,
  code    VARCHAR(10)  NOT NULL UNIQUE,           -- short code, e.g. TC
  address VARCHAR(190) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE buildings (
  id        INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  campus_id INT UNSIGNED NOT NULL,
  name      VARCHAR(120) NOT NULL,
  code      VARCHAR(20)  NULL,
  CONSTRAINT fk_buildings_campus FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE RESTRICT,
  CONSTRAINT uq_building_name UNIQUE (campus_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_buildings_campus ON buildings (campus_id);

CREATE TABLE rooms (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  building_id INT UNSIGNED NOT NULL,
  name        VARCHAR(120) NOT NULL,              -- e.g. "LB 467 TC" or "Lobby"
  floor       VARCHAR(20)  NULL,
  CONSTRAINT fk_rooms_building FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE RESTRICT,
  CONSTRAINT uq_room_name UNIQUE (building_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_rooms_building ON rooms (building_id);

-- ---------------------------------------------------------------------
-- 3. REFERENCE DATA: categories, equipment types, damage types
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL UNIQUE,
  description VARCHAR(190) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE equipment_types (                    -- the "type" filter in the directory
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name        VARCHAR(80) NOT NULL,
  CONSTRAINT fk_eqtypes_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT uq_eqtype_name UNIQUE (category_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_eqtypes_category ON equipment_types (category_id);

CREATE TABLE damage_types (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80)  NOT NULL UNIQUE,
  description VARCHAR(190) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. EQUIPMENT (assets directory)
-- ---------------------------------------------------------------------
CREATE TABLE equipment (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  asset_tag    VARCHAR(40)  NOT NULL UNIQUE,      -- e.g. TC-LB-0001
  name         VARCHAR(150) NOT NULL,
  category_id  INT UNSIGNED NOT NULL,
  type_id      INT UNSIGNED NULL,
  room_id      INT UNSIGNED NOT NULL,
  status       ENUM('operational','needs_repair','under_repair','retired') NOT NULL DEFAULT 'operational',
  description  TEXT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_equipment_category FOREIGN KEY (category_id) REFERENCES categories(id)      ON DELETE RESTRICT,
  CONSTRAINT fk_equipment_type     FOREIGN KEY (type_id)     REFERENCES equipment_types(id) ON DELETE SET NULL,
  CONSTRAINT fk_equipment_room     FOREIGN KEY (room_id)     REFERENCES rooms(id)           ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_equipment_category ON equipment (category_id);
CREATE INDEX idx_equipment_type     ON equipment (type_id);
CREATE INDEX idx_equipment_room     ON equipment (room_id);
CREATE INDEX idx_equipment_status   ON equipment (status);
CREATE INDEX idx_equipment_name     ON equipment (name);

-- ---------------------------------------------------------------------
-- 5. REPORTS  (+ images + status history)
-- ---------------------------------------------------------------------
CREATE TABLE reports (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference_no   VARCHAR(30) NULL UNIQUE,         -- e.g. ET-2026-000012 (filled after insert)
  user_id        INT UNSIGNED NOT NULL,           -- the reporter
  equipment_id   INT UNSIGNED NULL,               -- optional link to a directory item
  item_name      VARCHAR(150) NOT NULL,
  category_id    INT UNSIGNED NOT NULL,
  campus_id      INT UNSIGNED NOT NULL,
  building_id    INT UNSIGNED NOT NULL,
  room_id        INT UNSIGNED NOT NULL,
  location_note  VARCHAR(190) NULL,               -- extra "where exactly" text
  damage_type_id INT UNSIGNED NOT NULL,
  description    TEXT NOT NULL,
  priority       ENUM('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Medium',
  status         ENUM('Pending','In Progress','Solved') NOT NULL DEFAULT 'Pending',
  remarks        TEXT NULL,                       -- latest admin remarks
  resolved_by    INT UNSIGNED NULL,
  resolved_at    TIMESTAMP NULL DEFAULT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- CASCADE: deleting a user also deletes their reports
  CONSTRAINT fk_reports_user      FOREIGN KEY (user_id)        REFERENCES users(id)        ON DELETE CASCADE,
  CONSTRAINT fk_reports_equipment FOREIGN KEY (equipment_id)   REFERENCES equipment(id)    ON DELETE SET NULL,
  CONSTRAINT fk_reports_category  FOREIGN KEY (category_id)    REFERENCES categories(id)   ON DELETE RESTRICT,
  CONSTRAINT fk_reports_campus    FOREIGN KEY (campus_id)      REFERENCES campuses(id)     ON DELETE RESTRICT,
  CONSTRAINT fk_reports_building  FOREIGN KEY (building_id)    REFERENCES buildings(id)    ON DELETE RESTRICT,
  CONSTRAINT fk_reports_room      FOREIGN KEY (room_id)        REFERENCES rooms(id)        ON DELETE RESTRICT,
  CONSTRAINT fk_reports_damage    FOREIGN KEY (damage_type_id) REFERENCES damage_types(id) ON DELETE RESTRICT,
  CONSTRAINT fk_reports_resolver  FOREIGN KEY (resolved_by)    REFERENCES users(id)        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_reports_user      ON reports (user_id);
CREATE INDEX idx_reports_status    ON reports (status);
CREATE INDEX idx_reports_priority  ON reports (priority);
CREATE INDEX idx_reports_category  ON reports (category_id);
CREATE INDEX idx_reports_campus    ON reports (campus_id);
CREATE INDEX idx_reports_building  ON reports (building_id);
CREATE INDEX idx_reports_equipment ON reports (equipment_id);
CREATE INDEX idx_reports_created   ON reports (created_at);

CREATE TABLE report_images (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id     INT UNSIGNED NOT NULL,
  file_path     VARCHAR(255) NOT NULL,            -- relative to backend/uploads/
  original_name VARCHAR(190) NULL,
  mime_type     VARCHAR(50)  NOT NULL,
  file_size     INT UNSIGNED NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_images_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_images_report ON report_images (report_id);

CREATE TABLE report_status_history (              -- feeds the "status timeline"
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id   INT UNSIGNED NOT NULL,
  old_status  VARCHAR(20) NULL,                   -- NULL for the first entry
  new_status  VARCHAR(20) NOT NULL,
  changed_by  INT UNSIGNED NULL,
  remarks     TEXT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_report FOREIGN KEY (report_id)  REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user   FOREIGN KEY (changed_by) REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_history_report ON report_status_history (report_id);

-- ---------------------------------------------------------------------
-- 6. AUDIT LOG  (who did what, when, from where)
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NULL,                  -- NULL = anonymous (e.g. failed login)
  action      VARCHAR(60)  NOT NULL,              -- e.g. report.create, user.delete
  entity_type VARCHAR(40)  NULL,
  entity_id   INT UNSIGNED NULL,
  details     TEXT NULL,                          -- JSON text with extra info
  ip_address  VARCHAR(45)  NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_audit_user    ON audit_logs (user_id);
CREATE INDEX idx_audit_action  ON audit_logs (action);
CREATE INDEX idx_audit_entity  ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs (created_at);

-- =====================================================================
-- SEED DATA
-- =====================================================================

INSERT INTO roles (id, name, description) VALUES
 (1, 'user',        'Student / staff who files and tracks reports'),
 (2, 'admin',       'Maintenance staff who manage reports'),
 (3, 'super_admin', 'System owner: users, reference data, directory, audit logs');

-- DEMO ACCOUNTS  -  password for ALL three is:  password123
-- (bcrypt hash made with PHP password_hash). DELETE or change before going live!
INSERT INTO users (id, role_id, first_name, last_name, email, password_hash, status) VALUES
 (1, 3, 'Super',  'Admin',     'superadmin@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active'),
 (2, 2, 'Admin',  'EquiTrack', 'admin@usc.edu.ph',      '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active'),
 (3, 1, 'Juan',   'Dela Cruz', 'juan@usc.edu.ph',       '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active');

INSERT INTO campuses (id, name, code, address) VALUES
 (1, 'Talamban Campus', 'TC', 'Nasipit, Talamban, Cebu City'),
 (2, 'Downtown Campus', 'DC', 'P. del Rosario St., Cebu City'),
 (3, 'Montesclaros Campus', 'MC', 'Montesclaros, Cebu City');

-- Talamban buildings come from the original EquiTrack project; the others are samples.
INSERT INTO buildings (id, campus_id, name, code) VALUES
 (1, 1, 'Lawrence Bunzel Bldg.',    'LB'),
 (2, 1, 'SMED Bldg.',               'SMED'),
 (3, 1, 'Philip Van Engelen Bldg.', 'PVE'),
 (4, 1, 'SAFAD Bldg.',              'SAFAD'),
 (5, 1, 'Robert Hoeppener Bldg.',   'RH'),
 (6, 1, 'JB Bldg. (LRC)',           'JB'),
 (7, 1, 'MR Bldg.',                 'MR'),
 (8, 1, 'BCT',                      'BCT'),
 (9, 1, 'Chapel',                   'CH'),
 (10, 2, 'Main Building',           'DMB'),
 (11, 3, 'Science Building',        'MSB');

INSERT INTO rooms (id, building_id, name, floor) VALUES
 (1, 1, 'LB 467 TC', '4'), (2, 1, 'LB 486', '4'), (3, 1, '4th Floor', '4'), (4, 1, 'Lobby', '1'),
 (5, 2, 'Canteen', '1'),   (6, 2, 'Lobby', '1'),
 (7, 3, 'PVE 101', '1'),   (8, 3, 'PVE Hallway', '1'),
 (9, 4, 'Comfort Room', '1'), (10, 4, 'Studio 1', '2'),
 (11, 5, 'RH 201', '2'),   (12, 5, 'Lobby', '1'),
 (13, 6, 'Reading Area', '1'), (14, 6, '2nd Floor', '2'),
 (15, 7, 'MR Hall', '1'),  (16, 7, 'MR 105', '1'),
 (17, 8, 'Main Court', '1'), (18, 8, 'Bleachers', '1'),
 (19, 9, '1st Floor CR', '1'), (20, 9, 'Sanctuary', '1'),
 (21, 10, 'Room 101', '1'), (22, 10, 'Faculty Room', '2'),
 (23, 11, 'Chem Lab 1', '1');

INSERT INTO categories (id, name, description) VALUES
 (1, 'Equipment & Utilities', 'Devices, appliances, AV and electrical equipment'),
 (2, 'Facilities',            'Furniture, plumbing, doors, ceilings and other structures'),
 (3, 'Other',                 'Anything that does not fit the categories above');

INSERT INTO equipment_types (id, category_id, name) VALUES
 (1, 1, 'Display / Projector'), (2, 1, 'Computer'),      (3, 1, 'Network Device'),
 (4, 1, 'Air Conditioning'),    (5, 1, 'Electrical / Lighting'),
 (6, 2, 'Furniture'),           (7, 2, 'Plumbing'),      (8, 2, 'Door / Lock'),
 (9, 3, 'Miscellaneous');

INSERT INTO damage_types (id, name, description) VALUES
 (1, 'Broken / Physical damage', 'Cracked, snapped, torn or detached parts'),
 (2, 'Not powering on',          'Dead device, no lights or response'),
 (3, 'Leaking',                  'Water or fluid leak'),
 (4, 'Electrical fault',         'Sparks, tripped breaker, loose wiring'),
 (5, 'Software / Network issue', 'Cannot connect, freezes, error messages'),
 (6, 'Missing parts',            'Parts or accessories are missing'),
 (7, 'Wear and tear',            'Worn out through age or heavy use'),
 (8, 'Other',                    'Something else - explain in the description');

INSERT INTO equipment (id, asset_tag, name, category_id, type_id, room_id, status, description) VALUES
 (1,  'TC-LB-0001', 'Interactive TV Whiteboard', 1, 1, 2,  'needs_repair', 'Wall-mounted touch display'),
 (2,  'TC-LB-0002', 'Biometric Face Scanner',    1, 3, 3,  'needs_repair', 'Entrance attendance scanner'),
 (3,  'TC-LB-0003', 'Lectern HDMI Port',         1, 1, 1,  'operational',  'Lectern input panel'),
 (4,  'TC-SA-0001', 'Urinal Unit 2',             2, 7, 9,  'needs_repair', 'Comfort room fixture'),
 (5,  'TC-SM-0001', 'Beanbag Seats (set of 6)',  2, 6, 5,  'needs_repair', 'Canteen lounge seating'),
 (6,  'TC-MR-0001', 'Folding Tablet Seat A12',   2, 6, 15, 'under_repair', 'Auditorium seat'),
 (7,  'TC-CH-0001', 'CR Faucet Set',             2, 7, 19, 'needs_repair', 'Sink faucets'),
 (8,  'TC-PV-0001', 'Split-type Aircon 2HP',     1, 4, 7,  'operational',  'Room PVE 101'),
 (9,  'TC-JB-0001', 'LRC Desktop PC Lab (20 pcs)', 1, 2, 13, 'operational', 'Reading area computers'),
 (10, 'TC-RH-0001', 'Ceiling Light Panel',       1, 5, 11, 'operational',  'RH 201 lighting'),
 (11, 'DC-MB-0001', 'Classroom Projector',       1, 1, 21, 'operational',  'Downtown Room 101'),
 (12, 'MC-SB-0001', 'Fume Hood',                 1, 9, 23, 'operational',  'Chemistry lab');

-- Sample reports (migrated from the original project's demo data)
INSERT INTO reports (id, reference_no, user_id, equipment_id, item_name, category_id, campus_id, building_id, room_id,
                     damage_type_id, description, priority, status, created_at) VALUES
 (1, 'ET-2026-000001', 3, 1, 'TV Whiteboard',        1, 1, 1, 2,  5, 'Projector display is flickering and the touch overlay does not respond.', 'High',   'Pending',     '2026-09-01 09:10:00'),
 (2, 'ET-2026-000002', 3, 2, 'Biometric Scanner',    1, 1, 1, 3,  2, 'Face scanner at the entrance fails to register faces.',                   'Medium', 'Pending',     '2026-09-03 10:30:00'),
 (3, 'ET-2026-000003', 3, 4, 'Urinal Leaking',       2, 1, 4, 9,  3, 'Urinal has a steady leak and the floor is constantly wet.',               'Urgent', 'Pending',     '2026-09-05 14:00:00'),
 (4, 'ET-2026-000004', 3, 5, 'Ripped Beanbag Seats', 2, 1, 2, 5,  1, 'Several beanbag seats are torn and leaking filling.',                      'Low',    'Pending',     '2026-09-07 11:45:00'),
 (5, 'ET-2026-000005', 3, 6, 'Broken folding seat',  2, 1, 7, 15, 1, 'Folding armrest tablet is detached from the seat.',                       'Medium', 'In Progress', '2026-09-08 08:20:00'),
 (6, 'ET-2026-000006', 3, 7, 'No running water',     2, 1, 9, 19, 3, 'Faucets in the comfort room have no running water.',                      'High',   'Pending',     '2026-09-10 16:05:00'),
 (7, 'ET-2026-000007', 3, 3, 'Broken HDMI Port',     1, 1, 1, 1,  1, 'HDMI port on the lectern is loose and gives no signal.',                  'Medium', 'Solved',      '2026-08-20 13:00:00');

UPDATE reports SET resolved_by = 2, resolved_at = '2026-08-22 10:00:00', remarks = 'Replaced the HDMI module.' WHERE id = 7;

INSERT INTO report_status_history (report_id, old_status, new_status, changed_by, remarks, created_at) VALUES
 (1, NULL, 'Pending', 3, 'Report submitted', '2026-09-01 09:10:00'),
 (2, NULL, 'Pending', 3, 'Report submitted', '2026-09-03 10:30:00'),
 (3, NULL, 'Pending', 3, 'Report submitted', '2026-09-05 14:00:00'),
 (4, NULL, 'Pending', 3, 'Report submitted', '2026-09-07 11:45:00'),
 (5, NULL, 'Pending', 3, 'Report submitted', '2026-09-08 08:20:00'),
 (5, 'Pending', 'In Progress', 2, 'Technician assigned, waiting for parts.', '2026-09-09 09:00:00'),
 (6, NULL, 'Pending', 3, 'Report submitted', '2026-09-10 16:05:00'),
 (7, NULL, 'Pending', 3, 'Report submitted', '2026-08-20 13:00:00'),
 (7, 'Pending', 'Solved', 2, 'Replaced the HDMI module.', '2026-08-22 10:00:00');

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES
 (1, 'system.seed', 'system', NULL, '{"note":"Initial seed data loaded"}', '127.0.0.1');
