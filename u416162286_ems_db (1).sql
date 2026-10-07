-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Sep 22, 2026 at 03:41 PM
-- Server version: 11.8.9-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u416162286_ems_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `am_in` datetime DEFAULT NULL,
  `am_out` datetime DEFAULT NULL,
  `pm_in` datetime DEFAULT NULL,
  `pm_out` datetime DEFAULT NULL,
  `total_hours` decimal(5,2) DEFAULT 0.00,
  `earnings` decimal(10,2) DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) DEFAULT 'Present'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance`
--

INSERT INTO `attendance` (`id`, `user_id`, `date`, `am_in`, `am_out`, `pm_in`, `pm_out`, `total_hours`, `earnings`, `created_at`, `status`) VALUES
(37, 11, '2026-09-21', '2026-09-21 14:55:02', NULL, NULL, '2026-09-21 16:45:47', 1.85, 0.00, '2026-09-21 18:55:02', 'Present'),
(40, 11, '2026-09-22', '2026-09-22 09:45:52', '1900-01-01 00:00:00', '2026-09-22 10:06:57', '2026-09-22 10:07:20', 0.36, 0.00, '2026-09-22 13:45:52', 'Present'),
(41, 1, '2026-09-22', '2026-09-22 10:22:41', NULL, NULL, NULL, 0.00, 0.00, '2026-09-22 14:22:41', 'Present');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL DEFAULT 0,
  `sender_name` varchar(255) NOT NULL,
  `sender_role` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `is_read` tinyint(1) DEFAULT 0,
  `is_edited` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `employee_id`, `sender_id`, `receiver_id`, `sender_name`, `sender_role`, `message`, `created_at`, `is_read`, `is_edited`) VALUES
(1, 1, 1, 0, 'Administrator', 'admin', 'Test', '2026-09-10 12:05:25', 0, 0),
(2, 0, 2, 1, 'Employee', 'user', 'hello', '2026-09-10 14:33:07', 1, 0),
(3, 0, 2, 1, 'Employee', 'user', 'Test', '2026-09-10 14:33:10', 1, 0),
(4, 0, 1, 2, 'Administrator', 'admin', 'hello', '2026-09-10 14:58:59', 1, 0),
(5, 0, 2, 10, 'Employee', 'user', 'heyyyyyy', '2026-09-10 17:44:06', 1, 0),
(6, 0, 1, 2, 'Administrator', 'admin', 'test', '2026-09-11 09:39:19', 1, 0),
(7, 0, 1, 2, 'Administrator', 'admin', 'test', '2026-09-14 11:43:07', 1, 0),
(8, 0, 2, 1, 'Employee', 'user', 'test', '2026-09-14 11:43:25', 1, 0),
(9, 0, 1, 2, 'Administrator', 'admin', 'test', '2026-09-14 11:48:07', 1, 0),
(10, 0, 1, 2, 'Administrator', 'admin', 'test', '2026-09-14 12:15:41', 1, 0),
(11, 0, 2, 1, 'Employee', 'user', 'test', '2026-09-14 12:15:50', 1, 0),
(12, 0, 1, 2, 'Administrator', 'admin', 'test', '2026-09-14 12:16:53', 1, 0),
(13, 0, 1, 2, 'Administrator', 'admin', 'test', '2026-09-14 12:21:06', 1, 0),
(14, 0, 2, 1, 'Employee', 'user', 'test', '2026-09-14 12:21:16', 1, 0),
(15, 0, 1, 2, 'Administrator', 'admin', 'test', '2026-09-14 12:21:26', 1, 0),
(16, 0, 2, 1, 'Employee', 'user', 'test', '2026-09-14 12:21:33', 1, 0),
(17, 0, 1, 2, 'Administrator', 'admin', 'test', '2026-09-14 12:21:53', 1, 0),
(18, 0, 2, 1, 'Employee', 'user', 'test', '2026-09-14 12:22:01', 1, 0),
(19, 0, 2, 1, 'Employee', 'user', 'test', '2026-09-14 12:23:13', 1, 0),
(20, 0, 1, 2, 'Administrator', 'admin', 'tesst', '2026-09-14 12:34:13', 1, 0),
(21, 0, 1, 2, 'Administrator', 'admin', 'test', '2026-09-14 14:14:50', 1, 0),
(22, 0, 2, 1, 'Employee', 'user', 'test', '2026-09-14 14:15:07', 1, 0),
(23, 0, 1, 2, 'Administrator', 'admin', 'test', '2026-09-14 14:51:20', 1, 0),
(24, 0, 2, 1, 'Employee', 'user', 'rest', '2026-09-14 14:51:40', 1, 0),
(25, 0, 2, 1, 'Employee', 'user', 'ret', '2026-09-14 14:51:58', 1, 0),
(26, 0, 1, 2, 'Administrator', 'admin', 'ret', '2026-09-14 14:52:11', 1, 0),
(27, 0, 2, 1, 'Employee', 'user', 'test', '2026-09-17 15:50:30', 1, 0),
(28, 0, 2, 10, 'Employee', 'user', 'hi', '2026-09-18 13:34:06', 1, 0),
(29, 0, 1, 10, 'Aly', 'admin', 'Test', '2026-09-18 14:19:05', 1, 0),
(30, 0, 1, 2, 'Aly', 'admin', 'Test', '2026-09-18 14:19:10', 1, 0),
(31, 0, 10, 2, 'Employee 2', 'user', 'Test', '2026-09-18 14:20:28', 1, 0),
(32, 0, 2, 1, 'Employee', 'user', '123', '2026-09-18 14:48:05', 1, 0),
(33, 0, 1, 2, 'Aly', 'admin', '456', '2026-09-18 14:48:12', 1, 0),
(34, 0, 1, 10, 'Aly', 'admin', '123', '2026-09-18 14:48:24', 0, 0),
(36, 0, 11, 2, 'Finance', 'admin', 'test2', '2026-09-18 16:54:26', 0, 1),
(37, 0, 1, 11, 'Aly', 'admin', 'Test', '2026-09-21 14:52:14', 1, 0),
(38, 0, 11, 1, 'Finance', 'admin', 'etst', '2026-09-21 14:53:02', 1, 0),
(39, 0, 11, 1, 'Finance', 'admin', 'Test', '2026-09-21 16:58:45', 1, 0);

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `event_date` date NOT NULL,
  `event_type` varchar(50) DEFAULT 'Other',
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_by_name` varchar(100) DEFAULT NULL,
  `reschedule_for_event_id` int(11) DEFAULT NULL,
  `schedule_option` varchar(100) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0,
  `previous_status` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `user_id`, `title`, `description`, `event_date`, `event_type`, `status`, `created_at`, `approved_by_name`, `reschedule_for_event_id`, `schedule_option`, `updated_at`, `is_deleted`, `previous_status`) VALUES
(1, 11, 'Work Schedule', 'Test', '2026-09-22', 'WS', 'approved', '2026-09-21 20:57:34', NULL, NULL, '', '2026-09-21 20:57:34', 0, NULL),
(2, 11, 'Work Schedule', 'Test', '2026-09-23', 'WS', 'approved', '2026-09-21 20:57:34', NULL, NULL, '', '2026-09-21 20:57:34', 0, NULL),
(3, 11, 'Work Schedule', '', '2026-09-24', 'WS', 'approved', '2026-09-22 14:00:31', NULL, NULL, '', '2026-09-22 14:00:31', 0, NULL),
(4, 11, 'Work Schedule', '', '2026-09-25', 'WS', 'approved', '2026-09-22 14:00:31', NULL, NULL, '', '2026-09-22 14:00:31', 0, NULL),
(5, 11, 'cleaning', '', '2026-09-29', 'WS', 'approved', '2026-09-22 14:01:15', 'Finance', NULL, NULL, '2026-09-22 14:01:15', 0, NULL),
(7, 11, 'Work Schedule', '', '2026-09-27', 'WS', 'approved', '2026-09-22 14:04:18', NULL, NULL, 'alternate', '2026-09-22 14:04:18', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `government_ids`
--

CREATE TABLE `government_ids` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `id_type` varchar(100) NOT NULL,
  `id_number` varchar(100) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `status` enum('verified','pending') DEFAULT 'pending',
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `holidays`
--

CREATE TABLE `holidays` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `holiday_date` date NOT NULL,
  `year` int(11) NOT NULL,
  `is_observed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `holidays`
--

INSERT INTO `holidays` (`id`, `name`, `holiday_date`, `year`, `is_observed`, `created_at`) VALUES
(1, 'New Year\'s Day', '2026-01-01', 2026, 0, '2026-08-18 14:41:22'),
(2, 'Martin Luther King Jr. Day', '2026-01-19', 2026, 0, '2026-08-18 14:41:22'),
(3, 'Presidents\' Day', '2026-02-16', 2026, 0, '2026-08-18 14:41:22'),
(4, 'Memorial Day', '2026-05-25', 2026, 0, '2026-08-18 14:41:22'),
(5, 'Juneteenth', '2026-06-19', 2026, 0, '2026-08-18 14:41:22'),
(6, 'Independence Day', '2026-07-03', 2026, 1, '2026-08-18 14:41:22'),
(7, 'Labor Day', '2026-09-07', 2026, 0, '2026-08-18 14:41:22'),
(8, 'Columbus Day', '2026-10-12', 2026, 0, '2026-08-18 14:41:22'),
(9, 'Veterans Day', '2026-11-11', 2026, 0, '2026-08-18 14:41:22'),
(10, 'Thanksgiving', '2026-11-26', 2026, 0, '2026-08-18 14:41:22'),
(11, 'Christmas Day', '2026-12-25', 2026, 0, '2026-08-18 14:41:22'),
(23, 'New Year\'s Day', '2025-01-01', 2025, 0, '2026-08-18 14:51:19'),
(24, 'Martin Luther King Jr. Day', '2025-01-20', 2025, 0, '2026-08-18 14:51:19'),
(25, 'Presidents\' Day', '2025-02-17', 2025, 0, '2026-08-18 14:51:19'),
(26, 'Memorial Day', '2025-05-26', 2025, 0, '2026-08-18 14:51:19'),
(27, 'Juneteenth', '2025-06-19', 2025, 0, '2026-08-18 14:51:19'),
(28, 'Independence Day', '2025-07-04', 2025, 0, '2026-08-18 14:51:19'),
(29, 'Labor Day', '2025-09-01', 2025, 0, '2026-08-18 14:51:19'),
(30, 'Columbus Day', '2025-10-13', 2025, 0, '2026-08-18 14:51:19'),
(31, 'Veterans Day', '2025-11-11', 2025, 0, '2026-08-18 14:51:19'),
(32, 'Thanksgiving', '2025-11-27', 2025, 0, '2026-08-18 14:51:19'),
(33, 'Christmas Day', '2025-12-25', 2025, 0, '2026-08-18 14:51:19'),
(56, 'New Year\'s Day', '2027-01-01', 2027, 0, '2026-09-01 12:55:55'),
(57, 'Martin Luther King Jr. Day', '2027-01-18', 2027, 0, '2026-09-01 12:55:55'),
(58, 'Presidents\' Day', '2027-02-15', 2027, 0, '2026-09-01 12:55:55'),
(59, 'Memorial Day', '2027-05-31', 2027, 0, '2026-09-01 12:55:55'),
(60, 'Juneteenth', '2027-06-18', 2027, 1, '2026-09-01 12:55:55'),
(61, 'Independence Day', '2027-07-05', 2027, 1, '2026-09-01 12:55:55'),
(62, 'Labor Day', '2027-09-06', 2027, 0, '2026-09-01 12:55:55'),
(63, 'Columbus Day', '2027-10-11', 2027, 0, '2026-09-01 12:55:55'),
(64, 'Veterans Day', '2027-11-11', 2027, 0, '2026-09-01 12:55:55'),
(65, 'Thanksgiving', '2027-11-25', 2027, 0, '2026-09-01 12:55:55'),
(66, 'Christmas Day', '2027-12-24', 2027, 1, '2026-09-01 12:55:55');

-- --------------------------------------------------------

--
-- Table structure for table `leave_balances`
--

CREATE TABLE `leave_balances` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `leave_type` varchar(50) DEFAULT 'Vacation Leave',
  `total_days` decimal(5,2) DEFAULT 0.00,
  `used_days` decimal(5,2) DEFAULT 0.00,
  `year` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leave_requests`
--

CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `leave_type` varchar(50) DEFAULT 'Vacation Leave',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `total_days` decimal(5,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `admin_remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0,
  `previous_status` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leave_requests`
--

INSERT INTO `leave_requests` (`id`, `user_id`, `leave_type`, `start_date`, `end_date`, `total_days`, `reason`, `status`, `admin_remarks`, `created_at`, `updated_at`, `is_deleted`, `previous_status`) VALUES
(17, 1, 'Leave', '2026-09-10', '2026-09-10', 1.00, 'Leave via Calendar', 'approved', NULL, '2026-09-09 18:07:41', '2026-09-21 18:55:59', 0, 'approved'),
(18, 1, 'Leave', '2026-09-22', '2026-09-22', 1.00, 'Leave via Calendar', 'approved', NULL, '2026-09-22 14:06:54', '2026-09-22 14:06:54', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `message`, `is_read`, `created_at`) VALUES
(1, 1, 'success', 'AM IN logged successfully at 10:47:06', 1, '2026-08-13 14:47:06'),
(4, 1, 'success', 'PM OUT logged successfully at 11:42:57', 1, '2026-08-13 15:42:57'),
(23, 1, 'success', 'AM IN logged successfully at 08:58:31', 1, '2026-08-14 12:58:31'),
(30, 1, 'success', 'Calendar event \"Test\" created', 1, '2026-08-14 13:51:10'),
(31, 1, 'success', 'Calendar event \"Test\" created', 1, '2026-08-14 13:53:08'),
(43, 1, 'success', 'Profile updated successfully', 1, '2026-08-14 14:43:04'),
(45, 1, 'success', 'PM OUT logged successfully at 12:44:25', 1, '2026-08-14 16:44:25'),
(50, 1, 'success', 'Your reschedule request \"Test\" was approved and applied.', 1, '2026-08-18 13:40:57'),
(51, 1, 'success', 'Your reschedule request \"Test\" was approved and applied.', 1, '2026-08-18 13:41:39'),
(52, 1, 'success', 'AM IN logged successfully at 09:50:40', 1, '2026-08-18 13:50:40'),
(53, 1, 'success', 'PM OUT logged successfully at 09:50:55', 1, '2026-08-18 13:50:55'),
(56, 1, 'success', 'Seeded 0 holidays for 2026. 11 already existed.', 1, '2026-08-18 14:41:42'),
(57, 1, 'success', 'Seeded 11 holidays for 2025. 0 already existed.', 1, '2026-08-18 14:51:19'),
(59, 1, 'success', 'Calendar event \"Test\" created', 1, '2026-08-18 15:59:43'),
(66, 1, 'success', 'Seeded 0 holidays for 2026. 11 already existed.', 1, '2026-08-19 16:07:40'),
(67, 1, 'error', 'SQLSTATE[42S02]: Base table or view not found: 1146 Table \'ems_db.leave_balances\' doesn\'t exist', 1, '2026-08-19 16:17:51'),
(68, 1, 'success', 'Seeded 0 holidays for 2026. 11 already existed.', 1, '2026-08-19 16:24:54'),
(69, 1, 'success', 'AM IN logged successfully at 12:42:52', 1, '2026-08-19 16:42:52'),
(70, 1, 'success', 'AM IN logged successfully at 12:43:03', 1, '2026-08-19 16:43:03'),
(71, 1, 'success', 'AM IN logged successfully at 12:43:09', 1, '2026-08-19 16:43:09'),
(72, 1, 'success', 'AM IN logged successfully at 12:43:26', 1, '2026-08-19 16:43:26'),
(73, 1, 'success', 'AM IN logged successfully at 12:49:48', 1, '2026-08-19 16:49:48'),
(74, 1, 'success', 'AM IN logged successfully at 12:50:16', 1, '2026-08-19 16:50:16'),
(82, 1, 'success', 'Event updated successfully.', 1, '2026-08-19 21:21:11'),
(83, 1, 'success', 'Record updated successfully', 1, '2026-08-19 21:58:12'),
(84, 1, 'success', 'Record updated successfully', 1, '2026-08-19 21:58:33'),
(85, 1, 'success', 'AM IN logged successfully at 08:54:44', 1, '2026-08-20 12:54:44'),
(92, 1, 'success', 'Record updated successfully', 1, '2026-08-20 16:10:58'),
(93, 1, 'success', 'Event updated successfully.', 1, '2026-08-20 16:11:51'),
(94, 1, 'success', 'Event assigned successfully.', 1, '2026-08-20 16:18:25'),
(95, 1, 'success', 'Record added successfully', 1, '2026-08-20 16:48:58'),
(96, 1, 'success', '2 events assigned successfully.', 1, '2026-08-20 18:03:50'),
(112, 1, 'success', 'Event updated successfully.', 1, '2026-08-20 19:26:31'),
(113, 1, 'success', 'AM IN logged successfully at 09:10:04', 1, '2026-08-21 13:10:04'),
(120, 1, 'success', 'Employee updated successfully', 1, '2026-08-21 13:54:18'),
(123, 1, 'success', 'Profile updated successfully', 1, '2026-08-21 14:16:22'),
(126, 1, 'success', 'Employee updated successfully', 1, '2026-08-21 14:22:29'),
(129, 1, 'success', 'Employee updated successfully', 1, '2026-08-21 14:31:29'),
(132, 1, 'success', 'Employee updated successfully', 1, '2026-08-21 14:36:53'),
(135, 1, 'success', 'Employee updated successfully', 1, '2026-08-21 14:37:38'),
(136, 1, 'success', 'Export completed successfully.', 1, '2026-08-21 14:46:42'),
(141, 1, 'success', 'Event updated successfully.', 1, '2026-08-21 14:57:20'),
(147, 1, 'success', 'Government ID uploaded successfully!', 1, '2026-08-21 15:35:50'),
(148, 1, 'success', 'Government ID deleted.', 1, '2026-08-21 15:40:40'),
(149, 1, 'success', 'Government ID uploaded successfully!', 1, '2026-08-21 15:40:51'),
(168, 1, 'success', 'Government ID uploaded successfully!', 1, '2026-08-21 18:52:25'),
(169, 1, 'success', 'Government ID uploaded successfully!', 1, '2026-08-21 18:59:56'),
(170, 1, 'success', 'Government ID deleted.', 1, '2026-08-21 19:00:05'),
(171, 1, 'success', 'PM OUT logged successfully at 15:51:40', 1, '2026-08-21 19:51:40'),
(172, 1, 'success', 'Record updated successfully', 1, '2026-08-21 21:24:38'),
(174, 1, 'success', 'Event assigned successfully.', 1, '2026-08-24 13:58:12'),
(175, 1, 'success', 'Event updated successfully.', 1, '2026-08-24 14:15:03'),
(176, 1, 'success', 'AM IN logged successfully at 09:29:08', 1, '2026-08-25 13:29:08'),
(178, 1, 'success', 'Event updated successfully.', 1, '2026-08-25 13:48:54'),
(179, 1, 'success', 'Event updated successfully.', 1, '2026-08-25 13:49:26'),
(180, 1, 'success', 'Leave request deleted successfully', 1, '2026-08-25 14:24:56'),
(181, 1, 'success', 'Leave request deleted successfully', 1, '2026-08-25 14:25:23'),
(182, 1, 'success', 'Event updated successfully.', 1, '2026-08-25 14:28:55'),
(183, 1, 'success', 'Event updated successfully.', 1, '2026-08-25 14:29:24'),
(186, 1, 'success', 'Event updated successfully.', 1, '2026-08-26 13:46:45'),
(187, 1, 'success', 'Leave request deleted successfully', 1, '2026-08-26 16:32:51'),
(189, 1, 'success', 'AM IN logged successfully', 1, '2026-08-27 14:32:49'),
(190, 1, 'success', 'AM OUT logged successfully', 1, '2026-08-27 14:45:33'),
(194, 1, 'success', 'PM IN logged successfully', 1, '2026-08-27 15:50:59'),
(195, 1, 'success', 'PM OUT logged successfully', 1, '2026-08-27 15:51:12'),
(196, 1, 'success', 'AM IN logged successfully', 1, '2026-08-27 16:09:26'),
(197, 1, 'success', 'AM OUT logged successfully', 1, '2026-08-27 16:09:34'),
(198, 1, 'success', 'PM IN logged successfully', 1, '2026-08-27 16:09:37'),
(199, 1, 'success', 'Employee updated successfully', 1, '2026-08-27 16:18:48'),
(204, 1, 'success', 'PM OUT logged successfully', 1, '2026-08-27 21:28:09'),
(205, 1, 'success', 'Employee updated successfully', 1, '2026-08-28 13:20:57'),
(206, 1, 'success', 'Employee updated successfully', 1, '2026-08-28 13:21:07'),
(207, 1, 'success', 'Government ID uploaded successfully!', 1, '2026-08-28 13:24:33'),
(209, 1, 'success', 'AM IN logged successfully', 1, '2026-08-28 16:34:27'),
(210, 1, 'success', 'AM OUT logged successfully', 1, '2026-08-28 16:34:44'),
(211, 1, 'success', 'PM IN logged successfully', 1, '2026-08-28 16:34:54'),
(218, 1, 'success', 'PM OUT logged successfully', 1, '2026-08-28 21:30:16'),
(219, 1, 'success', 'Employee created successfully', 1, '2026-08-28 21:35:21'),
(226, 1, 'success', 'AM IN logged successfully', 1, '2026-08-31 12:51:08'),
(227, 1, 'success', 'Record updated successfully', 1, '2026-08-31 19:05:53'),
(231, 1, 'error', 'You have reached the maximum limit of 3 leave requests for this year.', 1, '2026-08-31 19:10:48'),
(232, 1, 'success', 'Event assigned successfully.', 1, '2026-08-31 19:11:19'),
(233, 1, 'success', 'AM IN logged successfully', 1, '2026-09-01 14:18:27'),
(234, 1, 'error', 'Date 2026-09-30: You have reached the maximum limit of 3 leave requests for this year.', 1, '2026-09-01 14:18:52'),
(235, 1, 'error', 'Date 2026-09-29: You have reached the maximum limit of 3 leave requests for this year.', 1, '2026-09-01 14:18:52'),
(236, 1, 'error', 'Failed to save events.', 1, '2026-09-01 14:18:52'),
(237, 1, 'success', '2 events assigned successfully.', 1, '2026-09-01 14:19:51'),
(238, 1, 'success', 'Leave request deleted successfully', 1, '2026-09-01 14:20:04'),
(316, 1, 'success', 'AM IN logged successfully', 1, '2026-09-02 12:57:25'),
(322, 1, 'success', 'Employee updated successfully', 1, '2026-09-02 15:55:30'),
(324, 1, 'success', 'Leave request deleted successfully', 1, '2026-09-02 16:46:21'),
(325, 1, 'success', 'Welcome Admin', 1, '2026-09-02 19:29:45'),
(326, 1, 'success', 'PM OUT logged successfully', 1, '2026-09-02 19:31:01'),
(327, 1, 'success', 'PM IN logged successfully', 1, '2026-09-02 19:31:12'),
(328, 1, 'success', 'AM IN logged successfully', 1, '2026-09-02 21:17:01'),
(329, 1, 'success', 'Record deleted successfully', 1, '2026-09-02 21:17:13'),
(330, 1, 'success', 'Record deleted successfully', 1, '2026-09-02 21:17:24'),
(331, 1, 'success', 'AM IN logged successfully', 1, '2026-09-02 21:17:33'),
(332, 1, 'success', 'Record updated successfully', 1, '2026-09-02 21:18:05'),
(333, 1, 'success', 'Record deleted successfully', 1, '2026-09-02 21:18:13'),
(334, 1, 'success', 'AM OUT logged successfully', 1, '2026-09-02 21:18:23'),
(335, 1, 'success', 'PM OUT logged successfully', 1, '2026-09-02 21:18:27'),
(341, 1, 'success', 'Welcome Admin', 1, '2026-09-02 21:31:02'),
(343, 1, 'success', 'Request successfully approved.', 1, '2026-09-02 21:31:21'),
(344, 1, 'success', 'Event updated successfully.', 1, '2026-09-02 21:39:50'),
(345, 1, 'success', 'AM IN logged successfully', 1, '2026-09-03 13:40:11'),
(346, 1, 'success', 'PM OUT logged successfully', 1, '2026-09-03 13:40:13'),
(347, 1, 'success', 'Welcome Admin', 1, '2026-09-04 14:08:11'),
(348, 1, 'success', 'Welcome Admin', 1, '2026-09-04 14:08:14'),
(351, 1, 'success', 'Welcome Admin', 1, '2026-09-09 14:53:06'),
(352, 1, 'success', 'Event assigned successfully.', 1, '2026-09-09 15:43:45'),
(353, 1, 'success', 'Request successfully approved.', 1, '2026-09-09 16:17:35'),
(354, 1, 'success', 'Employee updated successfully', 1, '2026-09-09 16:22:39'),
(355, 1, 'success', 'Employee updated successfully', 1, '2026-09-09 16:22:44'),
(356, 1, 'success', 'Welcome Admin', 1, '2026-09-09 16:23:03'),
(357, 1, 'success', 'Employee updated successfully', 1, '2026-09-09 16:23:15'),
(360, 1, 'success', 'Welcome Admin', 1, '2026-09-09 18:02:26'),
(361, 1, 'success', 'AM IN logged successfully', 1, '2026-09-09 18:03:30'),
(362, 1, 'success', 'Event assigned successfully.', 1, '2026-09-09 18:07:41'),
(363, 1, 'success', 'Event assigned successfully.', 1, '2026-09-09 18:08:26'),
(364, 1, 'success', 'Welcome Admin', 1, '2026-09-10 15:57:42'),
(365, 1, 'info', 'New message from Administrator', 1, '2026-09-10 16:05:25'),
(368, 1, 'info', 'New message from Employee', 1, '2026-09-10 18:33:07'),
(369, 1, 'info', 'New message from Employee', 1, '2026-09-10 18:33:10'),
(370, 1, 'success', 'Welcome Admin', 1, '2026-09-10 18:33:18'),
(373, 1, 'success', 'Welcome Admin', 1, '2026-09-10 20:26:27'),
(379, 1, 'success', 'AM IN logged successfully', 1, '2026-09-10 21:59:33'),
(382, 1, 'success', 'Welcome Admin', 1, '2026-09-11 14:01:56'),
(384, 1, 'success', 'Welcome Admin', 1, '2026-09-14 15:42:59'),
(386, 1, 'info', 'New message from Employee', 1, '2026-09-14 15:43:25'),
(393, 1, 'info', 'New message from Employee', 1, '2026-09-14 16:15:50'),
(396, 1, 'info', 'New message from Employee', 1, '2026-09-14 16:21:16'),
(398, 1, 'info', 'New message from Employee', 1, '2026-09-14 16:21:33'),
(400, 1, 'info', 'New message from Employee', 1, '2026-09-14 16:22:01'),
(401, 1, 'info', 'New message from Employee', 1, '2026-09-14 16:23:13'),
(404, 1, 'info', 'New message from Employee', 1, '2026-09-14 18:15:07'),
(406, 1, 'success', 'Employee updated successfully', 1, '2026-09-14 18:22:09'),
(408, 1, 'info', 'New message from Employee', 1, '2026-09-14 18:51:40'),
(409, 1, 'info', 'New message from Employee', 1, '2026-09-14 18:51:58'),
(414, 1, 'success', 'Welcome Admin', 1, '2026-09-14 19:52:30'),
(415, 1, 'success', 'AM IN logged successfully', 1, '2026-09-15 13:06:08'),
(416, 1, 'success', 'PM OUT logged successfully', 1, '2026-09-15 16:56:34'),
(417, 1, 'success', 'Employee updated successfully', 1, '2026-09-15 16:57:32'),
(419, 1, 'success', 'Welcome Admin', 1, '2026-09-15 17:01:11'),
(420, 1, 'success', 'Government ID uploaded successfully!', 1, '2026-09-15 18:06:55'),
(424, 1, 'success', 'Welcome Admin', 1, '2026-09-17 13:40:24'),
(425, 1, 'success', 'Welcome Admin', 1, '2026-09-17 13:41:07'),
(426, 1, 'success', 'AM IN logged successfully', 1, '2026-09-17 18:22:19'),
(429, 1, 'info', 'New message from Employee', 1, '2026-09-17 19:50:30'),
(430, 1, 'success', 'Welcome Admin', 1, '2026-09-17 19:50:39'),
(431, 1, 'success', 'Employee updated successfully', 1, '2026-09-17 21:54:24'),
(440, 1, 'success', 'Employee updated successfully', 1, '2026-09-18 18:12:46'),
(441, 1, 'success', 'Employee updated successfully', 1, '2026-09-18 18:13:30'),
(442, 1, 'success', 'Employee created successfully', 1, '2026-09-18 18:14:10'),
(445, 1, 'success', 'Employee updated successfully', 1, '2026-09-18 18:19:54'),
(452, 1, 'success', 'Welcome Admin', 1, '2026-09-18 18:23:59'),
(453, 1, 'error', 'You have no assigned leave credits. You cannot submit a leave request.', 1, '2026-09-18 18:28:31'),
(454, 1, 'success', 'Event assigned successfully.', 1, '2026-09-18 18:28:36'),
(455, 1, 'success', 'Welcome Admin', 1, '2026-09-18 18:45:08'),
(456, 1, 'success', 'Welcome Admin', 1, '2026-09-18 18:45:28'),
(457, 11, 'success', 'Welcome Admin', 1, '2026-09-18 18:45:38'),
(459, 1, 'info', 'New message from Employee', 1, '2026-09-18 18:48:05'),
(462, 11, 'success', 'Schedule cancelled. It will be fully removed after 3 days.', 1, '2026-09-18 18:49:25'),
(463, 1, 'success', 'Employee updated successfully', 1, '2026-09-18 18:51:32'),
(466, 1, 'success', 'Request successfully approved.', 1, '2026-09-18 18:58:04'),
(467, 11, 'success', 'Event updated successfully.', 1, '2026-09-18 18:59:29'),
(468, 11, 'success', 'Schedule cancelled. It will be fully removed after 3 days.', 1, '2026-09-18 18:59:34'),
(469, 11, 'success', 'Event updated successfully.', 1, '2026-09-18 18:59:49'),
(470, 11, 'success', 'Schedule cancelled. It will be fully removed after 3 days.', 1, '2026-09-18 18:59:59'),
(471, 11, 'success', 'AM IN logged successfully', 1, '2026-09-18 19:02:13'),
(472, 11, 'success', 'Seeded 0 holidays for 2026. 11 already existed.', 1, '2026-09-18 19:13:56'),
(473, 11, 'success', 'Item restored successfully.', 1, '2026-09-18 19:17:05'),
(474, 11, 'success', 'Government ID deleted.', 1, '2026-09-18 19:23:08'),
(476, 11, 'success', 'Welcome Admin', 1, '2026-09-21 13:31:04'),
(477, 1, 'success', 'Welcome Admin', 1, '2026-09-21 13:31:53'),
(478, 1, 'success', 'Schedule cancelled. It will be fully removed after 3 days.', 1, '2026-09-21 13:34:56'),
(479, 1, 'success', 'Cancelled schedule removed from calendar.', 1, '2026-09-21 18:42:42'),
(480, 1, 'success', 'Schedule cancelled. It will be fully removed after 3 days.', 1, '2026-09-21 18:44:02'),
(481, 1, 'success', 'Cancelled schedule removed from calendar.', 1, '2026-09-21 18:44:27'),
(482, 1, 'success', 'Government ID uploaded successfully!', 1, '2026-09-21 18:45:47'),
(483, 1, 'success', 'AM IN logged successfully', 1, '2026-09-21 18:49:55'),
(484, 1, 'success', 'AM IN logged successfully', 1, '2026-09-21 18:51:15'),
(485, 11, 'info', 'New message from Aly', 1, '2026-09-21 18:52:14'),
(486, 11, 'success', 'Welcome Admin', 1, '2026-09-21 18:52:31'),
(487, 1, 'info', 'New message from Finance', 1, '2026-09-21 18:53:02'),
(488, 11, 'success', 'Welcome Admin', 1, '2026-09-21 18:54:38'),
(489, 11, 'success', 'AM IN logged successfully', 1, '2026-09-21 18:55:03'),
(490, 11, 'success', 'Item restored successfully.', 1, '2026-09-21 18:55:43'),
(491, 11, 'success', 'Item restored successfully.', 1, '2026-09-21 18:55:59'),
(492, 11, 'success', 'Seeded 0 holidays for 2026. 11 already existed.', 1, '2026-09-21 18:56:48'),
(493, 11, 'success', 'Welcome Admin', 1, '2026-09-21 20:45:11'),
(494, 11, 'success', 'PM OUT logged successfully', 1, '2026-09-21 20:45:47'),
(495, 11, 'error', 'You have no assigned leave credits. You cannot submit a leave request.', 1, '2026-09-21 20:57:17'),
(496, 11, 'success', '2 events assigned successfully.', 1, '2026-09-21 20:57:35'),
(497, 11, 'success', 'Record deleted successfully', 1, '2026-09-21 21:01:30'),
(498, 11, 'success', 'Record added successfully', 1, '2026-09-21 21:01:42'),
(499, 11, 'success', 'Record deleted successfully', 1, '2026-09-21 21:01:47'),
(500, 11, 'success', 'Record added successfully', 1, '2026-09-21 21:01:52'),
(501, 11, 'success', 'Record deleted successfully', 1, '2026-09-21 21:01:57'),
(502, 11, 'success', 'Welcome Admin', 1, '2026-09-22 13:41:39'),
(503, 1, 'success', 'Welcome Admin', 1, '2026-09-22 13:42:36'),
(504, 11, 'success', 'AM IN logged successfully', 1, '2026-09-22 13:45:52'),
(505, 11, 'error', 'Date 2026-09-24: You have no assigned leave credits. You cannot submit a leave request.', 0, '2026-09-22 13:52:25'),
(506, 11, 'error', 'Date 2026-09-30: You have no assigned leave credits. You cannot submit a leave request.', 0, '2026-09-22 13:52:25'),
(507, 11, 'error', 'Date 2026-09-25: You have no assigned leave credits. You cannot submit a leave request.', 0, '2026-09-22 13:52:26'),
(508, 11, 'error', 'Failed to save events.', 0, '2026-09-22 13:52:26'),
(509, 11, 'error', 'Date 2026-09-26: You have no assigned leave credits. You cannot submit a leave request.', 0, '2026-09-22 13:52:26'),
(510, 1, 'success', 'Welcome Admin', 1, '2026-09-22 13:56:13'),
(511, 11, 'error', 'Date 2026-09-23: A schedule already exists for this date. Please edit the existing schedule to avoid duplication.', 0, '2026-09-22 14:00:20'),
(512, 11, 'error', 'Date 2026-09-24: You have no assigned leave credits. You cannot submit a leave request.', 0, '2026-09-22 14:00:20'),
(513, 11, 'error', 'Failed to save events.', 0, '2026-09-22 14:00:20'),
(514, 11, 'error', 'Date 2026-09-25: You have no assigned leave credits. You cannot submit a leave request.', 0, '2026-09-22 14:00:20'),
(515, 11, 'error', 'Date 2026-09-23: A schedule already exists for this date. Please edit the existing schedule to avoid duplication.', 0, '2026-09-22 14:00:31'),
(516, 11, 'success', '2 events assigned successfully.', 0, '2026-09-22 14:00:31'),
(517, 11, 'info', 'Admin has assigned a new WS for Sep 29, 2026.', 0, '2026-09-22 14:01:15'),
(518, 11, 'success', '2 events assigned successfully.', 0, '2026-09-22 14:04:18'),
(519, 11, 'success', 'Schedule cancelled. It will be fully removed after 3 days.', 0, '2026-09-22 14:04:47'),
(520, 11, 'success', 'Cancelled schedule removed from calendar.', 0, '2026-09-22 14:05:11'),
(521, 11, 'success', 'Welcome Admin', 0, '2026-09-22 14:05:56'),
(522, 1, 'info', 'Admin has assigned a Leave for Sep 22, 2026.', 1, '2026-09-22 14:06:54'),
(523, 11, 'success', 'PM IN logged successfully', 0, '2026-09-22 14:06:58'),
(524, 11, 'success', 'AM OUT logged successfully', 0, '2026-09-22 14:07:01'),
(525, 11, 'success', 'PM OUT logged successfully', 0, '2026-09-22 14:07:20'),
(526, 11, 'success', 'Record updated successfully', 0, '2026-09-22 14:07:42'),
(527, 1, 'success', 'AM IN logged successfully', 0, '2026-09-22 14:22:42');

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `system_logs`
--

INSERT INTO `system_logs` (`id`, `user_id`, `action`, `description`, `created_at`, `ip_address`, `user_agent`) VALUES
(1, 1, 'LOGIN', 'User logged in successfully.', '2026-08-13 10:46:53', NULL, NULL),
(2, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-13 10:47:06', '2026-08-13 10:47:06', NULL, NULL),
(3, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-13 10:57:39', NULL, NULL),
(4, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-13 10:57:46', '2026-08-13 10:57:46', NULL, NULL),
(5, NULL, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-13 10:58:56 (Hours: 0.02)', '2026-08-13 10:58:56', NULL, NULL),
(6, 1, 'LOGIN', 'User logged in successfully.', '2026-08-13 11:26:14', NULL, NULL),
(7, 1, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-13 11:42:57 (Hours: 0.93)', '2026-08-13 11:42:57', NULL, NULL),
(8, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-13 12:31:22', NULL, NULL),
(9, 1, 'LOGIN', 'User logged in successfully.', '2026-08-13 12:39:41', NULL, NULL),
(10, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-13 12:56:54', NULL, NULL),
(11, 1, 'LOGIN', 'User logged in successfully.', '2026-08-13 14:07:46', NULL, NULL),
(12, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-13 14:16:21', NULL, NULL),
(13, 1, 'LOGIN', 'User logged in successfully.', '2026-08-13 14:16:38', NULL, NULL),
(14, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-13 14:51:26', NULL, NULL),
(15, 1, 'LOGIN', 'User logged in successfully.', '2026-08-13 15:06:58', NULL, NULL),
(16, NULL, 'CREATE_EMPLOYEE', 'Employee Seth created.', '2026-08-13 15:07:28', NULL, NULL),
(17, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-13 15:07:35', NULL, NULL),
(18, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-13 15:08:09', '2026-08-13 15:08:09', NULL, NULL),
(19, NULL, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-13 15:21:32 (Hours: 0.22)', '2026-08-13 15:21:32', NULL, NULL),
(20, 1, 'LOGIN', 'User logged in successfully.', '2026-08-13 15:32:27', NULL, NULL),
(21, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-13 15:36:10', NULL, NULL),
(22, 1, 'LOGIN', 'User logged in successfully.', '2026-08-13 15:36:44', NULL, NULL),
(23, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-13 15:40:35', NULL, NULL),
(24, NULL, 'SUBMIT_REQUEST', 'Submitted Other request for 2026-08-12.', '2026-08-13 16:59:42', NULL, NULL),
(25, NULL, 'SUBMIT_REQUEST', 'Submitted Other request for 2026-08-13.', '2026-08-13 16:59:42', NULL, NULL),
(26, NULL, 'SUBMIT_REQUEST', 'Submitted Other request for 2026-08-14.', '2026-08-13 16:59:42', NULL, NULL),
(27, NULL, 'SUBMIT_REQUEST', 'Submitted Other request for 2026-08-15.', '2026-08-13 16:59:42', NULL, NULL),
(28, NULL, 'SUBMIT_REQUEST', 'Submitted Other request for 2026-08-16.', '2026-08-13 16:59:42', NULL, NULL),
(29, NULL, 'SUBMIT_REQUEST', 'Submitted Other request for 2026-08-17.', '2026-08-13 16:59:42', NULL, NULL),
(30, NULL, 'SUBMIT_REQUEST', 'Submitted Other request for 2026-08-18.', '2026-08-13 16:59:42', NULL, NULL),
(31, NULL, 'SUBMIT_REQUEST', 'Submitted Other request for 2026-08-19.', '2026-08-13 16:59:42', NULL, NULL),
(32, 1, 'LOGIN', 'User logged in successfully.', '2026-08-13 17:10:35', NULL, NULL),
(41, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-13 17:14:57', NULL, NULL),
(42, 1, 'LOGIN', 'User logged in successfully.', '2026-08-13 17:18:42', NULL, NULL),
(43, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-13 17:34:13', NULL, NULL),
(44, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-14 08:48:34', '2026-08-14 08:48:34', NULL, NULL),
(45, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 08:56:26', NULL, NULL),
(46, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-14 08:56:30', '2026-08-14 08:56:30', NULL, NULL),
(47, NULL, 'SUBMIT_REQUEST', 'Submitted Other request for 2026-08-19.', '2026-08-14 08:56:54', NULL, NULL),
(48, NULL, 'SUBMIT_REQUEST', 'Submitted Other request for 2026-08-20.', '2026-08-14 08:56:54', NULL, NULL),
(49, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 08:57:01', NULL, NULL),
(52, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-14 08:58:31', '2026-08-14 08:58:31', NULL, NULL),
(53, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:08:59', NULL, NULL),
(54, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:19:02', NULL, NULL),
(56, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:22:39', NULL, NULL),
(57, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-03.', '2026-08-14 09:33:16', NULL, NULL),
(58, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:33:22', NULL, NULL),
(60, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:37:29', NULL, NULL),
(61, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:37:55', NULL, NULL),
(62, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:43:10', NULL, NULL),
(63, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-26.', '2026-08-14 09:43:21', NULL, NULL),
(64, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:43:25', NULL, NULL),
(65, 1, 'UPDATE_REQUEST', 'Updated request ID 12 status to approved.', '2026-08-14 09:43:29', NULL, NULL),
(66, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 11.', '2026-08-14 09:44:51', NULL, NULL),
(67, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 1.', '2026-08-14 09:44:59', NULL, NULL),
(68, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 2.', '2026-08-14 09:45:01', NULL, NULL),
(69, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 3.', '2026-08-14 09:45:10', NULL, NULL),
(70, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 4.', '2026-08-14 09:45:12', NULL, NULL),
(71, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 5.', '2026-08-14 09:45:13', NULL, NULL),
(72, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 6.', '2026-08-14 09:45:15', NULL, NULL),
(73, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 7.', '2026-08-14 09:45:17', NULL, NULL),
(74, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 8.', '2026-08-14 09:45:18', NULL, NULL),
(75, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 9.', '2026-08-14 09:45:20', NULL, NULL),
(76, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 10.', '2026-08-14 09:45:21', NULL, NULL),
(77, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:45:53', NULL, NULL),
(78, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:47:38', NULL, NULL),
(79, 1, 'SUBMIT_REQUEST', 'Submitted HL request for 2026-08-14.', '2026-08-14 09:51:10', NULL, NULL),
(80, 1, 'SUBMIT_REQUEST', 'Submitted VL request for 2026-07-30.', '2026-08-14 09:53:08', NULL, NULL),
(81, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:53:21', NULL, NULL),
(82, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 09:56:54', NULL, NULL),
(83, NULL, 'CANCEL_REQUEST', 'Cancelled pending request ID 12.', '2026-08-14 10:04:21', NULL, NULL),
(84, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-03.', '2026-08-14 10:12:13', NULL, NULL),
(85, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:12:16', NULL, NULL),
(86, 1, 'UPDATE_REQUEST', 'Updated request ID 15 status to approved.', '2026-08-14 10:12:24', NULL, NULL),
(87, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:13:06', NULL, NULL),
(88, NULL, 'CANCEL_REQUEST', 'Cancelled pending request ID 16.', '2026-08-14 10:13:29', NULL, NULL),
(89, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:13:53', NULL, NULL),
(90, 1, 'APPROVE_RESCHEDULE', 'Approved reschedule request. Applied to original event 15.', '2026-08-14 10:14:05', NULL, NULL),
(91, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 13.', '2026-08-14 10:14:28', NULL, NULL),
(92, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:14:44', NULL, NULL),
(93, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:16:43', NULL, NULL),
(94, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:20:43', NULL, NULL),
(95, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:22:21', NULL, NULL),
(96, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:25:41', NULL, NULL),
(97, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:26:08', NULL, NULL),
(98, 1, 'APPROVE_RESCHEDULE', 'Approved reschedule request. Applied to original event 15.', '2026-08-14 10:26:13', NULL, NULL),
(100, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:37:46', NULL, NULL),
(101, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 10:39:35', NULL, NULL),
(102, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 11:33:28', NULL, NULL),
(103, NULL, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-14 11:46:41 (Hours: 2.84)', '2026-08-14 11:46:41', NULL, NULL),
(104, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 11:49:05', NULL, NULL),
(105, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 12:02:56', NULL, NULL),
(106, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 12:06:20', NULL, NULL),
(107, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 12:39:01', NULL, NULL),
(108, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 12:44:18', NULL, NULL),
(109, 1, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-14 12:44:25 (Hours: 3.77)', '2026-08-14 12:44:25', NULL, NULL),
(110, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 12:44:40', NULL, NULL),
(111, 1, 'UPDATE_EMPLOYEE', 'Employee admin updated.', '2026-08-14 12:45:01', NULL, NULL),
(112, NULL, 'CREATE_EMPLOYEE', 'Employee johndoe1 created.', '2026-08-14 12:47:22', NULL, NULL),
(113, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 12:47:35', NULL, NULL),
(114, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-14 12:47:38', '2026-08-14 12:47:38', NULL, NULL),
(115, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-13.', '2026-08-14 12:47:51', NULL, NULL),
(116, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 12:47:58', NULL, NULL),
(117, 1, 'UPDATE_REQUEST', 'Updated request ID 19 status to approved.', '2026-08-14 12:48:38', NULL, NULL),
(118, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 12:48:53', NULL, NULL),
(119, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 12:54:15', NULL, NULL),
(120, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-14 14:06:27', NULL, NULL),
(121, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 14:21:58', NULL, NULL),
(122, 1, 'LOGIN', 'User logged in successfully.', '2026-08-14 17:09:47', NULL, NULL),
(123, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-18 09:27:46', NULL, NULL),
(124, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-18 15:28:03', '2026-08-18 09:28:03', NULL, NULL),
(125, 1, 'LOGIN', 'User logged in successfully.', '2026-08-18 09:35:55', NULL, NULL),
(126, 1, 'APPROVE_RESCHEDULE', 'Approved reschedule request. Applied to original event 14.', '2026-08-18 09:40:57', NULL, NULL),
(127, 1, 'APPROVE_RESCHEDULE', 'Approved reschedule request. Applied to original event 14.', '2026-08-18 09:41:39', NULL, NULL),
(128, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-18 15:50:40', '2026-08-18 09:50:40', NULL, NULL),
(129, 1, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-18 15:50:55 (Hours: 0)', '2026-08-18 09:50:55', NULL, NULL),
(130, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-18 09:51:38', NULL, NULL),
(131, NULL, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-18 15:57:58 (Hours: 0.5)', '2026-08-18 09:57:58', NULL, NULL),
(132, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-18 10:03:43', '2026-08-18 10:03:43', NULL, NULL),
(133, 1, 'LOGIN', 'User logged in successfully.', '2026-08-18 10:06:39', NULL, NULL),
(134, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-18 10:56:14', NULL, NULL),
(135, NULL, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-18 10:56:28 (Hours: 0.88)', '2026-08-18 10:56:28', NULL, NULL),
(136, 1, 'LOGIN', 'User logged in successfully.', '2026-08-18 11:16:12', NULL, NULL),
(137, 1, 'LOGIN', 'User logged in successfully.', '2026-08-18 11:26:25', NULL, NULL),
(138, 1, 'LOGIN', 'User logged in successfully.', '2026-08-18 11:28:30', NULL, NULL),
(139, 1, 'LOGIN', 'User logged in successfully.', '2026-08-18 11:31:15', NULL, NULL),
(140, 1, 'LOGIN', 'User logged in successfully.', '2026-08-18 11:32:12', NULL, NULL),
(141, 1, 'SUBMIT_REQUEST', 'Submitted VL request for 2026-08-13.', '2026-08-18 11:59:43', NULL, NULL),
(142, 1, 'CANCEL_REQUEST', 'Cancelled pending request ID 14.', '2026-08-18 12:04:37', NULL, NULL),
(143, NULL, 'ASSIGN_SCHEDULE', 'Admin assigned VL for 2026-08-18.', '2026-08-18 12:04:53', NULL, NULL),
(144, NULL, 'UPDATE_EMPLOYEE', 'Employee johndoe updated.', '2026-08-18 14:20:48', NULL, NULL),
(145, NULL, 'UPDATE_EMPLOYEE', 'Employee johndoe updated.', '2026-08-18 14:21:12', NULL, NULL),
(146, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-18 15:06:06', NULL, NULL),
(147, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-18 15:06:10', '2026-08-18 15:06:10', NULL, NULL),
(148, NULL, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-18 15:06:13 (Hours: 0)', '2026-08-18 15:06:13', NULL, NULL),
(149, 1, 'LOGIN', 'User logged in successfully.', '2026-08-18 15:06:36', NULL, NULL),
(150, NULL, 'UPDATE_EMPLOYEE', 'Employee johndoe1 updated.', '2026-08-18 15:07:51', NULL, NULL),
(151, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-18 15:26:31', NULL, NULL),
(152, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-19.', '2026-08-18 15:28:39', NULL, NULL),
(153, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-20.', '2026-08-18 15:28:39', NULL, NULL),
(154, 1, 'LOGIN', 'User logged in successfully.', '2026-08-18 15:28:48', NULL, NULL),
(155, 1, 'UPDATE_REQUEST', 'Updated request ID 24 status to approved.', '2026-08-18 15:28:53', NULL, NULL),
(156, 1, 'UPDATE_REQUEST', 'Updated request ID 25 status to approved.', '2026-08-18 15:28:53', NULL, NULL),
(157, 1, 'LOGIN', 'User logged in successfully.', '2026-08-19 09:31:04', NULL, NULL),
(158, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-19 12:42:52', '2026-08-19 12:42:52', NULL, NULL),
(159, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-19 12:43:03', '2026-08-19 12:43:03', NULL, NULL),
(160, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-19 12:43:09', '2026-08-19 12:43:09', NULL, NULL),
(161, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-19 12:43:26', '2026-08-19 12:43:26', NULL, NULL),
(162, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-19 12:49:48', '2026-08-19 12:49:48', NULL, NULL),
(163, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-19 12:50:16', '2026-08-19 12:50:16', NULL, NULL),
(164, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-19 14:48:21', NULL, NULL),
(165, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-19 14:56:09', '2026-08-19 14:56:09', NULL, NULL),
(166, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-13.', '2026-08-19 15:00:51', NULL, NULL),
(167, 1, 'LOGIN', 'User logged in successfully.', '2026-08-19 15:01:06', NULL, NULL),
(168, 1, 'UPDATE_REQUEST', 'Updated request ID 26 status to rejected.', '2026-08-19 15:01:18', NULL, NULL),
(169, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-19 15:01:40', NULL, NULL),
(170, NULL, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-19 15:05:06 (Hours: 0.15)', '2026-08-19 15:05:06', NULL, NULL),
(171, NULL, 'SUBMIT_REQUEST', 'Submitted VL request for 2026-08-14.', '2026-08-19 15:10:47', NULL, NULL),
(172, 1, 'LOGIN', 'User logged in successfully.', '2026-08-19 15:10:55', NULL, NULL),
(173, 1, 'UPDATE_REQUEST', 'Updated request ID 27 status to approved.', '2026-08-19 15:13:28', NULL, NULL),
(174, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-19 15:15:28', NULL, NULL),
(175, 1, 'LOGIN', 'User logged in successfully.', '2026-08-19 15:40:02', NULL, NULL),
(176, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-20 08:54:44', '2026-08-20 08:54:44', NULL, NULL),
(177, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-20 10:07:10', NULL, NULL),
(178, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-20 10:07:16', '2026-08-20 10:07:16', NULL, NULL),
(179, 1, 'LOGIN', 'User logged in successfully.', '2026-08-20 10:22:39', NULL, NULL),
(180, 1, 'APPROVE_RESCHEDULE', 'Approved reschedule request. Applied to original event 25.', '2026-08-20 10:22:52', NULL, NULL),
(181, 1, 'APPROVE_RESCHEDULE', 'Approved reschedule request. Applied to original event 25.', '2026-08-20 10:22:53', NULL, NULL),
(182, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-20 12:08:39', NULL, NULL),
(183, NULL, 'DTR_CLOCK_OUT', 'Clocked out at 2026-08-20 12:09:00 (Hours: 2.03)', '2026-08-20 12:09:00', NULL, NULL),
(184, 1, 'LOGIN', 'User logged in successfully.', '2026-08-20 12:10:40', NULL, NULL),
(185, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-20.', '2026-08-20 12:18:25', NULL, NULL),
(186, NULL, 'SUBMIT_REQUEST', 'Submitted VL request for 2026-09-24.', '2026-08-20 14:03:50', NULL, NULL),
(187, NULL, 'SUBMIT_REQUEST', 'Submitted VL request for 2026-09-25.', '2026-08-20 14:03:50', NULL, NULL),
(188, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-20 14:04:00', NULL, NULL),
(189, 1, 'LOGIN', 'User logged in successfully.', '2026-08-20 14:04:28', NULL, NULL),
(190, 1, 'APPROVE_RESCHEDULE', 'Approved reschedule request. Applied to original event 32.', '2026-08-20 14:04:43', NULL, NULL),
(191, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-20 14:05:20', NULL, NULL),
(192, 1, 'LOGIN', 'User logged in successfully.', '2026-08-20 14:59:50', NULL, NULL),
(193, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-20 15:02:14', NULL, NULL),
(194, 1, 'LOGIN', 'User logged in successfully.', '2026-08-20 15:03:24', NULL, NULL),
(195, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-20 15:08:11', NULL, NULL),
(196, NULL, 'CANCEL_REQUEST', 'Deleted request ID 15.', '2026-08-20 15:17:07', NULL, NULL),
(197, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-25.', '2026-08-20 15:24:50', NULL, NULL),
(198, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-26.', '2026-08-20 15:24:50', NULL, NULL),
(199, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-27.', '2026-08-20 15:24:50', NULL, NULL),
(200, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-28.', '2026-08-20 15:24:50', NULL, NULL),
(201, NULL, 'SUBMIT_REQUEST', 'Submitted WS request for 2026-08-29.', '2026-08-20 15:24:50', NULL, NULL),
(202, 1, 'LOGIN', 'User logged in successfully.', '2026-08-20 15:25:00', NULL, NULL),
(203, 1, 'UPDATE_REQUEST', 'Updated request ID 35 status to approved.', '2026-08-20 15:25:11', NULL, NULL),
(204, 1, 'UPDATE_REQUEST', 'Updated request ID 37 status to approved.', '2026-08-20 15:25:11', NULL, NULL),
(205, 1, 'UPDATE_REQUEST', 'Updated request ID 36 status to approved.', '2026-08-20 15:25:11', NULL, NULL),
(206, 1, 'UPDATE_REQUEST', 'Updated request ID 38 status to approved.', '2026-08-20 15:25:11', NULL, NULL),
(207, 1, 'UPDATE_REQUEST', 'Updated request ID 34 status to approved.', '2026-08-20 15:25:11', NULL, NULL),
(208, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-20 15:48:32', NULL, NULL),
(209, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-20 16:09:41', NULL, NULL),
(210, 1, 'LOGIN', 'User logged in successfully.', '2026-08-20 16:09:54', NULL, NULL),
(211, 1, 'UPDATE_EMPLOYEE', 'Employee admin updated.', '2026-08-20 16:10:53', NULL, NULL),
(212, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-20 17:45:00', NULL, NULL),
(213, 1, 'LOGIN', 'User logged in successfully.', '2026-08-20 17:47:08', NULL, NULL),
(214, 1, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-21 09:10:04', '2026-08-21 09:10:04', NULL, NULL),
(215, 1, 'UPDATE_EMPLOYEE', 'Employee admin updated.', '2026-08-21 09:41:16', NULL, NULL),
(216, NULL, 'CREATE_EMPLOYEE', 'Employee admin1 created.', '2026-08-21 09:51:31', NULL, NULL),
(217, NULL, 'UPDATE_EMPLOYEE', 'Employee admin1 updated.', '2026-08-21 09:51:46', NULL, NULL),
(218, 1, 'UPDATE_EMPLOYEE', 'Employee admin updated.', '2026-08-21 09:54:18', NULL, NULL),
(219, 1, 'UPDATE_PROFILE', 'User admin updated their profile.', '2026-08-21 10:16:22', NULL, NULL),
(220, 1, 'UPDATE_EMPLOYEE', 'Employee admin updated.', '2026-08-21 10:22:29', NULL, NULL),
(221, 1, 'UPDATE_EMPLOYEE', 'Employee admin updated.', '2026-08-21 10:31:29', NULL, NULL),
(222, 1, 'UPDATE_EMPLOYEE', 'Employee admin updated.', '2026-08-21 10:36:53', NULL, NULL),
(223, NULL, 'UPDATE_EMPLOYEE', 'Employee admin1 updated.', '2026-08-21 10:37:38', NULL, NULL),
(224, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-21 10:51:45', NULL, NULL),
(225, 1, 'LOGIN', 'User logged in successfully.', '2026-08-21 10:55:08', NULL, NULL),
(226, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-21 10:57:32', NULL, NULL),
(227, 1, 'LOGIN', 'User logged in successfully.', '2026-08-21 11:35:24', NULL, NULL),
(228, NULL, 'UPLOAD_GOV_ID', 'Uploaded a new Driver\'s License', '2026-08-21 11:35:50', NULL, NULL),
(229, NULL, 'UPLOAD_GOV_ID', 'Uploaded a new Driver License', '2026-08-21 11:40:51', NULL, NULL),
(230, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-21 11:41:36', NULL, NULL),
(231, 1, 'LOGIN', 'User logged in successfully.', '2026-08-21 11:46:17', NULL, NULL),
(232, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-21 11:57:48', NULL, NULL),
(233, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-21 11:57:51', '2026-08-21 11:57:51', NULL, NULL),
(234, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-21 11:58:11', NULL, NULL),
(235, NULL, 'DTR_CLOCK_IN', 'Clocked in at 2026-08-21 11:58:18', '2026-08-21 11:58:18', NULL, NULL),
(236, NULL, 'LOGIN', 'User logged in successfully.', '2026-08-21 12:15:27', NULL, NULL),
(237, 1, 'LOGIN', 'User logged in successfully.', '2026-08-21 12:25:11', NULL, NULL),
(238, NULL, 'UPLOAD_GOV_ID', 'Uploaded a new Driver', '2026-08-21 14:52:25', NULL, NULL),
(239, NULL, 'UPLOAD_GOV_ID', 'Uploaded a new D', '2026-08-21 14:59:56', NULL, NULL),
(240, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-21 15:51:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(241, 1, 'DTR_CLOCK_OUT', 'Employee successfully clocked out for their shift at 2026-08-21 15:51:40 (Total Hours Logged: 6.69).', '2026-08-21 15:51:40', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(242, NULL, 'LOGIN', 'User John Doe (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-24 13:24:57', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(243, NULL, 'DTR_CLOCK_IN', 'Employee successfully clocked in for their shift at 2026-08-24 09:25:01.', '2026-08-24 13:25:01', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(244, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-24 13:36:04', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(245, NULL, 'SUBMIT_LEAVE', 'Employee submitted a Vacation Leave for 2026-08-26 via Calendar.', '2026-08-24 13:58:12', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(246, NULL, 'LOGIN', 'User John Doe (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-24 14:24:52', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(247, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-24 14:58:29', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(248, 1, 'DTR_CLOCK_IN', 'Employee successfully clocked in for their shift at 2026-08-25 09:29:08.', '2026-08-25 13:29:08', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(249, NULL, 'LOGIN', 'User John Doe (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-25 13:29:28', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(250, NULL, 'DTR_CLOCK_IN', 'Employee successfully clocked in for their shift at 2026-08-25 09:29:36.', '2026-08-25 13:29:36', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(251, NULL, 'LOGIN', 'User John Doe (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-25 13:33:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(252, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-25 13:47:16', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(253, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-25 14:02:13', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(256, NULL, 'LOGIN', 'User John Doe (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-25 14:37:01', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(257, NULL, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-08-26.', '2026-08-25 14:37:44', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(258, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-25 14:37:57', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(259, 1, 'UPDATE_REQUEST', 'Administrator updated the status of the calendar request (Event ID: 40) to: approved.', '2026-08-25 14:38:05', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(260, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-26 15:28:58', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(261, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-26 16:32:24', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(263, NULL, 'LOGIN', 'User John Doe (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-26 16:38:09', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(264, NULL, 'DTR_CLOCK_IN', 'Employee successfully clocked in for their shift at 2026-08-26 12:38:12.', '2026-08-26 16:38:12', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(265, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-26 16:54:13', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(266, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-08-27 10:32:49.', '2026-08-27 14:32:49', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(267, 1, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-08-27 10:45:33 (Total Hours Logged: 0.21).', '2026-08-27 14:45:33', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(268, NULL, 'LOGIN', 'User John Doe (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-27 15:23:40', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(269, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-08-27 11:23:43.', '2026-08-27 15:23:43', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(270, NULL, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-08-27 11:32:40 (Total Hours Logged: 0.15).', '2026-08-27 15:32:40', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(271, NULL, 'DTR_PM_IN', 'Employee logged PM IN at 2026-08-27 11:32:42 (Total Hours Logged: 0.15).', '2026-08-27 15:32:42', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(272, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-27 15:50:50', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(273, 1, 'DTR_PM_IN', 'Employee logged PM IN at 2026-08-27 11:50:59 (Total Hours Logged: 0.21).', '2026-08-27 15:50:59', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(274, 1, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-08-27 11:51:12 (Total Hours Logged: 0.22).', '2026-08-27 15:51:12', '::1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(275, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-08-27 12:09:25.', '2026-08-27 16:09:25', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(276, 1, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-08-27 12:09:34 (Total Hours Logged: 0).', '2026-08-27 16:09:34', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(277, 1, 'DTR_PM_IN', 'Employee logged PM IN at 2026-08-27 12:09:37 (Total Hours Logged: 0).', '2026-08-27 16:09:37', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(278, NULL, 'LOGIN', 'User John Doe (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-27 16:18:05', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(279, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-27 16:18:24', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(280, NULL, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Employee 2 (Username: johndoe1, Role: user).', '2026-08-27 16:18:48', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(281, NULL, 'LOGIN', 'User Employee 2 (Username: johndoe1, Role: user) successfully logged into the system.', '2026-08-27 16:38:27', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(282, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-08-27 12:38:30.', '2026-08-27 16:38:30', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(283, NULL, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-08-27 12:38:38 (Total Hours Logged: 0).', '2026-08-27 16:38:38', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(284, NULL, 'DTR_PM_IN', 'Employee logged PM IN at 2026-08-27 12:43:44 (Total Hours Logged: 0).', '2026-08-27 16:43:44', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(285, NULL, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-08-27 12:43:49 (Total Hours Logged: 0).', '2026-08-27 16:43:49', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(286, 1, 'LOGIN', 'User Admin1 (Username: admin, Role: admin) successfully logged into the system.', '2026-08-27 16:46:20', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(287, NULL, 'LOGIN', 'User John Doe (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-27 18:00:17', '156.146.36.203', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(288, 1, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-08-27 17:28:09 (Total Hours Logged: 5.31).', '2026-08-27 21:28:09', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(291, 1, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Administrator (Username: admin, Role: admin).', '2026-08-28 13:20:57', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(292, NULL, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Employee (Username: johndoe, Role: user).', '2026-08-28 13:21:07', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(293, NULL, 'UPLOAD_GOV_ID', 'Employee successfully uploaded a new government ID document (Test ID - Number: 0909-239023).', '2026-08-28 13:24:33', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(294, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-28 15:24:11', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(295, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-28 15:57:31', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(296, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-08-28 11:58:04.', '2026-08-28 15:58:04', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(297, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-08-28 16:34:13', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(298, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-08-28 12:34:27.', '2026-08-28 16:34:27', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(299, 1, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-08-28 12:34:44 (Total Hours Logged: 0).', '2026-08-28 16:34:44', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(300, 1, 'DTR_PM_IN', 'Employee logged PM IN at 2026-08-28 12:34:53 (Total Hours Logged: 0).', '2026-08-28 16:34:53', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(301, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-28 16:36:29', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(302, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-28 16:49:00', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(303, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-28 19:27:41', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(304, NULL, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-08-28 17:21:22 (Total Hours Logged: 5.39).', '2026-08-28 21:21:22', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(305, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-08-28 21:22:35', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(307, 1, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-08-28 17:30:16 (Total Hours Logged: 4.93).', '2026-08-28 21:30:16', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(308, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-08-28 21:30:22', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(309, NULL, 'CREATE_EMPLOYEE', 'Administrator created a new employee record for Employee 2 (Username: johndoe1, Role: user).', '2026-08-28 21:35:21', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(310, NULL, 'LOGIN', 'User Employee 2 (Username: johndoe1, Role: user) successfully logged into the system.', '2026-08-28 21:35:42', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(311, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-08-28 17:36:19.', '2026-08-28 21:36:19', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(312, NULL, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-08-28 17:36:20 (Total Hours Logged: 0).', '2026-08-28 21:36:20', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(313, NULL, 'DTR_PM_IN', 'Employee logged PM IN at 2026-08-28 17:36:22 (Total Hours Logged: 0).', '2026-08-28 21:36:22', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(314, NULL, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-08-28 17:36:25 (Total Hours Logged: 0).', '2026-08-28 21:36:25', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(315, NULL, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-08-29.', '2026-08-28 21:36:35', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(316, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-08-28 21:37:11', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(318, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-08-31 12:50:52', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(319, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-08-31 08:51:07.', '2026-08-31 12:51:07', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(320, 1, 'DTR_EDIT_RECORD', 'Admin edited attendance record for user ID  on date .', '2026-08-31 19:05:53', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(321, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-08-31 19:06:45', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(322, NULL, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-01.', '2026-08-31 19:07:48', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(323, NULL, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-08-31.', '2026-08-31 19:07:48', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(324, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-08-31 19:08:33', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(325, 1, 'UPDATE_REQUEST', 'Administrator updated the status of the calendar request (Event ID: 43) to: approved.', '2026-08-31 19:08:39', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(326, 1, 'UPDATE_REQUEST', 'Administrator updated the status of the calendar request (Event ID: 42) to: approved.', '2026-08-31 19:08:39', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(327, NULL, 'SUBMIT_LEAVE', 'Employee submitted a Leave for 2026-09-02 via Calendar.', '2026-08-31 19:11:19', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36'),
(328, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-01 10:18:27.', '2026-09-01 14:18:27', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(329, 1, 'SUBMIT_LEAVE', 'Employee submitted a Leave for 2026-09-28 via Calendar.', '2026-09-01 14:19:51', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(330, 1, 'SUBMIT_LEAVE', 'Employee submitted a Leave for 2026-09-29 via Calendar.', '2026-09-01 14:19:51', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(333, 1, 'DOWNLOAD_LEAVE_TRACKER', 'Admin downloaded Leave Tracker CSV (leave_requests.csv).', '2026-09-01 14:20:13', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(334, 1, 'DOWNLOAD_LEAVE_SUMMARY', 'Admin downloaded Leave Summary PDF for 2026.', '2026-09-01 14:20:15', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(335, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-01 21:27:50', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(336, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-01 21:28:56', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(337, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-01 17:30:13.', '2026-09-01 21:30:13', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(338, NULL, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-01 17:34:11 (Total Hours Logged: 0.07).', '2026-09-01 21:34:11', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(339, NULL, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-09-01 17:36:04 (Total Hours Logged: 0.07).', '2026-09-01 21:36:04', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(340, NULL, 'DTR_PM_IN', 'Employee logged PM IN at 2026-09-01 17:36:06 (Total Hours Logged: 0.1).', '2026-09-01 21:36:06', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(341, NULL, 'SUBMIT_LEAVE', 'Employee submitted a Leave for 2027-01-01 via Calendar.', '2026-09-01 21:41:27', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(342, NULL, 'SUBMIT_LEAVE', 'Employee submitted a Leave for 2027-01-02 via Calendar.', '2026-09-01 21:41:28', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(343, NULL, 'SUBMIT_LEAVE', 'Employee submitted a Leave for 2027-01-03 via Calendar.', '2026-09-01 21:41:28', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(344, NULL, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-12-23.', '2026-09-01 21:46:29', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(345, NULL, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-12-24.', '2026-09-01 21:46:29', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(346, 1, 'UPDATE_REQUEST', 'Administrator updated the status of the calendar request (Event ID: 44) to: approved.', '2026-09-01 21:47:03', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(347, 1, 'UPDATE_REQUEST', 'Administrator updated the status of the calendar request (Event ID: 45) to: approved.', '2026-09-01 21:47:03', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(351, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-01 21:54:52', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(352, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-02 08:57:25.', '2026-09-02 12:57:25', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(353, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-02 12:59:27', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(354, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-02 08:59:32.', '2026-09-02 12:59:32', '136.158.70.224', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(355, NULL, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-09-02 11:33:43 (Total Hours Logged: 2.57).', '2026-09-02 15:33:43', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(356, NULL, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-02 11:48:46 (Total Hours Logged: 2.82).', '2026-09-02 15:48:46', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(357, NULL, 'DTR_PM_IN', 'Employee logged PM IN at 2026-09-02 11:48:50 (Total Hours Logged: 2.57).', '2026-09-02 15:48:50', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(358, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-02 15:54:07', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(359, 1, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Administrator (Username: admin, Role: admin).', '2026-09-02 15:55:30', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(360, NULL, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-09-02 12:44:16 (Total Hours Logged: 3.75).', '2026-09-02 16:44:16', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(363, 1, 'DOWNLOAD_SCHEDULE_PDF', 'Admin downloaded Weekly Schedule Report PDF.', '2026-09-02 16:49:48', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(364, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-02 18:41:56', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(365, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-02 19:29:45', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(366, 1, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-02 15:31:01 (Total Hours Logged: 5.56).', '2026-09-02 19:31:01', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36');
INSERT INTO `system_logs` (`id`, `user_id`, `action`, `description`, `created_at`, `ip_address`, `user_agent`) VALUES
(367, 1, 'DTR_PM_IN', 'Employee logged PM IN at 2026-09-02 15:31:12 (Total Hours Logged: 5.56).', '2026-09-02 19:31:12', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(368, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-02 17:17:01.', '2026-09-02 21:17:01', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(369, 1, 'DTR_DELETE_RECORD', 'Admin deleted attendance record for user ID 1.', '2026-09-02 21:17:13', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(370, 1, 'DTR_DELETE_RECORD', 'Admin deleted attendance record for user ID 1.', '2026-09-02 21:17:24', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(371, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-02 17:17:33.', '2026-09-02 21:17:33', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(372, 1, 'DTR_EDIT_RECORD', 'Admin edited attendance record for user ID  on date .', '2026-09-02 21:18:05', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(373, 1, 'DTR_DELETE_RECORD', 'Admin deleted attendance record for user ID 1.', '2026-09-02 21:18:13', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(374, 1, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-09-02 17:18:23 (Total Hours Logged: 0).', '2026-09-02 21:18:23', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(375, 1, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-02 17:18:27 (Total Hours Logged: 0.02).', '2026-09-02 21:18:27', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(376, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-02 21:19:50', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(377, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-02 17:27:29.', '2026-09-02 21:27:29', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(378, NULL, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-02 17:27:37 (Total Hours Logged: 0).', '2026-09-02 21:27:37', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(379, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-02 21:29:32', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(380, NULL, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-03.', '2026-09-02 21:30:54', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(381, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-02 21:31:02', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(382, 1, 'UPDATE_REQUEST', 'Administrator updated the status of the calendar request (Event ID: 46) to: approved.', '2026-09-02 21:31:21', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(383, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-03 09:40:11.', '2026-09-03 13:40:11', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(384, 1, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-03 09:40:13 (Total Hours Logged: 0).', '2026-09-03 13:40:13', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(385, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-04 14:08:11', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(386, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-04 14:08:14', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(387, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-04 14:08:19', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(388, 1, 'DOWNLOAD_PAYROLL', 'Admin downloaded Weekly Payroll Summary Report PDF.', '2026-09-04 14:09:03', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(389, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-09 14:49:23', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(390, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-09 14:53:06', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(391, NULL, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-09.', '2026-09-09 15:43:44', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(393, NULL, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Employee (Username: johndoe, Role: user).', '2026-09-09 16:22:39', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(394, NULL, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Employee (Username: johndoe, Role: user).', '2026-09-09 16:22:44', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(395, NULL, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Employee (Username: johndoe, Role: user).', '2026-09-09 16:22:47', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(396, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-09 16:23:01', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(397, NULL, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Employee (Username: johndoe, Role: user).', '2026-09-09 16:23:14', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(398, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-09 16:45:16', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(399, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-09 12:47:33.', '2026-09-09 16:47:33', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(400, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-09 18:02:26', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(401, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-09 14:03:30.', '2026-09-09 18:03:30', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(402, 1, 'SUBMIT_LEAVE', 'Employee submitted a Leave for 2026-09-10 via Calendar.', '2026-09-09 18:07:41', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(403, NULL, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-12.', '2026-09-09 18:08:25', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(404, 1, 'DOWNLOAD_SCHEDULE_PDF', 'Admin downloaded Weekly Schedule Report PDF.', '2026-09-09 18:08:46', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(405, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-10 15:57:42', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(406, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-10 16:05:35', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(407, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-10 12:21:02.', '2026-09-10 16:21:02', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(408, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-10 18:33:18', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(409, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-10 18:59:09', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(410, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-10 20:26:27', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(411, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-10 21:38:50', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(412, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-10 17:44:38 (Total Hours Logged: 0).', '2026-09-10 21:44:38', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(413, NULL, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-10 17:44:52 (Total Hours Logged: 0).', '2026-09-10 21:44:52', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(414, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-10 17:59:33.', '2026-09-10 21:59:33', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(415, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-11 13:39:28', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(416, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-11 14:01:56', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(417, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-14 15:42:50', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(418, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-14 15:42:59', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(419, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-14 11:49:56.', '2026-09-14 15:49:56', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(420, NULL, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Employee (Username: johndoe, Role: user).', '2026-09-14 18:22:08', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(421, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-14 19:14:04', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(422, NULL, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-14 15:14:07 (Total Hours Logged: 3.4).', '2026-09-14 19:14:07', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(423, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-14 19:52:30', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(424, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-15 09:06:08.', '2026-09-15 13:06:08', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(425, 1, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-15 12:56:34 (Total Hours Logged: 3.84).', '2026-09-15 16:56:34', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(426, NULL, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Employee (Username: johndoe, Role: user).', '2026-09-15 16:57:31', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(427, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-15 16:58:12', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(428, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-15 17:01:10', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(429, NULL, 'UPLOAD_GOV_ID', 'Employee successfully uploaded a new government ID document (test - Number: 1234).', '2026-09-15 18:06:55', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(430, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-15 19:46:55', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(431, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-15 19:47:36', '119.93.124.227', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(432, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-17 13:39:50', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(433, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-17 13:40:23', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(434, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-17 13:41:00', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),
(435, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-17 14:22:18.', '2026-09-17 18:22:18', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(436, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-17 19:49:53', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(437, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-17 15:49:59.', '2026-09-17 19:49:59', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(438, 1, 'LOGIN', 'User Administrator (Username: admin, Role: admin) successfully logged into the system.', '2026-09-17 19:50:39', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(439, 1, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Administrator (Username: admin, Role: admin).', '2026-09-17 21:54:23', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(440, NULL, 'LOGIN', 'User Employee (Username: johndoe, Role: user) successfully logged into the system.', '2026-09-18 17:26:14', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(441, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-18 13:26:35.', '2026-09-18 17:26:35', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(442, NULL, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-09-18 13:27:01 (Total Hours Logged: 0).', '2026-09-18 17:27:01', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(443, NULL, 'DTR_PM_IN', 'Employee logged PM IN at 2026-09-18 13:34:39 (Total Hours Logged: 0).', '2026-09-18 17:34:39', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(444, NULL, 'CANCEL_LEAVE', 'User deleted their leave request via calendar.', '2026-09-18 17:35:54', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(445, 1, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Administrator (Username: admin, Role: admin).', '2026-09-18 18:12:46', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(446, 1, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Aly (Username: admin, Role: admin).', '2026-09-18 18:13:30', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(447, 11, 'CREATE_EMPLOYEE', 'Administrator created a new employee record for Finance (Username: finance, Role: admin).', '2026-09-18 18:14:10', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(448, NULL, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Employee 2 (Username: johndoe1, Role: user).', '2026-09-18 18:19:54', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(449, NULL, 'LOGIN', 'User Employee 2 (Username: johndoe1, Role: user) successfully logged into the system.', '2026-09-18 18:20:04', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(450, NULL, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-18 14:20:11.', '2026-09-18 18:20:11', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(451, 1, 'LOGIN', 'User Aly (Username: admin, Role: admin) successfully logged into the system.', '2026-09-18 18:23:59', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(452, 1, 'LOGIN', 'User Aly (Username: admin, Role: admin) successfully logged into the system.', '2026-09-18 18:23:59', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(453, 1, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-18.', '2026-09-18 18:28:36', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(454, 1, 'LOGIN', 'User Aly (Username: admin, Role: admin) successfully logged into the system.', '2026-09-18 18:45:07', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(455, 1, 'LOGIN', 'User Aly (Username: admin, Role: admin) successfully logged into the system.', '2026-09-18 18:45:27', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(456, 11, 'LOGIN', 'User Finance (Username: finance, Role: admin) successfully logged into the system.', '2026-09-18 18:45:38', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(457, NULL, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-18 14:46:03 (Total Hours Logged: 1.32).', '2026-09-18 18:46:03', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(458, 1, 'DOWNLOAD_PAYROLL', 'Admin downloaded Weekly Payroll Summary Report PDF.', '2026-09-18 18:48:53', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(459, 11, 'CANCEL_REQUEST', 'User cancelled and deleted their calendar request (Event ID: 49).', '2026-09-18 18:49:25', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(460, NULL, 'UPDATE_EMPLOYEE', 'Administrator updated the employee record for Employee (Username: johndoe, Role: user).', '2026-09-18 18:51:31', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(461, 1, 'DOWNLOAD_PAYROLL', 'Admin downloaded Weekly Payroll Summary Report PDF.', '2026-09-18 18:53:09', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(462, NULL, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-20.', '2026-09-18 18:57:15', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(463, 1, 'UPDATE_REQUEST', 'Administrator updated the status of the calendar request (Event ID: 50) to: approved.', '2026-09-18 18:58:03', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(464, 1, 'EDIT_SCHEDULE', 'Admin edited schedule (Event ID: 49) for Employee ID 1.', '2026-09-18 18:59:29', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(465, 11, 'CANCEL_REQUEST', 'User cancelled and deleted their calendar request (Event ID: 49).', '2026-09-18 18:59:34', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(466, 1, 'EDIT_SCHEDULE', 'Admin edited schedule (Event ID: 49) for Employee ID 1.', '2026-09-18 18:59:49', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(467, 11, 'CANCEL_REQUEST', 'User cancelled and deleted their calendar request (Event ID: 49).', '2026-09-18 18:59:59', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(468, 11, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-18 15:02:13.', '2026-09-18 19:02:13', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(469, 11, 'CANCEL_REQUEST', 'User performed soft_delete on calendar request (Event ID: 48).', '2026-09-18 19:16:58', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(470, 11, 'CANCEL_REQUEST', 'User performed restore on calendar request (Event ID: 48).', '2026-09-18 19:17:05', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(471, NULL, 'DELETE_GOV_ID', 'Employee deleted their uploaded government ID document (test).', '2026-09-18 19:23:08', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36'),
(472, 1, 'DOWNLOAD_PAYROLL', 'Admin downloaded Weekly Payroll Summary Report PDF.', '2026-09-18 20:25:19', '156.146.37.103', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(473, 11, 'LOGIN', 'User Finance (Username: finance, Role: admin) successfully logged into the system.', '2026-09-21 13:31:04', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(474, 1, 'LOGIN', 'User Aly (Username: admin, Role: admin) successfully logged into the system.', '2026-09-21 13:31:53', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(475, 1, 'CANCEL_REQUEST', 'User performed cancel on calendar request (Event ID: 32).', '2026-09-21 13:34:56', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(476, 1, 'CANCEL_REQUEST', 'User performed permanent_delete on calendar request (Event ID: 49).', '2026-09-21 18:42:42', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(477, 1, 'CANCEL_REQUEST', 'User performed cancel on calendar request (Event ID: 50).', '2026-09-21 18:44:01', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(478, 1, 'CANCEL_REQUEST', 'User performed permanent_delete on calendar request (Event ID: 50).', '2026-09-21 18:44:27', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(479, NULL, 'UPLOAD_GOV_ID', 'Employee successfully uploaded a new government ID document (Driub - Number: 1234124).', '2026-09-21 18:45:47', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(482, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-21 14:49:54.', '2026-09-21 18:49:54', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(483, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-21 14:51:14.', '2026-09-21 18:51:14', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(484, 11, 'LOGIN', 'User Finance (Username: finance, Role: admin) successfully logged into the system.', '2026-09-21 18:52:31', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(485, 11, 'LOGIN', 'User Finance (Username: finance, Role: admin) successfully logged into the system.', '2026-09-21 18:54:38', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(486, 11, 'DOWNLOAD_PAYROLL', 'Admin downloaded Monthly Payroll Summary Report.pdf.', '2026-09-21 18:54:46', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(487, 11, 'DOWNLOAD_PAYROLL', 'Admin downloaded Weekly Payroll Summary Report PDF.', '2026-09-21 18:54:54', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(488, 11, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-21 14:55:02.', '2026-09-21 18:55:02', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(489, 11, 'DELETE_LEAVE', 'User performed soft_delete on leave via calendar.', '2026-09-21 18:55:37', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(490, 11, 'DELETE_LEAVE', 'User performed restore on leave via calendar.', '2026-09-21 18:55:43', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(491, 11, 'DELETE_LEAVE', 'User performed soft_delete on leave via calendar.', '2026-09-21 18:55:49', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(492, 11, 'DELETE_LEAVE', 'User performed restore on leave via calendar.', '2026-09-21 18:55:59', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(493, 11, 'LOGIN', 'User Finance (Username: finance, Role: admin) successfully logged into the system.', '2026-09-21 20:45:11', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(494, 11, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-21 16:45:47 (Total Hours Logged: 1.85).', '2026-09-21 20:45:47', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(495, 11, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-22.', '2026-09-21 20:57:34', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(496, 11, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-23.', '2026-09-21 20:57:34', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(497, 11, 'DTR_DELETE_RECORD', 'Admin deleted attendance record for user ID 1.', '2026-09-21 21:01:29', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(498, 11, 'DTR_ADD_RECORD', 'Admin added attendance record for user ID 1 on date 2026-09-17.', '2026-09-21 21:01:41', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(499, 11, 'DTR_DELETE_RECORD', 'Admin deleted attendance record for user ID 1.', '2026-09-21 21:01:46', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(500, 11, 'DTR_ADD_RECORD', 'Admin added attendance record for user ID 1 on date 2026-09-17.', '2026-09-21 21:01:52', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(501, 11, 'DTR_DELETE_RECORD', 'Admin deleted attendance record for user ID 1.', '2026-09-21 21:01:57', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(502, 11, 'LOGIN', 'User Finance (Username: finance, Role: admin) successfully logged into the system.', '2026-09-22 13:41:38', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(503, 1, 'LOGIN', 'User Aly (Username: admin, Role: admin) successfully logged into the system.', '2026-09-22 13:42:36', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),
(504, 11, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-22 09:45:52.', '2026-09-22 13:45:52', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(505, 11, 'DOWNLOAD_PAYROLL', 'Admin downloaded Monthly Payroll Summary Report.pdf.', '2026-09-22 13:47:00', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(506, 11, 'DOWNLOAD_PAYROLL', 'Admin downloaded Weekly Payroll Summary Report PDF.', '2026-09-22 13:47:44', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(507, 11, 'DOWNLOAD_PAYROLL', 'Admin downloaded Weekly Payroll Summary Report PDF.', '2026-09-22 13:48:40', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(508, 11, 'DOWNLOAD_PAYROLL', 'Admin downloaded Weekly Payroll Summary Report PDF.', '2026-09-22 13:49:03', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(509, 11, 'DOWNLOAD_SCHEDULE_PDF', 'Admin downloaded Weekly Schedule Report PDF.', '2026-09-22 13:51:39', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(510, 1, 'LOGIN', 'User Aly (Username: admin, Role: admin) successfully logged into the system.', '2026-09-22 13:56:13', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(511, 11, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-24.', '2026-09-22 14:00:31', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(512, 11, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-25.', '2026-09-22 14:00:31', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(513, 11, 'ASSIGN_SCHEDULE', 'Administrator successfully assigned a new WS schedule for the date 2026-09-29.', '2026-09-22 14:01:15', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(514, 11, 'DOWNLOAD_SCHEDULE_PDF', 'Admin downloaded Weekly Schedule Report PDF.', '2026-09-22 14:03:29', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(515, 11, 'DOWNLOAD_SCHEDULE_PDF', 'Admin downloaded Weekly Schedule Report PDF.', '2026-09-22 14:03:41', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(516, 11, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-26.', '2026-09-22 14:04:18', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(517, 11, 'SUBMIT_REQUEST', 'Employee successfully submitted a new request for WS on the date 2026-09-27.', '2026-09-22 14:04:18', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(518, 11, 'DOWNLOAD_SCHEDULE_PDF', 'Admin downloaded Weekly Schedule Report PDF.', '2026-09-22 14:04:25', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(519, 11, 'CANCEL_REQUEST', 'User performed cancel on calendar request (Event ID: 6).', '2026-09-22 14:04:47', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(520, 11, 'DOWNLOAD_SCHEDULE_PDF', 'Admin downloaded Weekly Schedule Report PDF.', '2026-09-22 14:04:53', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(521, 11, 'CANCEL_REQUEST', 'User performed permanent_delete on calendar request (Event ID: 6).', '2026-09-22 14:05:11', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(522, 11, 'DOWNLOAD_SCHEDULE_PDF', 'Admin downloaded Weekly Schedule Report PDF.', '2026-09-22 14:05:14', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36'),
(523, 11, 'LOGIN', 'User Finance (Username: finance, Role: admin) successfully logged into the system.', '2026-09-22 14:05:56', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),
(524, 1, 'ASSIGN_LEAVE', 'Administrator assigned a Leave for 2026-09-22.', '2026-09-22 14:06:54', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36'),
(525, 11, 'DTR_PM_IN', 'Employee logged PM IN at 2026-09-22 10:06:57 (Total Hours Logged: 0).', '2026-09-22 14:06:57', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),
(526, 11, 'DTR_AM_OUT', 'Employee logged AM OUT at 2026-09-22 10:07:01 (Total Hours Logged: 0).', '2026-09-22 14:07:01', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),
(527, 11, 'DTR_PM_OUT', 'Employee logged PM OUT at 2026-09-22 10:07:20 (Total Hours Logged: 0.36).', '2026-09-22 14:07:20', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),
(528, 11, 'DTR_EDIT_RECORD', 'Admin edited attendance record for user ID  on date .', '2026-09-22 14:07:42', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),
(529, 11, 'DOWNLOAD_PAYROLL', 'Admin downloaded Weekly Payroll Summary Report PDF.', '2026-09-22 14:09:03', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0'),
(530, 1, 'DTR_AM_IN', 'Employee logged AM IN at 2026-09-22 10:22:41.', '2026-09-22 14:22:41', '136.158.70.152', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','user') DEFAULT 'user',
  `full_name` varchar(100) NOT NULL,
  `hourly_rate` decimal(10,2) DEFAULT 0.00,
  `profile_picture` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `id_number` varchar(100) DEFAULT NULL,
  `sex` enum('Male','Female','Other') DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `leave_credits` int(11) NOT NULL DEFAULT 0,
  `last_active` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `role`, `full_name`, `hourly_rate`, `profile_picture`, `created_at`, `email`, `phone`, `address`, `id_number`, `sex`, `is_active`, `leave_credits`, `last_active`) VALUES
(1, 'admin', '$2y$10$xec/ZbRuSunXeRb1hHRH8.7D4bOnu.uktzxFOysNWE2iQxalHOuwa', 'admin', 'Aly', 0.00, 'img/profiles/6a88588a9caf3.jpg', '2026-08-13 14:46:27', 'aly@corerxreturns.com', '', '', '', 'Female', 1, 0, '2026-09-22 15:40:53'),
(11, 'finance', '$2y$10$SUs1xuY1kS8VsrOeWWCN3uqAeEjdKFhpWHzmYZaOlSqtK2KwcImqi', 'admin', 'Finance', 0.00, NULL, '2026-09-18 18:14:10', 'finance@corerxreturns.com', '', '', '', 'Other', 1, 0, '2026-09-22 14:29:26');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_date_unique` (`user_id`,`date`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `government_ids`
--
ALTER TABLE `government_ids`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `holidays`
--
ALTER TABLE `holidays`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_holiday` (`name`,`year`);

--
-- Indexes for table `leave_balances`
--
ALTER TABLE `leave_balances`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_leave_year` (`user_id`,`leave_type`,`year`);

--
-- Indexes for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `government_ids`
--
ALTER TABLE `government_ids`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `holidays`
--
ALTER TABLE `holidays`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100;

--
-- AUTO_INCREMENT for table `leave_balances`
--
ALTER TABLE `leave_balances`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `leave_requests`
--
ALTER TABLE `leave_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=528;

--
-- AUTO_INCREMENT for table `system_logs`
--
ALTER TABLE `system_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=531;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `government_ids`
--
ALTER TABLE `government_ids`
  ADD CONSTRAINT `government_ids_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leave_balances`
--
ALTER TABLE `leave_balances`
  ADD CONSTRAINT `leave_balances_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leave_requests`
--
ALTER TABLE `leave_requests`
  ADD CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD CONSTRAINT `system_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
