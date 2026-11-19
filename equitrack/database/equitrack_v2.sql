-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 19, 2026 at 05:26 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `equitrack`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `action` varchar(60) NOT NULL,
  `entity_type` varchar(40) DEFAULT NULL,
  `entity_id` int(10) UNSIGNED DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `details`, `ip_address`, `created_at`) VALUES
(1, 1, 'system.seed', 'system', NULL, '{\"note\":\"Initial seed data loaded\"}', '127.0.0.1', '2026-11-17 03:32:59'),
(2, 1, 'auth.login', 'user', 1, NULL, '127.0.0.1', '2026-11-17 04:12:52'),
(3, 1, 'auth.logout', 'user', 1, NULL, '127.0.0.1', '2026-11-17 04:13:40'),
(4, 2, 'auth.login', 'user', 2, NULL, '127.0.0.1', '2026-11-17 04:14:05'),
(5, 2, 'user.status', 'user', 8, '{\"status\":\"inactive\"}', '127.0.0.1', '2026-11-17 04:18:38'),
(6, 2, 'user.status', 'user', 8, '{\"status\":\"active\"}', '127.0.0.1', '2026-11-17 04:18:39'),
(7, 2, 'user.status', 'user', 8, '{\"status\":\"inactive\"}', '127.0.0.1', '2026-11-17 04:21:14'),
(8, 2, 'user.status', 'user', 8, '{\"status\":\"active\"}', '127.0.0.1', '2026-11-17 04:21:19'),
(9, 1, 'auth.login_failed', 'user', 1, '{\"email\":\"superadmin@usc.edu.ph\"}', '127.0.0.1', '2026-11-19 02:12:26'),
(10, 1, 'auth.login', 'user', 1, NULL, '127.0.0.1', '2026-11-19 02:12:33'),
(11, 2, 'auth.login', 'user', 2, NULL, '127.0.0.1', '2026-11-19 02:19:41'),
(12, 1, 'auth.logout', 'user', 1, NULL, '127.0.0.1', '2026-11-19 02:21:13'),
(13, 1, 'auth.login', 'user', 1, NULL, '127.0.0.1', '2026-11-19 02:21:28'),
(14, 1, 'auth.logout', 'user', 1, NULL, '127.0.0.1', '2026-11-19 02:21:58'),
(15, 1, 'auth.login', 'user', 1, NULL, '127.0.0.1', '2026-11-19 02:22:14'),
(16, 1, 'auth.logout', 'user', 1, NULL, '127.0.0.1', '2026-11-19 02:22:17'),
(17, 2, 'auth.login', 'user', 2, NULL, '127.0.0.1', '2026-11-19 02:22:41'),
(18, 2, 'report.status', 'report', 6, '{\"from\":\"Pending\",\"to\":\"In Progress\"}', '127.0.0.1', '2026-11-19 02:23:00'),
(19, 2, 'user.update', 'user', 7, '{\"email\":\"casey.demo@example.test\",\"role\":\"user\",\"status\":\"inactive\"}', '127.0.0.1', '2026-11-19 02:28:49'),
(20, 2, 'user.update', 'user', 7, '{\"email\":\"casey.demo@example.test\",\"role\":\"user\",\"status\":\"active\"}', '127.0.0.1', '2026-11-19 02:29:00');

-- --------------------------------------------------------

--
-- Table structure for table `buildings`
--

CREATE TABLE `buildings` (
  `id` int(10) UNSIGNED NOT NULL,
  `campus_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `code` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `buildings`
--

INSERT INTO `buildings` (`id`, `campus_id`, `name`, `code`) VALUES
(1, 1, 'Lawrence Bunzel Building', 'LB'),
(2, 1, 'SMED Building', 'SMED'),
(3, 1, 'Philip Van Engelen Buildin', 'PE'),
(4, 1, 'SAFAD Building', 'SAFAD'),
(5, 1, 'Robert Hoeppener Bldg.', 'RH'),
(6, 1, 'JB Learning Resource Center', 'JBLRC'),
(7, 1, 'Michael Richartz Center', 'MR'),
(8, 1, 'Basketball Covered Court ', 'BCT'),
(9, 1, 'Chapel', 'CH'),
(12, 1, 'Edgar Oehler', 'EO'),
(13, 1, 'Franz Oster', 'FO'),
(14, 1, 'Enrique Shoenig', 'ES'),
(15, 1, 'Soccer Field', 'SF'),
(16, 1, 'University Dormitory', 'UD'),
(17, 1, 'Sports Complex', 'SC'),
(18, 1, 'Calibration Building', 'CB'),
(19, 1, 'Registar', 'REG'),
(20, 1, 'USC Portal', 'UP'),
(21, 1, 'Machine Shop', 'MS'),
(22, 1, 'Alumni & Visitors Center', 'AVC'),
(23, 1, 'Retreat House', 'RTH'),
(24, 1, 'Population Studies Office', 'PSO'),
(25, 1, 'COCOFED', 'COCOFED'),
(26, 2, 'Arthur Dingman Building', 'AD'),
(27, 2, 'Joseph Watzlawik Wing', 'JW'),
(28, 2, 'Arch. Gabriel Reyes Wing', 'AGR'),
(29, 2, 'Ernest Hoerdemann Building', 'EH'),
(30, 2, 'Anselmo Bustos Sports Complex', 'AB'),
(31, 2, 'Main Library', 'ML'),
(32, 2, 'Wrocklage Yard', 'WY'),
(33, 2, 'Swimming Pool', 'SP'),
(34, 2, 'Tennis Court', 'TC'),
(35, 2, 'Volleyball Court', 'VB'),
(36, 2, 'Kolk\'s Nook', 'KN');

-- --------------------------------------------------------

--
-- Table structure for table `campuses`
--

CREATE TABLE `campuses` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `code` varchar(10) NOT NULL,
  `address` varchar(190) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `campuses`
--

INSERT INTO `campuses` (`id`, `name`, `code`, `address`) VALUES
(1, 'Talamban Campus', 'TC', 'Nasipit, Talamban, Cebu City'),
(2, 'Downtown Campus', 'DC', 'P. del Rosario St., Cebu City');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(190) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`) VALUES
(1, 'Equipment & Utilities', 'Devices, appliances, AV and electrical equipment'),
(2, 'Facilities', 'Furniture, plumbing, doors, ceilings and other structures'),
(3, 'Other', 'Anything that does not fit the categories above');

-- --------------------------------------------------------

--
-- Table structure for table `damage_types`
--

CREATE TABLE `damage_types` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(190) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `damage_types`
--

INSERT INTO `damage_types` (`id`, `name`, `description`) VALUES
(1, 'Broken / Physical damage', 'Cracked, snapped, torn or detached parts'),
(2, 'Not powering on', 'Dead device, no lights or response'),
(3, 'Leaking', 'Water or fluid leak'),
(4, 'Electrical fault', 'Sparks, tripped breaker, loose wiring'),
(5, 'Software / Network issue', 'Cannot connect, freezes, error messages'),
(6, 'Missing parts', 'Parts or accessories are missing'),
(7, 'Wear and tear', 'Worn out through age or heavy use'),
(8, 'Other', 'Something else - explain in the description');

-- --------------------------------------------------------

--
-- Table structure for table `equipment`
--

CREATE TABLE `equipment` (
  `id` int(10) UNSIGNED NOT NULL,
  `asset_tag` varchar(40) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `type_id` int(10) UNSIGNED DEFAULT NULL,
  `room_id` int(10) UNSIGNED NOT NULL,
  `status` enum('operational','needs_repair','under_repair','retired') NOT NULL DEFAULT 'operational',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `equipment`
--

INSERT INTO `equipment` (`id`, `asset_tag`, `name`, `category_id`, `type_id`, `room_id`, `status`, `description`, `created_at`, `updated_at`) VALUES
(1, 'TC-LB-0001', 'Interactive TV Whiteboard', 1, 1, 2, 'needs_repair', 'Wall-mounted touch display', '2026-11-17 03:32:59', '2026-11-17 03:32:59'),
(2, 'TC-LB-0002', 'Biometric Face Scanner', 1, 3, 3, 'needs_repair', 'Entrance attendance scanner', '2026-11-17 03:32:59', '2026-11-17 03:32:59'),
(3, 'TC-LB-0003', 'Lectern HDMI Port', 1, 1, 1, 'operational', 'Lectern input panel', '2026-11-17 03:32:59', '2026-11-17 03:32:59'),
(4, 'TC-SA-0001', 'Urinal Unit 2', 2, 7, 9, 'needs_repair', 'Comfort room fixture', '2026-11-17 03:32:59', '2026-11-17 03:32:59'),
(5, 'TC-SM-0001', 'Beanbag Seats (set of 6)', 2, 6, 5, 'needs_repair', 'Canteen lounge seating', '2026-11-17 03:32:59', '2026-11-17 03:32:59'),
(6, 'TC-MR-0001', 'Folding Tablet Seat A12', 2, 6, 15, 'under_repair', 'Auditorium seat', '2026-11-17 03:32:59', '2026-11-17 03:32:59'),
(7, 'TC-CH-0001', 'CR Faucet Set', 2, 7, 19, 'under_repair', 'Sink faucets', '2026-11-17 03:32:59', '2026-11-19 02:23:00'),
(8, 'TC-PV-0001', 'Split-type Aircon 2HP', 1, 4, 7, 'operational', 'Room PVE 101', '2026-11-17 03:32:59', '2026-11-17 03:32:59'),
(9, 'TC-JB-0001', 'LRC Desktop PC Lab (20 pcs)', 1, 2, 13, 'operational', 'Reading area computers', '2026-11-17 03:32:59', '2026-11-17 03:32:59'),
(10, 'TC-RH-0001', 'Ceiling Light Panel', 1, 5, 11, 'operational', 'RH 201 lighting', '2026-11-17 03:32:59', '2026-11-17 03:32:59');

-- --------------------------------------------------------

--
-- Table structure for table `equipment_types`
--

CREATE TABLE `equipment_types` (
  `id` int(10) UNSIGNED NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `equipment_types`
--

INSERT INTO `equipment_types` (`id`, `category_id`, `name`) VALUES
(4, 1, 'Air Conditioning'),
(2, 1, 'Computer'),
(1, 1, 'Display / Projector'),
(5, 1, 'Electrical / Lighting'),
(3, 1, 'Network Device'),
(8, 2, 'Door / Lock'),
(6, 2, 'Furniture'),
(7, 2, 'Plumbing'),
(9, 3, 'Miscellaneous');

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` int(10) UNSIGNED NOT NULL,
  `reference_no` varchar(30) DEFAULT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `equipment_id` int(10) UNSIGNED DEFAULT NULL,
  `item_name` varchar(150) NOT NULL,
  `category_id` int(10) UNSIGNED NOT NULL,
  `campus_id` int(10) UNSIGNED NOT NULL,
  `building_id` int(10) UNSIGNED NOT NULL,
  `room_id` int(10) UNSIGNED NOT NULL,
  `location_note` varchar(190) DEFAULT NULL,
  `damage_type_id` int(10) UNSIGNED NOT NULL,
  `description` text NOT NULL,
  `priority` enum('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Medium',
  `status` enum('Pending','In Progress','Solved') NOT NULL DEFAULT 'Pending',
  `remarks` text DEFAULT NULL,
  `resolved_by` int(10) UNSIGNED DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `reports`
--

INSERT INTO `reports` (`id`, `reference_no`, `user_id`, `equipment_id`, `item_name`, `category_id`, `campus_id`, `building_id`, `room_id`, `location_note`, `damage_type_id`, `description`, `priority`, `status`, `remarks`, `resolved_by`, `resolved_at`, `created_at`, `updated_at`) VALUES
(1, 'ET-2026-000001', 3, 1, 'TV Whiteboard', 1, 1, 1, 2, NULL, 5, 'Projector display is flickering and the touch overlay does not respond.', 'High', 'Pending', NULL, NULL, NULL, '2026-09-01 01:10:00', '2026-11-17 03:32:59'),
(2, 'ET-2026-000002', 4, 2, 'Biometric Scanner', 1, 1, 1, 3, NULL, 2, 'Face scanner at the entrance fails to register faces.', 'Medium', 'Pending', NULL, NULL, NULL, '2026-09-03 02:30:00', '2026-11-17 03:32:59'),
(3, 'ET-2026-000003', 3, 4, 'Urinal Leaking', 2, 1, 4, 9, NULL, 3, 'Urinal has a steady leak and the floor is constantly wet.', 'Urgent', 'Pending', NULL, NULL, NULL, '2026-09-05 06:00:00', '2026-11-17 03:32:59'),
(4, 'ET-2026-000004', 5, 5, 'Ripped Beanbag Seats', 2, 1, 2, 5, NULL, 1, 'Several beanbag seats are torn and leaking filling.', 'Low', 'Pending', NULL, NULL, NULL, '2026-09-07 03:45:00', '2026-11-17 03:32:59'),
(5, 'ET-2026-000005', 6, 6, 'Broken folding seat', 2, 1, 7, 15, NULL, 1, 'Folding armrest tablet is detached from the seat.', 'Medium', 'In Progress', NULL, NULL, NULL, '2026-09-08 00:20:00', '2026-11-17 03:32:59'),
(6, 'ET-2026-000006', 7, 7, 'No running water', 2, 1, 9, 19, NULL, 3, 'Faucets in the comfort room have no running water.', 'High', 'In Progress', 'Plumber assigned', NULL, NULL, '2026-09-10 08:05:00', '2026-11-19 02:23:00'),
(7, 'ET-2026-000007', 8, 3, 'Broken HDMI Port', 1, 1, 1, 1, NULL, 1, 'HDMI port on the lectern is loose and gives no signal.', 'Medium', 'Solved', 'Replaced the HDMI module.', 2, '2026-08-22 02:00:00', '2026-08-20 05:00:00', '2026-11-17 03:32:59');

-- --------------------------------------------------------

--
-- Table structure for table `report_images`
--

CREATE TABLE `report_images` (
  `id` int(10) UNSIGNED NOT NULL,
  `report_id` int(10) UNSIGNED NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `original_name` varchar(190) DEFAULT NULL,
  `mime_type` varchar(50) NOT NULL,
  `file_size` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report_status_history`
--

CREATE TABLE `report_status_history` (
  `id` int(10) UNSIGNED NOT NULL,
  `report_id` int(10) UNSIGNED NOT NULL,
  `old_status` varchar(20) DEFAULT NULL,
  `new_status` varchar(20) NOT NULL,
  `changed_by` int(10) UNSIGNED DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `report_status_history`
--

INSERT INTO `report_status_history` (`id`, `report_id`, `old_status`, `new_status`, `changed_by`, `remarks`, `created_at`) VALUES
(1, 1, NULL, 'Pending', 3, 'Report submitted', '2026-09-01 01:10:00'),
(2, 2, NULL, 'Pending', 3, 'Report submitted', '2026-09-03 02:30:00'),
(3, 3, NULL, 'Pending', 3, 'Report submitted', '2026-09-05 06:00:00'),
(4, 4, NULL, 'Pending', 3, 'Report submitted', '2026-09-07 03:45:00'),
(5, 5, NULL, 'Pending', 3, 'Report submitted', '2026-09-08 00:20:00'),
(6, 5, 'Pending', 'In Progress', 2, 'Technician assigned, waiting for parts.', '2026-09-09 01:00:00'),
(7, 6, NULL, 'Pending', 3, 'Report submitted', '2026-09-10 08:05:00'),
(8, 7, NULL, 'Pending', 3, 'Report submitted', '2026-08-20 05:00:00'),
(9, 7, 'Pending', 'Solved', 2, 'Replaced the HDMI module.', '2026-08-22 02:00:00'),
(10, 6, 'Pending', 'In Progress', 2, 'Plumber assigned', '2026-11-19 02:23:00');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(30) NOT NULL,
  `description` varchar(190) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'user', 'Student / staff who files and tracks reports'),
(2, 'admin', 'Maintenance staff who manage reports'),
(3, 'super_admin', 'System owner: users, reference data, directory, audit logs');

-- --------------------------------------------------------

--
-- Table structure for table `rooms`
--

CREATE TABLE `rooms` (
  `id` int(10) UNSIGNED NOT NULL,
  `building_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `floor` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `rooms`
--

INSERT INTO `rooms` (`id`, `building_id`, `name`, `floor`) VALUES
(1, 1, 'LB 467 TC', '4'),
(2, 1, 'LB 486', '4'),
(3, 1, '4th Floor', '4'),
(4, 1, 'Lobby', '1'),
(5, 2, 'Canteen', '1'),
(6, 2, 'Lobby', '1'),
(7, 3, 'PVE 101', '1'),
(8, 3, 'PVE Hallway', '1'),
(9, 4, 'Comfort Room', '1'),
(10, 4, 'Studio 1', '2'),
(11, 5, 'RH 201', '2'),
(12, 5, 'Lobby', '1'),
(13, 6, 'Reading Area', '1'),
(14, 6, '2nd Floor', '2'),
(15, 7, 'MR Hall', '1'),
(16, 7, 'MR 105', '1'),
(17, 8, 'Main Court', '1'),
(18, 8, 'Bleachers', '1'),
(19, 9, '1st Floor CR', '1'),
(20, 9, 'Sanctuary', '1');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `role_id` int(10) UNSIGNED NOT NULL,
  `first_name` varchar(80) NOT NULL,
  `last_name` varchar(80) NOT NULL,
  `email` varchar(190) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `role_id`, `first_name`, `last_name`, `email`, `password_hash`, `status`, `created_at`, `updated_at`) VALUES
(1, 3, 'Super', 'Admin', 'superadmin@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active', '2026-11-17 03:32:59', '2026-11-17 03:32:59'),
(2, 2, 'Admin 1', 'EquiTrack', 'admin1@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active', '2026-11-17 03:32:59', '2026-11-19 04:07:23'),
(3, 1, 'Juan', 'Dela Cruz', 'juan@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active', '2026-11-17 03:32:59', '2026-11-17 03:32:59'),
(4, 1, 'Alex', 'Tan', 'alex.tan@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active', '2026-11-17 03:32:59', '2026-11-19 04:08:14'),
(5, 1, 'Sam', 'Garcia', 'sam.garcia@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active', '2026-11-17 03:32:59', '2026-11-19 04:09:31'),
(6, 1, 'Riley', 'Villanueva', '21001106@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active', '2026-11-17 03:32:59', '2026-11-19 04:09:56'),
(7, 1, 'Casey', 'Casas', '08217704@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active', '2026-11-17 03:32:59', '2026-11-19 04:10:26'),
(8, 1, 'Jordan', 'Peele', 'jordan.peele@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active', '2026-11-17 03:32:59', '2026-11-19 04:10:46'),
(9, 2, 'Admin 2', 'EquiTrack', 'admin2@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active', '2026-11-19 04:13:10', '2026-11-19 04:13:10'),
(10, 2, 'Admin 3', 'EquiTrack', 'admin3@usc.edu.ph', '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW', 'active', '2026-11-19 04:13:10', '2026-11-19 04:13:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_user` (`user_id`),
  ADD KEY `idx_audit_action` (`action`),
  ADD KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  ADD KEY `idx_audit_created` (`created_at`);

--
-- Indexes for table `buildings`
--
ALTER TABLE `buildings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_building_name` (`campus_id`,`name`),
  ADD KEY `idx_buildings_campus` (`campus_id`);

--
-- Indexes for table `campuses`
--
ALTER TABLE `campuses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `damage_types`
--
ALTER TABLE `damage_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `equipment`
--
ALTER TABLE `equipment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `asset_tag` (`asset_tag`),
  ADD KEY `idx_equipment_category` (`category_id`),
  ADD KEY `idx_equipment_type` (`type_id`),
  ADD KEY `idx_equipment_room` (`room_id`),
  ADD KEY `idx_equipment_status` (`status`),
  ADD KEY `idx_equipment_name` (`name`);

--
-- Indexes for table `equipment_types`
--
ALTER TABLE `equipment_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_eqtype_name` (`category_id`,`name`),
  ADD KEY `idx_eqtypes_category` (`category_id`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference_no` (`reference_no`),
  ADD KEY `fk_reports_room` (`room_id`),
  ADD KEY `fk_reports_damage` (`damage_type_id`),
  ADD KEY `fk_reports_resolver` (`resolved_by`),
  ADD KEY `idx_reports_user` (`user_id`),
  ADD KEY `idx_reports_status` (`status`),
  ADD KEY `idx_reports_priority` (`priority`),
  ADD KEY `idx_reports_category` (`category_id`),
  ADD KEY `idx_reports_campus` (`campus_id`),
  ADD KEY `idx_reports_building` (`building_id`),
  ADD KEY `idx_reports_equipment` (`equipment_id`),
  ADD KEY `idx_reports_created` (`created_at`);

--
-- Indexes for table `report_images`
--
ALTER TABLE `report_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_images_report` (`report_id`);

--
-- Indexes for table `report_status_history`
--
ALTER TABLE `report_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_history_user` (`changed_by`),
  ADD KEY `idx_history_report` (`report_id`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `rooms`
--
ALTER TABLE `rooms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_room_name` (`building_id`,`name`),
  ADD KEY `idx_rooms_building` (`building_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_users_role` (`role_id`),
  ADD KEY `idx_users_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_logs`
--
ALTER TABLE `audit_logs`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `buildings`
--
ALTER TABLE `buildings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `campuses`
--
ALTER TABLE `campuses`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `damage_types`
--
ALTER TABLE `damage_types`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `equipment`
--
ALTER TABLE `equipment`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `equipment_types`
--
ALTER TABLE `equipment_types`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `reports`
--
ALTER TABLE `reports`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `report_images`
--
ALTER TABLE `report_images`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `report_status_history`
--
ALTER TABLE `report_status_history`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `rooms`
--
ALTER TABLE `rooms`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `buildings`
--
ALTER TABLE `buildings`
  ADD CONSTRAINT `fk_buildings_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`);

--
-- Constraints for table `equipment`
--
ALTER TABLE `equipment`
  ADD CONSTRAINT `fk_equipment_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `fk_equipment_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  ADD CONSTRAINT `fk_equipment_type` FOREIGN KEY (`type_id`) REFERENCES `equipment_types` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `equipment_types`
--
ALTER TABLE `equipment_types`
  ADD CONSTRAINT `fk_eqtypes_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `fk_reports_building` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`),
  ADD CONSTRAINT `fk_reports_campus` FOREIGN KEY (`campus_id`) REFERENCES `campuses` (`id`),
  ADD CONSTRAINT `fk_reports_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `fk_reports_damage` FOREIGN KEY (`damage_type_id`) REFERENCES `damage_types` (`id`),
  ADD CONSTRAINT `fk_reports_equipment` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reports_resolver` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_reports_room` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`),
  ADD CONSTRAINT `fk_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `report_images`
--
ALTER TABLE `report_images`
  ADD CONSTRAINT `fk_images_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `report_status_history`
--
ALTER TABLE `report_status_history`
  ADD CONSTRAINT `fk_history_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `rooms`
--
ALTER TABLE `rooms`
  ADD CONSTRAINT `fk_rooms_building` FOREIGN KEY (`building_id`) REFERENCES `buildings` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
