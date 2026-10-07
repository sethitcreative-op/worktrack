<?php
require_once __DIR__ . '/../config/database.php';

// Delete all 'Absent' records where the user DOES NOT have an approved WS schedule for that date
$deleteQuery = "
    DELETE FROM attendance 
    WHERE status = 'Absent' 
      AND NOT EXISTS (
          SELECT 1 FROM events ev_sched
          WHERE ev_sched.user_id = attendance.user_id
            AND ev_sched.event_date = attendance.date
            AND ev_sched.status = 'approved'
            AND (ev_sched.event_type = 'WS' OR ev_sched.title = 'Work Shift')
      )
";
$stmt = $conn->prepare($deleteQuery);
$stmt->execute();
$count = $stmt->rowCount();
echo "Deleted $count invalid Absent records.\n";
?>
