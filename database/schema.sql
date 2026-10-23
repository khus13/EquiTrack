-- EquiTrack schema + seed data (MySQL 5.7+/MariaDB 10.3+)
CREATE DATABASE IF NOT EXISTS equitrack CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE equitrack;

DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS buildings;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(80) NOT NULL,
  last_name  VARCHAR(80) NOT NULL,
  email      VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE buildings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE locations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  building_id INT UNSIGNED NOT NULL,
  name VARCHAR(120) NOT NULL,
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(150) NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  description TEXT NOT NULL,
  building_id INT UNSIGNED NOT NULL,
  location_id INT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NULL,
  status ENUM('Unresolved','Work In Progress','Resolved') NOT NULL DEFAULT 'Unresolved',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (building_id) REFERENCES buildings(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  INDEX idx_status (status),
  INDEX idx_building (building_id)
) ENGINE=InnoDB;

INSERT INTO categories (name) VALUES ('Equipment & Utilities'),('Facilities'),('Other');

INSERT INTO buildings (name) VALUES
 ('Lawrence Bunzel Bldg.'),('SMED Bldg.'),('Philip Van Engelen Bldg.'),
 ('SAFAD Bldg.'),('Robert Hoeppener Bldg.'),('JB Bldg. (LRC)'),
 ('MR Bldg.'),('BCT'),('Chapel');

INSERT INTO locations (building_id, name) VALUES
 (1,'LB 467 TC'),(1,'LB 486'),(1,'4th Floor'),(1,'Lobby'),
 (2,'Canteen'),(2,'Lobby'),
 (3,'PVE 101'),(3,'PVE Hallway'),
 (4,'Comfort Room'),(4,'Studio 1'),
 (5,'RH 201'),(5,'Lobby'),
 (6,'Reading Area'),(6,'2nd Floor'),
 (7,'MR Hall'),(7,'MR 105'),
 (8,'Main Court'),(8,'Bleachers'),
 (9,'1st Floor CR'),(9,'Sanctuary');

-- Demo accounts (password for BOTH: "password123") – change/remove in production!
-- bcrypt hash of "password123"
INSERT INTO users (first_name,last_name,email,password_hash,role) VALUES
 ('Admin','EquiTrack','admin@usc.edu.ph','$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW','admin'),
 ('Juan','Dela Cruz','juan@usc.edu.ph','$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW','user');

INSERT INTO reports (user_id,title,category_id,description,building_id,location_id,status) VALUES
 (2,'TV Whiteboard',1,'Projector display is flickering and the touch overlay does not respond.',1,2,'Unresolved'),
 (2,'Biometric Scanner',1,'Face scanner at the entrance fails to register faces.',1,3,'Unresolved'),
 (2,'Urinal Leaking',2,'Urinal has a steady leak and the floor is constantly wet.',4,9,'Unresolved'),
 (2,'Ripped Beanbag Seats',2,'Several beanbag seats are torn and leaking filling.',2,5,'Unresolved'),
 (2,'Broken folding seat',2,'Folding armrest tablet is detached from the seat.',7,15,'Work In Progress'),
 (2,'No running water',2,'Faucets in the comfort room have no running water.',9,19,'Unresolved'),
 (2,'Broken HDMI Port',1,'HDMI port on the lectern is loose and gives no signal.',1,1,'Resolved');
