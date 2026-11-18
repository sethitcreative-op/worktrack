<?php
date_default_timezone_set('America/New_York');
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/logger.php';

// Self-healing schema helper: auto-migrates missing tables and columns on the fly
if (!function_exists('ensureGlobalSchema')) {
    function ensureGlobalSchema($conn) {
        static $done = false;
        if ($done) return;
        try {
            $conn->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS ot_rate DECIMAL(10,2) DEFAULT 0.00");
        } catch (Throwable $e) {
            try { $conn->exec("ALTER TABLE users ADD COLUMN ot_rate DECIMAL(10,2) DEFAULT 0.00"); } catch (Throwable $e2) {}
        }
        try {
            $conn->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_rate DECIMAL(10,2) DEFAULT 0.00");
        } catch (Throwable $e) {
            try { $conn->exec("ALTER TABLE users ADD COLUMN weekly_rate DECIMAL(10,2) DEFAULT 0.00"); } catch (Throwable $e2) {}
        }
        try {
            $conn->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_type VARCHAR(20) DEFAULT 'Timed'");
        } catch (Throwable $e) {
            try { $conn->exec("ALTER TABLE users ADD COLUMN employee_type VARCHAR(20) DEFAULT 'Timed'"); } catch (Throwable $e2) {}
        }
        try {
            $conn->exec("ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_manual TINYINT(1) DEFAULT 0");
        } catch (Throwable $e) {
            try { $conn->exec("ALTER TABLE attendance ADD COLUMN is_manual TINYINT(1) DEFAULT 0"); } catch (Throwable $e2) {}
        }
        try {
            $conn->exec("
                CREATE TABLE IF NOT EXISTS employee_overtime (
                    id INT(11) NOT NULL AUTO_INCREMENT,
                    user_id INT(11) NOT NULL,
                    period_type ENUM('day', 'week', 'month') NOT NULL,
                    period_value VARCHAR(50) NOT NULL,
                    ot_amount DECIMAL(10,2) DEFAULT 0.00,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (id),
                    UNIQUE KEY uq_user_period (user_id, period_type, period_value)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
            ");
        } catch (Throwable $e) {}
        $done = true;
    }
}

if (!function_exists('tableHasColumn')) {
    function tableHasColumn($conn, $table, $column) {
        try {
            $stmt = $conn->query("SHOW COLUMNS FROM `{$table}` LIKE '{$column}'");
            return $stmt && $stmt->rowCount() > 0;
        } catch (Throwable $e) {
            return false;
        }
    }
}

if (!function_exists('tableExists')) {
    function tableExists($conn, $table) {
        try {
            $stmt = $conn->query("SHOW TABLES LIKE '{$table}'");
            return $stmt && $stmt->rowCount() > 0;
        } catch (Throwable $e) {
            return false;
        }
    }
}

ensureGlobalSchema($conn);

$data = json_decode(file_get_contents("php://input"));
$action = isset($_GET['action']) ? $_GET['action'] : (isset($data->action) ? $data->action : '');

if (!function_exists('calculateTotalHours')) {
    function calculateTotalHours($am_in, $am_out, $pm_in, $pm_out) {
        $total_hours = 0;
        $t_am_in = ($am_in && strpos($am_in, '1900-01-01') === false) ? strtotime($am_in) : null;
        $t_am_out = ($am_out && strpos($am_out, '1900-01-01') === false) ? strtotime($am_out) : null;
        $t_pm_in = ($pm_in && strpos($pm_in, '1900-01-01') === false) ? strtotime($pm_in) : null;
        $t_pm_out = ($pm_out && strpos($pm_out, '1900-01-01') === false) ? strtotime($pm_out) : null;

        if ($t_am_in && $t_pm_out) {
            // Calculate gross hours from AM IN to PM OUT
            $gross_hours = max(0, $t_pm_out - $t_am_in) / 3600;
            $deduction_hours = 0;
            
            if ($t_am_out && $t_pm_in) {
                // Employee punched for lunch (or auto-calculated)
                // deduction = max(30 mins, duration of lunch break)
                $lunch_duration_hours = max(0, $t_pm_in - $t_am_out) / 3600;
                $deduction_hours = max(0.5, $lunch_duration_hours);
            } else {
                // No punch for lunch - default to 30 mins break deduction if work > 5 hours
                if ($gross_hours > 5) {
                    $deduction_hours = 0.5;
                }
            }
            
            $total_hours = max(0, $gross_hours - $deduction_hours);
        }
        return round($total_hours, 2);
    }
}

try {
    if (in_array($action, ['am_in', 'am_out', 'pm_in', 'pm_out', 'fixed_in'])) {
        $user_id = $data->user_id;
        
        // Use server's reliable time to prevent time theft
        $server_time = date('H:i:s');
        $server_date = date('Y-m-d');
        $server_datetime = $server_date . ' ' . $server_time;
        
        // Fetch the existing record for the user for the current server date
        $record = null;
        try {
            $fetch_query = "SELECT a.*, u.hourly_rate, u.weekly_rate, u.ot_rate, u.employee_type FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.user_id = :user_id AND a.date = :server_date ORDER BY a.id DESC LIMIT 1";
            $fetch_stmt = $conn->prepare($fetch_query);
            $fetch_stmt->execute([':user_id' => $user_id, ':server_date' => $server_date]);
            $record = $fetch_stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            $fetch_query = "SELECT a.*, u.hourly_rate FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.user_id = :user_id AND a.date = :server_date ORDER BY a.id DESC LIMIT 1";
            $fetch_stmt = $conn->prepare($fetch_query);
            $fetch_stmt->execute([':user_id' => $user_id, ':server_date' => $server_date]);
            $record = $fetch_stmt->fetch(PDO::FETCH_ASSOC);
            if ($record) {
                $record['weekly_rate'] = $record['weekly_rate'] ?? '0.00';
                $record['ot_rate'] = $record['ot_rate'] ?? '0.00';
                $record['employee_type'] = $record['employee_type'] ?? 'Timed';
            }
        }
        
        $action_name = strtoupper(str_replace('_', ' ', $action));
        
        if (!$record) {
            $user_data = null;
            try {
                $fetch_user = "SELECT hourly_rate, weekly_rate, ot_rate, employee_type FROM users WHERE id = :user_id";
                $stmt_user = $conn->prepare($fetch_user);
                $stmt_user->execute([':user_id' => $user_id]);
                $user_data = $stmt_user->fetch(PDO::FETCH_ASSOC);
            } catch (Throwable $e) {
                $fetch_user = "SELECT hourly_rate FROM users WHERE id = :user_id";
                $stmt_user = $conn->prepare($fetch_user);
                $stmt_user->execute([':user_id' => $user_id]);
                $user_data = $stmt_user->fetch(PDO::FETCH_ASSOC);
                if ($user_data) {
                    $user_data['weekly_rate'] = '0.00';
                    $user_data['ot_rate'] = '0.00';
                    $user_data['employee_type'] = 'Timed';
                }
            }
            $empType = $user_data['employee_type'] ?? 'Timed';
            $rate = $user_data ? ($empType === 'Fixed' ? floatval($user_data['weekly_rate'] ?? 0) : floatval($user_data['hourly_rate'] ?? 0)) : 0;
            
            $total_hours = ($action === 'fixed_in') ? 10 : 0;
            $earnings = ($user_data && $empType === 'Fixed') ? floatval($rate) : round($total_hours * floatval($rate), 2);
            
            $target_action = ($action === 'fixed_in') ? 'am_in' : $action;
            
            $query = "INSERT INTO attendance (user_id, date, {$target_action}, status, total_hours, earnings) VALUES (:user_id, :server_date, :server_datetime, 'Present', :total_hours, :earnings)";
            $stmt = $conn->prepare($query);
            $stmt->execute([
                ':user_id' => $user_id, 
                ':server_date' => $server_date, 
                ':server_datetime' => $server_datetime,
                ':total_hours' => $total_hours,
                ':earnings' => $earnings
            ]);
            logAction($conn, $user_id, "DTR_".strtoupper($action), "Employee logged {$action_name} at {$server_datetime}.");
            echo json_encode(["status" => "success", "message" => "{$action_name} logged successfully"]);
        } else {
            if ($action === 'fixed_in') {
                // Already has a record, ignore or update
                echo json_encode(["status" => "success", "message" => "Already marked present"]);
                exit;
            }
            $am_in = $action === 'am_in' ? $server_datetime : $record['am_in'];
            $am_out = $action === 'am_out' ? $server_datetime : $record['am_out'];
            $pm_in = $action === 'pm_in' ? $server_datetime : $record['pm_in'];
            $pm_out = $action === 'pm_out' ? $server_datetime : $record['pm_out'];
            
            // Auto-fill lunch break (12:30 PM AM OUT, 1:00 PM PM IN) ONLY if employee did not select/punch it
            $recordEmpType = $record['employee_type'] ?? 'Timed';
            if ($recordEmpType !== 'Fixed') {
                $has_am_out = !empty($am_out) && strpos($am_out, '1900-01-01') === false && $am_out >= '2000-01-01';
                $has_pm_in  = !empty($pm_in)  && strpos($pm_in, '1900-01-01') === false && $pm_in >= '2000-01-01';

                // If the employee selected/punched either AM OUT or PM IN, do NOT trigger auto-punch
                // Only auto-fill if BOTH were unselected/unpunched, shift started before 12:00 PM, and employee is clocking PM OUT at/after 1:00 PM
                if ($action === 'pm_out' && !$has_am_out && !$has_pm_in) {
                    if (!empty($am_in) && date('H:i:s', strtotime($am_in)) < '12:00:00' && date('H:i:s') >= '13:00:00') {
                        $am_out = $record['date'] . ' 12:30:00';
                        $pm_in  = $record['date'] . ' 13:00:00';
                    }
                }
            }
            
            if (!$pm_out || strpos($pm_out, '1900-01-01') !== false) {
                // User requested not to calculate total hours until PM OUT is tagged
                $total_hours = 0;
            } else {
                $total_hours = calculateTotalHours($am_in, $am_out, $pm_in, $pm_out);
            }
            
            // Always resolve rate and overtime
            if ($recordEmpType === 'Fixed') {
                $rate = floatval($record['weekly_rate'] ?? 0);
                $ot_rate = floatval($record['ot_rate'] ?? 0);
                $ot_hours = max(0, $total_hours - 10);
                $earnings = $rate + round($ot_hours * $ot_rate, 2);
            } else {
                $hourly_rate = floatval($record['hourly_rate'] ?? 0);
                $ot_rate = floatval($record['ot_rate'] ?? 0);
                if ($total_hours > 8) {
                    $reg_hours = 8;
                    $ot_hours = $total_hours - 8;
                    $effective_ot_rate = $ot_rate > 0 ? $ot_rate : $hourly_rate;
                    $earnings = round(($reg_hours * $hourly_rate) + ($ot_hours * $effective_ot_rate), 2);
                } else {
                    $earnings = round($total_hours * $hourly_rate, 2);
                }
            }
            
            $query = "UPDATE attendance SET am_in = :am_in, am_out = :am_out, pm_in = :pm_in, pm_out = :pm_out, total_hours = :total_hours, earnings = :earnings WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->execute([
                ':am_in' => $am_in,
                ':am_out' => $am_out,
                ':pm_in' => $pm_in,
                ':pm_out' => $pm_out,
                ':total_hours' => $total_hours,
                ':earnings' => $earnings,
                ':id' => $record['id']
            ]);
            logAction($conn, $user_id, "DTR_".strtoupper($action), "Employee logged {$action_name} at {$server_datetime} (Total Hours Logged: {$total_hours}).");
            echo json_encode(["status" => "success", "message" => "{$action_name} logged successfully"]);
        }
    } elseif ($action === 'get_records') {
        $server_date = date('Y-m-d');
        $yesterday   = date('Y-m-d', strtotime('-1 day'));

        $has_manual = tableHasColumn($conn, 'attendance', 'is_manual');
        $has_emp_type = tableHasColumn($conn, 'users', 'employee_type');

        // ── 1. Auto-close past open shifts ──
        try {
            $manual_clause = $has_manual ? "AND (a.is_manual IS NULL OR a.is_manual = 0)" : "";
            $type_clause = $has_emp_type ? "AND u.employee_type != 'Fixed'" : "";

            $auto_close_query = "
                UPDATE attendance a
                JOIN users u ON a.user_id = u.id
                SET a.total_hours = ROUND(
                        (
                        CASE 
                            WHEN a.am_in > '2000-01-01' AND a.pm_out > '2000-01-01' THEN 
                                GREATEST(0, (TIMESTAMPDIFF(SECOND, a.am_in, a.pm_out) / 3600) - 
                                    CASE 
                                        WHEN a.am_out > '2000-01-01' AND a.pm_in > '2000-01-01' THEN 
                                            GREATEST(0.5, TIMESTAMPDIFF(SECOND, a.am_out, a.pm_in) / 3600)
                                        ELSE 
                                            IF(TIMESTAMPDIFF(SECOND, a.am_in, a.pm_out) / 3600 > 5, 0.5, 0.0)
                                    END
                                )
                            ELSE 0
                        END
                        ), 2),
                    a.earnings = ROUND((
                        ROUND((
                            CASE 
                                WHEN a.am_in > '2000-01-01' AND a.pm_out > '2000-01-01' THEN 
                                    GREATEST(0, (TIMESTAMPDIFF(SECOND, a.am_in, a.pm_out) / 3600) - 
                                        CASE 
                                            WHEN a.am_out > '2000-01-01' AND a.pm_in > '2000-01-01' THEN 
                                                GREATEST(0.5, TIMESTAMPDIFF(SECOND, a.am_out, a.pm_in) / 3600)
                                            ELSE 
                                                IF(TIMESTAMPDIFF(SECOND, a.am_in, a.pm_out) / 3600 > 5, 0.5, 0.0)
                                        END
                                    )
                                ELSE 0
                            END
                        ), 2) * u.hourly_rate
                    ), 2),
                    a.status = 'Missing Timeout',
                    a.am_out = IF(a.am_in IS NOT NULL AND a.am_in > '2000-01-01' AND (a.am_out IS NULL OR a.am_out < '2000-01-01'), '1900-01-01 00:00:00', a.am_out),
                    a.pm_out = IF(a.pm_in IS NOT NULL AND a.pm_in > '2000-01-01' AND (a.pm_out IS NULL OR a.pm_out < '2000-01-01'), '1900-01-01 00:00:00', a.pm_out)
                WHERE ( (a.pm_in IS NOT NULL AND a.pm_in > '2000-01-01' AND (a.pm_out IS NULL OR a.pm_out < '2000-01-01')) 
                     OR (a.am_in IS NOT NULL AND a.am_in > '2000-01-01' AND (a.am_out IS NULL OR a.am_out < '2000-01-01') AND (a.pm_out IS NULL OR a.pm_out < '2000-01-01')) )
                  AND a.date < :server_date
                  {$manual_clause}
                  {$type_clause}
            ";
            $auto_close_stmt = $conn->prepare($auto_close_query);
            $auto_close_stmt->execute([':server_date' => $server_date]);
        } catch (Throwable $e) {}

        // ── Auto-fill lunch break for today if time reaches 1:00 PM and employee didn't punch lunch ──
        if (date('H:i:s') >= '13:00:00') {
            try {
                $manual_clause = $has_manual ? "AND (a.is_manual IS NULL OR a.is_manual = 0)" : "";
                $type_clause = $has_emp_type ? "AND u.employee_type != 'Fixed'" : "";

                $auto_lunch_stmt = $conn->prepare("
                    UPDATE attendance a
                    JOIN users u ON a.user_id = u.id
                    SET a.am_out = CONCAT(a.date, ' 12:30:00'),
                        a.pm_in  = CONCAT(a.date, ' 13:00:00')
                    WHERE a.date = :server_date
                      AND a.am_in IS NOT NULL AND a.am_in > '2000-01-01'
                      AND TIME(a.am_in) < '12:00:00'
                      AND (a.am_out IS NULL OR a.am_out < '2000-01-01' OR a.am_out LIKE '1900-01-01%')
                      AND (a.pm_in IS NULL OR a.pm_in < '2000-01-01' OR a.pm_in LIKE '1900-01-01%')
                      AND (a.pm_out IS NULL OR a.pm_out < '2000-01-01')
                      {$manual_clause}
                      {$type_clause}
                ");
                $auto_lunch_stmt->execute([':server_date' => $server_date]);
            } catch (Throwable $e) {}
        }

        // ── 2. Auto-mark Absent for ALL past days (Mon–Sun) with no clock-in ──
        try {
            $allUsersStmt = $conn->prepare("SELECT id, DATE(created_at) as joined_date FROM users");
            $allUsersStmt->execute();
            $allUsers = $allUsersStmt->fetchAll(PDO::FETCH_ASSOC);

            $has_holidays = tableExists($conn, 'holidays');
            $has_leave_requests = tableExists($conn, 'leave_requests');
            $has_events = tableExists($conn, 'events');

            if ($has_events) {
                foreach ($allUsers as $u) {
                    $uid        = $u['id'];
                    $startDate  = $u['joined_date'] ?? '2024-01-01';

                    $thirtyDaysAgo = date('Y-m-d', strtotime('-30 days'));
                    if ($startDate < $thirtyDaysAgo) {
                        $startDate = $thirtyDaysAgo;
                    }

                    try {
                        $holiday_cond = $has_holidays ? "AND NOT EXISTS (SELECT 1 FROM holidays h WHERE h.holiday_date = d.date_val)" : "";
                        $leave_cond = $has_leave_requests ? "AND NOT EXISTS (SELECT 1 FROM leave_requests lr WHERE lr.user_id = :uid3 AND lr.status = 'approved' AND d.date_val BETWEEN lr.start_date AND lr.end_date)" : "";

                        $autoAbsentQuery = "
                            INSERT INTO attendance (user_id, date, status, total_hours, earnings)
                            SELECT :uid, d.date_val, 'Absent', 0, 0
                            FROM (
                                SELECT DATE_ADD(:start, INTERVAL seq DAY) AS date_val
                                FROM (
                                    SELECT a.N + b.N * 10 + c.N * 100 AS seq
                                    FROM
                                        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                                         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) a,
                                        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                                         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) b,
                                        (SELECT 0 AS N UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                                         UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9) c
                                ) nums
                                WHERE DATE_ADD(:start2, INTERVAL seq DAY) <= :yesterday
                            ) d
                            WHERE
                                NOT EXISTS (
                                    SELECT 1 FROM attendance a2
                                    WHERE a2.user_id = :uid2 AND a2.date = d.date_val
                                )
                                {$holiday_cond}
                                {$leave_cond}
                                AND NOT EXISTS (
                                    SELECT 1 FROM events ev
                                    WHERE ev.user_id = :uid4
                                      AND ev.event_date = d.date_val
                                      AND ev.status = 'approved'
                                      AND ev.event_type IN ('VL', 'SL', 'PDO', 'Birthday', 'Meeting', 'Holiday', 'HL')
                                )
                                AND EXISTS (
                                    SELECT 1 FROM events ev_sched
                                    WHERE ev_sched.user_id = :uid6
                                      AND ev_sched.event_date = d.date_val
                                      AND ev_sched.status = 'approved'
                                      AND (ev_sched.event_type = 'WS' OR ev_sched.title = 'Work Shift')
                                )
                        ";
                        $params = [
                            ':uid'       => $uid,
                            ':uid2'      => $uid,
                            ':uid4'      => $uid,
                            ':uid6'      => $uid,
                            ':start'     => $startDate,
                            ':start2'    => $startDate,
                            ':yesterday' => $yesterday
                        ];
                        if ($has_leave_requests) {
                            $params[':uid3'] = $uid;
                        }
                        $autoAbsentStmt = $conn->prepare($autoAbsentQuery);
                        $autoAbsentStmt->execute($params);
                    } catch (Throwable $userAbsentEx) {}

                    try {
                        $update_type_clause = $has_emp_type ? "AND u.employee_type != 'Fixed'" : "";
                        $update_leave_cond = $has_leave_requests ? "AND NOT EXISTS (SELECT 1 FROM leave_requests lr WHERE lr.user_id = :uid2 AND lr.status = 'approved' AND a.date BETWEEN lr.start_date AND lr.end_date)" : "";

                        $updateAbsentQuery = "
                            UPDATE attendance a
                            JOIN users u ON a.user_id = u.id
                            SET a.status = 'Absent'
                            WHERE a.user_id = :uid
                              AND a.date < :server_date
                              AND (a.am_in IS NULL OR a.am_in < '2000-01-01')
                              AND (a.pm_in IS NULL OR a.pm_in < '2000-01-01')
                              AND a.status NOT IN ('Leave', 'Holiday', 'Rescheduled', 'Present', 'Missing Timeout')
                              {$update_type_clause}
                              {$update_leave_cond}
                              AND EXISTS (
                                  SELECT 1 FROM events ev_sched
                                  WHERE ev_sched.user_id = :uid3
                                    AND ev_sched.event_date = a.date
                                    AND ev_sched.status = 'approved'
                                    AND (ev_sched.event_type = 'WS' OR ev_sched.title = 'Work Shift')
                              )
                        ";
                        $updateParams = [
                            ':uid'         => $uid,
                            ':uid3'        => $uid,
                            ':server_date' => $server_date
                        ];
                        if ($has_leave_requests) {
                            $updateParams[':uid2'] = $uid;
                        }
                        $updateAbsentStmt = $conn->prepare($updateAbsentQuery);
                        $updateAbsentStmt->execute($updateParams);
                    } catch (Throwable $updateEx) {}
                }
            }
        } catch (Throwable $e) {}

        // Fetch attendance records
        $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
        $records = [];
        try {
            if ($user_id) {
                $query = "SELECT a.*, u.full_name, u.hourly_rate, u.weekly_rate, u.ot_rate, u.employee_type FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.user_id = :user_id ORDER BY a.date DESC";
                $stmt = $conn->prepare($query);
                $stmt->execute([':user_id' => $user_id]);
            } else {
                $query = "SELECT a.*, u.full_name, u.hourly_rate, u.weekly_rate, u.ot_rate, u.employee_type FROM attendance a JOIN users u ON a.user_id = u.id ORDER BY a.date DESC";
                $stmt = $conn->prepare($query);
                $stmt->execute();
            }
            $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            // Resilient fallback query in case any custom column is missing
            try {
                if ($user_id) {
                    $query = "SELECT a.*, u.full_name, u.hourly_rate FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.user_id = :user_id ORDER BY a.date DESC";
                    $stmt = $conn->prepare($query);
                    $stmt->execute([':user_id' => $user_id]);
                } else {
                    $query = "SELECT a.*, u.full_name, u.hourly_rate FROM attendance a JOIN users u ON a.user_id = u.id ORDER BY a.date DESC";
                    $stmt = $conn->prepare($query);
                    $stmt->execute();
                }
                $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (Throwable $e2) {
                $records = [];
            }
        }
        
        // Ensure default values for any missing columns
        foreach ($records as &$rec) {
            if (!isset($rec['ot_rate'])) $rec['ot_rate'] = '0.00';
            if (!isset($rec['weekly_rate'])) $rec['weekly_rate'] = '0.00';
            if (!isset($rec['employee_type'])) $rec['employee_type'] = 'Timed';
            if (!isset($rec['is_manual'])) $rec['is_manual'] = 0;
        }

        echo json_encode(["status" => "success", "data" => $records]);

    } elseif ($action === 'edit_record') {
        // Admin Edit Record
        $modifier_id = $data->modifier_id ?? 1;
        $record_id = $data->record_id;
        $am_in = isset($data->am_in) && $data->am_in !== '' ? $data->am_in : null;
        $am_out = isset($data->am_out) && $data->am_out !== '' ? $data->am_out : null;
        $pm_in = isset($data->pm_in) && $data->pm_in !== '' ? $data->pm_in : null;
        $pm_out = isset($data->pm_out) && $data->pm_out !== '' ? $data->pm_out : null;
        $status = isset($data->status) ? $data->status : 'Present';
        
        // Fetch user info to calculate earnings
        $record = null;
        try {
            $fetch_query = "SELECT a.user_id, a.date as record_date, u.hourly_rate, u.weekly_rate, u.ot_rate, u.employee_type FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.id = :record_id";
            $fetch_stmt = $conn->prepare($fetch_query);
            $fetch_stmt->execute([':record_id' => $record_id]);
            $record = $fetch_stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            $fetch_query = "SELECT a.user_id, a.date as record_date, u.hourly_rate FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.id = :record_id";
            $fetch_stmt = $conn->prepare($fetch_query);
            $fetch_stmt->execute([':record_id' => $record_id]);
            $record = $fetch_stmt->fetch(PDO::FETCH_ASSOC);
            if ($record) {
                $record['weekly_rate'] = '0.00';
                $record['ot_rate'] = '0.00';
                $record['employee_type'] = 'Timed';
            }
        }

        if ($record) {
            $recordEmpType = $record['employee_type'] ?? 'Timed';
            $total_hours = 0;
            $earnings = 0;
            
            if (strcasecmp($status, 'Leave') === 0) {
                $total_hours = 10;
                $rate = $recordEmpType === 'Fixed' ? floatval($record['weekly_rate'] ?? 0) : floatval($record['hourly_rate'] ?? 0);
                $earnings = $recordEmpType === 'Fixed' ? $rate : round($total_hours * $rate, 2);
            } elseif (!in_array($status, ['Absent', 'Leave', 'Holiday', 'Rescheduled'])) {
                if (isset($data->total_hours) && $data->total_hours !== '') {
                    $total_hours = floatval($data->total_hours);
                } else {
                    $total_hours = calculateTotalHours($am_in, $am_out, $pm_in, $pm_out);
                }
                if ($recordEmpType === 'Fixed' && $total_hours == 0) {
                    $total_hours = 10;
                }
                
                if ($recordEmpType === 'Fixed') {
                    $rate = floatval($record['weekly_rate'] ?? 0);
                    $ot_rate = floatval($record['ot_rate'] ?? 0);
                    $ot_hours = max(0, $total_hours - 10);
                    $earnings = $rate + round($ot_hours * $ot_rate, 2);
                } else {
                    $hourly_rate = floatval($record['hourly_rate'] ?? 0);
                    $ot_rate = floatval($record['ot_rate'] ?? 0);
                    if ($total_hours > 8) {
                        $reg_hours = 8;
                        $ot_hours = $total_hours - 8;
                        $effective_ot_rate = $ot_rate > 0 ? $ot_rate : $hourly_rate;
                        $earnings = round(($reg_hours * $hourly_rate) + ($ot_hours * $effective_ot_rate), 2);
                    } else {
                        $earnings = round($total_hours * $hourly_rate, 2);
                    }
                }
            }

            $has_manual = tableHasColumn($conn, 'attendance', 'is_manual');
            if ($has_manual) {
                $query = "UPDATE attendance SET am_in = :am_in, am_out = :am_out, pm_in = :pm_in, pm_out = :pm_out, total_hours = :total_hours, earnings = :earnings, status = :status, is_manual = 1 WHERE id = :record_id";
            } else {
                $query = "UPDATE attendance SET am_in = :am_in, am_out = :am_out, pm_in = :pm_in, pm_out = :pm_out, total_hours = :total_hours, earnings = :earnings, status = :status WHERE id = :record_id";
            }
            $stmt = $conn->prepare($query);
            $stmt->execute([
                ':am_in' => $am_in,
                ':am_out' => $am_out,
                ':pm_in' => $pm_in,
                ':pm_out' => $pm_out,
                ':total_hours' => $total_hours,
                ':earnings' => $earnings,
                ':status' => $status,
                ':record_id' => $record_id
            ]);
            
            $rec_user_id = $record['user_id'];
            $rec_date = $record['record_date'];
            logAction($conn, $modifier_id ?? 1, 'DTR_EDIT_RECORD', "Admin edited attendance record for user ID {$rec_user_id} on date {$rec_date}.");

            echo json_encode(["status" => "success", "message" => "Record updated successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Record not found"]);
        }
    } elseif ($action === 'add_record') {
        // Admin Add Record
        $modifier_id = $data->modifier_id ?? 1;
        $user_id = $data->user_id;
        $date = $data->date;
        $am_in = isset($data->am_in) && $data->am_in !== '' ? $data->am_in : null;
        $am_out = isset($data->am_out) && $data->am_out !== '' ? $data->am_out : null;
        $pm_in = isset($data->pm_in) && $data->pm_in !== '' ? $data->pm_in : null;
        $pm_out = isset($data->pm_out) && $data->pm_out !== '' ? $data->pm_out : null;
        $status = isset($data->status) ? $data->status : 'Present';
        
        $user = null;
        try {
            $fetch_user = "SELECT hourly_rate, weekly_rate, ot_rate, employee_type FROM users WHERE id = :user_id";
            $fetch_stmt = $conn->prepare($fetch_user);
            $fetch_stmt->execute([':user_id' => $user_id]);
            $user = $fetch_stmt->fetch(PDO::FETCH_ASSOC);
        } catch (Throwable $e) {
            $fetch_user = "SELECT hourly_rate FROM users WHERE id = :user_id";
            $fetch_stmt = $conn->prepare($fetch_user);
            $fetch_stmt->execute([':user_id' => $user_id]);
            $user = $fetch_stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $user['weekly_rate'] = '0.00';
                $user['ot_rate'] = '0.00';
                $user['employee_type'] = 'Timed';
            }
        }

        if ($user) {
            $empType = $user['employee_type'] ?? 'Timed';
            $total_hours = 0;
            $earnings = 0;

            if (strcasecmp($status, 'Leave') === 0) {
                $total_hours = 10;
                $rate = $empType === 'Fixed' ? floatval($user['weekly_rate'] ?? 0) : floatval($user['hourly_rate'] ?? 0);
                $earnings = $empType === 'Fixed' ? $rate : round($total_hours * $rate, 2);
            } elseif (!in_array($status, ['Absent', 'Leave', 'Holiday', 'Rescheduled'])) {
                if (isset($data->total_hours) && $data->total_hours !== '') {
                    $total_hours = floatval($data->total_hours);
                } else {
                    $total_hours = calculateTotalHours($am_in, $am_out, $pm_in, $pm_out);
                }
                if ($empType === 'Fixed' && $total_hours == 0) {
                    $total_hours = 10;
                }
                
                if ($empType === 'Fixed') {
                    $rate = floatval($user['weekly_rate'] ?? 0);
                    $ot_rate = floatval($user['ot_rate'] ?? 0);
                    $ot_hours = max(0, $total_hours - 10);
                    $earnings = $rate + round($ot_hours * $ot_rate, 2);
                } else {
                    $hourly_rate = floatval($user['hourly_rate'] ?? 0);
                    $ot_rate = floatval($user['ot_rate'] ?? 0);
                    if ($total_hours > 8) {
                        $reg_hours = 8;
                        $ot_hours = $total_hours - 8;
                        $effective_ot_rate = $ot_rate > 0 ? $ot_rate : $hourly_rate;
                        $earnings = round(($reg_hours * $hourly_rate) + ($ot_hours * $effective_ot_rate), 2);
                    } else {
                        $earnings = round($total_hours * $hourly_rate, 2);
                    }
                }
            }

            $has_manual = tableHasColumn($conn, 'attendance', 'is_manual');
            if ($has_manual) {
                $query = "INSERT INTO attendance (user_id, date, am_in, am_out, pm_in, pm_out, total_hours, earnings, status, is_manual) 
                          VALUES (:user_id, :date, :am_in, :am_out, :pm_in, :pm_out, :total_hours, :earnings, :status, 1)
                          ON DUPLICATE KEY UPDATE am_in = VALUES(am_in), am_out = VALUES(am_out), pm_in = VALUES(pm_in), pm_out = VALUES(pm_out), total_hours = VALUES(total_hours), earnings = VALUES(earnings), status = VALUES(status), is_manual = 1";
            } else {
                $query = "INSERT INTO attendance (user_id, date, am_in, am_out, pm_in, pm_out, total_hours, earnings, status) 
                          VALUES (:user_id, :date, :am_in, :am_out, :pm_in, :pm_out, :total_hours, :earnings, :status)
                          ON DUPLICATE KEY UPDATE am_in = VALUES(am_in), am_out = VALUES(am_out), pm_in = VALUES(pm_in), pm_out = VALUES(pm_out), total_hours = VALUES(total_hours), earnings = VALUES(earnings), status = VALUES(status)";
            }
            $stmt = $conn->prepare($query);
            $stmt->execute([
                ':user_id' => $user_id,
                ':date' => $date,
                ':am_in' => $am_in,
                ':am_out' => $am_out,
                ':pm_in' => $pm_in,
                ':pm_out' => $pm_out,
                ':total_hours' => $total_hours,
                ':earnings' => $earnings,
                ':status' => $status
            ]);
            
            logAction($conn, $modifier_id ?? 1, 'DTR_ADD_RECORD', "Admin added attendance record for user ID {$user_id} on date {$date}.");
            
            echo json_encode(["status" => "success", "message" => "Record added successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "User not found"]);
        }
    } elseif ($action === 'delete_record') {
        $modifier_id = isset($_GET['modifier_id']) ? $_GET['modifier_id'] : (isset($data->modifier_id) ? $data->modifier_id : 1);
        $record_id = isset($_GET['record_id']) ? $_GET['record_id'] : (isset($data->record_id) ? $data->record_id : null);
        if ($record_id) {
            $fetch_uid = $conn->prepare("SELECT user_id FROM attendance WHERE id = :record_id");
            $fetch_uid->execute([':record_id' => $record_id]);
            $uid_res = $fetch_uid->fetchColumn();

            $query = "DELETE FROM attendance WHERE id = :record_id";
            $stmt = $conn->prepare($query);
            $stmt->execute([':record_id' => $record_id]);
            
            if ($uid_res) {
                logAction($conn, $modifier_id ?? 1, 'DTR_DELETE_RECORD', "Admin deleted attendance record for user ID {$uid_res}.");
            }

            echo json_encode(["status" => "success", "message" => "Record deleted successfully"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Record ID required"]);
        }
    } elseif ($action === 'get_overtime') {
        try {
            ensureGlobalSchema($conn);
            $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
            if ($user_id > 0) {
                $stmt = $conn->prepare("SELECT * FROM employee_overtime WHERE user_id = :user_id");
                $stmt->execute([':user_id' => $user_id]);
            } else {
                $stmt = $conn->query("SELECT * FROM employee_overtime");
            }
            $rows = $stmt ? $stmt->fetchAll(PDO::FETCH_ASSOC) : [];
            echo json_encode(["status" => "success", "data" => $rows ?: []]);
        } catch (Throwable $e) {
            echo json_encode(["status" => "success", "data" => []]);
        }
    } elseif ($action === 'save_overtime') {
        ensureGlobalSchema($conn);
        $user_id = isset($data->user_id) ? intval($data->user_id) : (isset($_POST['user_id']) ? intval($_POST['user_id']) : 0);
        $period_type = isset($data->period_type) ? trim($data->period_type) : (isset($_POST['period_type']) ? trim($_POST['period_type']) : '');
        $period_value = isset($data->period_value) ? trim($data->period_value) : (isset($_POST['period_value']) ? trim($_POST['period_value']) : '');
        $ot_amount = isset($data->ot_amount) ? floatval($data->ot_amount) : (isset($_POST['ot_amount']) ? floatval($_POST['ot_amount']) : 0.00);
        $modifier_id = isset($data->modifier_id) ? intval($data->modifier_id) : 1;

        if (!$user_id || !in_array($period_type, ['day', 'week', 'month']) || empty($period_value)) {
            echo json_encode(["status" => "error", "message" => "Invalid parameters"]);
            exit;
        }

        try {
            $sql = "INSERT INTO employee_overtime (user_id, period_type, period_value, ot_amount) 
                    VALUES (:user_id, :period_type, :period_value, :ot_amount) 
                    ON DUPLICATE KEY UPDATE ot_amount = VALUES(ot_amount)";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':user_id' => $user_id,
                ':period_type' => $period_type,
                ':period_value' => $period_value,
                ':ot_amount' => $ot_amount
            ]);

            logAction($conn, $modifier_id, 'DTR_SAVE_OVERTIME', "Admin set overtime for user ID {$user_id} ({$period_type}: {$period_value}) to \${$ot_amount}.");
            echo json_encode(["status" => "success", "message" => "Overtime saved successfully", "data" => [
                "user_id" => $user_id,
                "period_type" => $period_type,
                "period_value" => $period_value,
                "ot_amount" => $ot_amount
            ]]);
        } catch (Throwable $e) {
            echo json_encode(["status" => "error", "message" => "Failed to save overtime: " . $e->getMessage()]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action"]);
    }
} catch (Throwable $topLevelEx) {
    http_response_code(200);
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $topLevelEx->getMessage()
    ]);
}
?>
