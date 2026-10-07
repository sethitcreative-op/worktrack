<?php
date_default_timezone_set('America/New_York');
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/logger.php';

$data = json_decode(file_get_contents("php://input"));
$action = isset($_GET['action']) ? $_GET['action'] : (isset($data->action) ? $data->action : '');

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
            // Employee punched for lunch
            // deduction = max(30 mins, duration of lunch break)
            $lunch_duration_hours = max(0, $t_pm_in - $t_am_out) / 3600;
            $deduction_hours = max(0.5, $lunch_duration_hours);
        } else {
            // No punch for lunch
            // 1 hr deduction if they work more than 6 hours
            if ($gross_hours > 6) {
                $deduction_hours = 1.0;
            }
        }
        
        $total_hours = max(0, $gross_hours - $deduction_hours);
    }
    return round($total_hours, 2);
}

if (in_array($action, ['am_in', 'am_out', 'pm_in', 'pm_out', 'fixed_in'])) {
    $user_id = $data->user_id;
    
    // Use server's reliable time to prevent time theft, and round to nearest 30 minutes
    $time_unix = time();
    $rounded_time = round($time_unix / 1800) * 1800;
    $server_time = ($action === 'fixed_in') ? '10:00:00' : date('H:i:s', $rounded_time);
    $server_date = date('Y-m-d');
    $server_datetime = $server_date . ' ' . $server_time;
    
    // Fetch the existing record for the user for the current server date
    $fetch_query = "SELECT a.*, u.hourly_rate, u.weekly_rate, u.employee_type FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.user_id = :user_id AND a.date = :server_date ORDER BY a.id DESC LIMIT 1";
    $fetch_stmt = $conn->prepare($fetch_query);
    $fetch_stmt->execute([':user_id' => $user_id, ':server_date' => $server_date]);
    $record = $fetch_stmt->fetch(PDO::FETCH_ASSOC);
    
    $action_name = strtoupper(str_replace('_', ' ', $action));
    
    if (!$record) {
        $fetch_user = "SELECT hourly_rate, weekly_rate, employee_type FROM users WHERE id = :user_id";
        $stmt_user = $conn->prepare($fetch_user);
        $stmt_user->execute([':user_id' => $user_id]);
        $user_data = $stmt_user->fetch(PDO::FETCH_ASSOC);
        $rate = $user_data ? ($user_data['employee_type'] === 'Fixed' ? $user_data['weekly_rate'] : $user_data['hourly_rate']) : 0;
        
        $total_hours = ($action === 'fixed_in') ? 8 : 0;
        $earnings = ($user_data && $user_data['employee_type'] === 'Fixed') ? floatval($rate) : round($total_hours * floatval($rate), 2);
        
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
        
        if (!$pm_out || strpos($pm_out, '1900-01-01') !== false) {
            // User requested not to calculate total hours until PM OUT is tagged
            $total_hours = 0;
        } else {
            $total_hours = calculateTotalHours($am_in, $am_out, $pm_in, $pm_out);
        }
        
        // Always resolve rate
        $rate = $record['employee_type'] === 'Fixed' ? ($record['weekly_rate'] ?: 0) : ($record['hourly_rate'] ?: 0);
        $earnings = $record['employee_type'] === 'Fixed' ? floatval($rate) : round($total_hours * floatval($rate), 2);
        
        $query = "UPDATE attendance SET {$action} = :server_datetime, total_hours = :total_hours, earnings = :earnings WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':server_datetime' => $server_datetime,
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

        // ── 1. Auto-close past open shifts ──
    $auto_close_query = "
        UPDATE attendance a
        JOIN users u ON a.user_id = u.id
        SET a.total_hours = ROUND(
                CASE 
                    WHEN a.am_in > '2000-01-01' AND a.pm_out > '2000-01-01' THEN 
                        GREATEST(0, (TIMESTAMPDIFF(SECOND, a.am_in, a.pm_out) / 3600) - 
                            CASE 
                                WHEN a.am_out > '2000-01-01' AND a.pm_in > '2000-01-01' THEN 
                                    GREATEST(0.5, TIMESTAMPDIFF(SECOND, a.am_out, a.pm_in) / 3600)
                                ELSE 
                                    IF(TIMESTAMPDIFF(SECOND, a.am_in, a.pm_out) / 3600 > 6, 1.0, 0.0)
                            END
                        )
                    ELSE 0
                END
            , 2),
            a.earnings = ROUND((
                CASE 
                    WHEN a.am_in > '2000-01-01' AND a.pm_out > '2000-01-01' THEN 
                        GREATEST(0, (TIMESTAMPDIFF(SECOND, a.am_in, a.pm_out) / 3600) - 
                            CASE 
                                WHEN a.am_out > '2000-01-01' AND a.pm_in > '2000-01-01' THEN 
                                    GREATEST(0.5, TIMESTAMPDIFF(SECOND, a.am_out, a.pm_in) / 3600)
                                ELSE 
                                    IF(TIMESTAMPDIFF(SECOND, a.am_in, a.pm_out) / 3600 > 6, 1.0, 0.0)
                            END
                        )
                    ELSE 0
                END
            ) * u.hourly_rate, 2),
            a.status = 'Missing Timeout',
            a.am_out = IF(a.am_in IS NOT NULL AND a.am_in > '2000-01-01' AND (a.am_out IS NULL OR a.am_out < '2000-01-01'), '1900-01-01 00:00:00', a.am_out),
            a.pm_out = IF(a.pm_in IS NOT NULL AND a.pm_in > '2000-01-01' AND (a.pm_out IS NULL OR a.pm_out < '2000-01-01'), '1900-01-01 00:00:00', a.pm_out)
        WHERE ( (a.pm_in IS NOT NULL AND a.pm_in > '2000-01-01' AND (a.pm_out IS NULL OR a.pm_out < '2000-01-01')) 
             OR (a.am_in IS NOT NULL AND a.am_in > '2000-01-01' AND (a.am_out IS NULL OR a.am_out < '2000-01-01') AND (a.pm_out IS NULL OR a.pm_out < '2000-01-01')) )
          AND a.date < :server_date
          AND u.employee_type != 'Fixed'
    ";
    $auto_close_stmt = $conn->prepare($auto_close_query);
    $auto_close_stmt->execute([':server_date' => $server_date]);

    // ── 2. Auto-mark Absent for ALL past days (Mon–Sun) with no clock-in ──
    // Get all users and their earliest possible date (account creation date)
    $allUsersStmt = $conn->prepare("SELECT id, DATE(created_at) as joined_date FROM users");
    $allUsersStmt->execute();
    $allUsers = $allUsersStmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($allUsers as $u) {
        $uid        = $u['id'];
        $startDate  = $u['joined_date'] ?? '2024-01-01';

        // Optimization: Only look back up to 30 days to prevent massive query delays
        $thirtyDaysAgo = date('Y-m-d', strtotime('-30 days'));
        if ($startDate < $thirtyDaysAgo) {
            $startDate = $thirtyDaysAgo;
        }

        // Batch-insert Absent for every past date with no attendance record,
        // excluding dates covered by a holiday or an approved leave request
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
                -- No existing attendance record
                NOT EXISTS (
                    SELECT 1 FROM attendance a2
                    WHERE a2.user_id = :uid2 AND a2.date = d.date_val
                )
                -- No holiday on that date
                AND NOT EXISTS (
                    SELECT 1 FROM holidays h
                    WHERE h.holiday_date = d.date_val
                )
                -- No approved leave request covering that date (from leave_requests table)
                AND NOT EXISTS (
                    SELECT 1 FROM leave_requests lr
                    WHERE lr.user_id = :uid3
                      AND lr.status = 'approved'
                      AND d.date_val BETWEEN lr.start_date AND lr.end_date
                )
                -- No approved calendar event (VL, SL, PDO, etc.) on that date
                AND NOT EXISTS (
                    SELECT 1 FROM events ev
                    WHERE ev.user_id = :uid4
                      AND ev.event_date = d.date_val
                      AND ev.status = 'approved'
                      AND ev.event_type IN ('VL', 'SL', 'PDO', 'Birthday', 'Meeting', 'Holiday', 'HL')
                )
                -- No pending reschedule request where this date is the ORIGINAL date being rescheduled
                AND NOT EXISTS (
                    SELECT 1 FROM events ev2
                    JOIN events ev_orig ON ev2.reschedule_for_event_id = ev_orig.id
                    WHERE ev2.user_id = :uid5
                      AND ev2.status = 'pending'
                      AND ev2.reschedule_for_event_id IS NOT NULL
                      AND ev_orig.event_date = d.date_val
                )
                -- ONLY mark absent if they are actually scheduled
                AND EXISTS (
                    SELECT 1 FROM events ev_sched
                    WHERE ev_sched.user_id = :uid6
                      AND ev_sched.event_date = d.date_val
                      AND ev_sched.status = 'approved'
                      AND (ev_sched.event_type = 'WS' OR ev_sched.title = 'Work Shift')
                )
        ";
        $autoAbsentStmt = $conn->prepare($autoAbsentQuery);
        $autoAbsentStmt->execute([
            ':uid'       => $uid,
            ':uid2'      => $uid,
            ':uid3'      => $uid,
            ':uid4'      => $uid,
            ':uid5'      => $uid,
            ':uid6'      => $uid,
            ':start'     => $startDate,
            ':start2'    => $startDate,
            ':yesterday' => $yesterday
        ]);

        // Also update existing records that have no clock-in and are not in a protected status
        $updateAbsentQuery = "
            UPDATE attendance
            SET status = 'Absent'
            WHERE user_id = :uid
              AND date < :server_date
              AND am_in IS NULL
              AND status NOT IN ('Leave', 'Holiday', 'Rescheduled')
              AND NOT EXISTS (
                  SELECT 1 FROM leave_requests lr
                  WHERE lr.user_id = :uid2
                    AND lr.status = 'approved'
                    AND attendance.date BETWEEN lr.start_date AND lr.end_date
              )
              AND EXISTS (
                  SELECT 1 FROM events ev_sched
                  WHERE ev_sched.user_id = :uid3
                    AND ev_sched.event_date = attendance.date
                    AND ev_sched.status = 'approved'
                    AND (ev_sched.event_type = 'WS' OR ev_sched.title = 'Work Shift')
              )
        ";
        $updateAbsentStmt = $conn->prepare($updateAbsentQuery);
        $updateAbsentStmt->execute([
            ':uid'         => $uid,
            ':uid2'        => $uid,
            ':uid3'        => $uid,
            ':server_date' => $server_date
        ]);
    }

    $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
    if ($user_id) {
        $query = "SELECT a.*, u.hourly_rate FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.user_id = :user_id ORDER BY a.date DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute([':user_id' => $user_id]);
    } else {
        // Admin gets all
        $query = "SELECT a.*, u.full_name, u.hourly_rate FROM attendance a JOIN users u ON a.user_id = u.id ORDER BY a.date DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
    }
    
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
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
    $fetch_query = "SELECT a.user_id, a.date as record_date, u.hourly_rate, u.weekly_rate, u.employee_type FROM attendance a JOIN users u ON a.user_id = u.id WHERE a.id = :record_id";
    $fetch_stmt = $conn->prepare($fetch_query);
    $fetch_stmt->execute([':record_id' => $record_id]);
    $record = $fetch_stmt->fetch(PDO::FETCH_ASSOC);

    if ($record) {
        $total_hours = 0;
        $earnings = 0;
        
        if (strcasecmp($status, 'Leave') === 0) {
            $total_hours = 8;
            $rate = $record['employee_type'] === 'Fixed' ? floatval($record['weekly_rate']) : floatval($record['hourly_rate']);
            $earnings = $record['employee_type'] === 'Fixed' ? $rate : round($total_hours * $rate, 2);
        } elseif (!in_array($status, ['Absent', 'Leave', 'Holiday'])) {
            if (isset($data->total_hours) && $data->total_hours !== '') {
                $total_hours = floatval($data->total_hours);
            } else {
                $total_hours = calculateTotalHours($am_in, $am_out, $pm_in, $pm_out);
            }
            $rate = $record['employee_type'] === 'Fixed' ? floatval($record['weekly_rate']) : floatval($record['hourly_rate']);
            $earnings = $record['employee_type'] === 'Fixed' ? $rate : round($total_hours * $rate, 2);
        }

        $query = "UPDATE attendance SET am_in = :am_in, am_out = :am_out, pm_in = :pm_in, pm_out = :pm_out, total_hours = :total_hours, earnings = :earnings, status = :status WHERE id = :record_id";
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
    
    $fetch_user = "SELECT hourly_rate, weekly_rate, employee_type FROM users WHERE id = :user_id";
    $fetch_stmt = $conn->prepare($fetch_user);
    $fetch_stmt->execute([':user_id' => $user_id]);
    $user = $fetch_stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        $total_hours = 0;
        $earnings = 0;

        if (strcasecmp($status, 'Leave') === 0) {
            $total_hours = 8;
            $rate = $user['employee_type'] === 'Fixed' ? floatval($user['weekly_rate']) : floatval($user['hourly_rate']);
            $earnings = $user['employee_type'] === 'Fixed' ? $rate : round($total_hours * $rate, 2);
        } elseif (!in_array($status, ['Absent', 'Leave', 'Holiday'])) {
            if (isset($data->total_hours) && $data->total_hours !== '') {
                $total_hours = floatval($data->total_hours);
            } else {
                $total_hours = calculateTotalHours($am_in, $am_out, $pm_in, $pm_out);
            }
            $rate = $user['employee_type'] === 'Fixed' ? floatval($user['weekly_rate']) : floatval($user['hourly_rate']);
            $earnings = $user['employee_type'] === 'Fixed' ? $rate : round($total_hours * $rate, 2);
        }

        $query = "INSERT INTO attendance (user_id, date, am_in, am_out, pm_in, pm_out, total_hours, earnings, status) 
                  VALUES (:user_id, :date, :am_in, :am_out, :pm_in, :pm_out, :total_hours, :earnings, :status)
                  ON DUPLICATE KEY UPDATE am_in = :am_in, am_out = :am_out, pm_in = :pm_in, pm_out = :pm_out, total_hours = :total_hours, earnings = :earnings, status = :status";
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
            // Fetch user ID for log
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
}
?>
