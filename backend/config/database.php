<?php
// backend/config/database.php

date_default_timezone_set('America/New_York');

// Auto-detect environment: Hostinger Production vs Local XAMPP
$is_hostinger = (isset($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'impactprophcrm.com') !== false)
             || (isset($_SERVER['SERVER_NAME']) && strpos($_SERVER['SERVER_NAME'], 'impactprophcrm.com') !== false)
             || (!file_exists('C:\\xampp') && PHP_OS_FAMILY !== 'Windows');

$db_name = "u416162286_ems_db";
$port = 3306;

if ($is_hostinger) {
    $host = "localhost";
    $username = "u416162286_ems_db";
    $password = "iMPACTPROPH2026";
} else {
    $host = "localhost";
    $username = "root";
    $password = "";
}

try {
    try {
        $conn = new PDO("mysql:host={$host};port={$port};dbname={$db_name}", $username, $password);
    } catch (PDOException $first_ex) {
        // Fallback: If primary credentials fail, try the alternate configuration seamlessly
        $alt_user = ($username === 'root') ? "u416162286_ems_db" : "root";
        $alt_pass = ($username === 'root') ? "iMPACTPROPH2026" : "";
        $conn = new PDO("mysql:host={$host};port={$port};dbname={$db_name}", $alt_user, $alt_pass);
    }
    
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Set MySQL timezone to match PHP timezone
    $offset = (new DateTime())->format('P');
    $conn->exec("SET time_zone = '{$offset}';");

    // Self-healing schema: Auto-ensure tables and columns exist on both Local and Hostinger
    try {
        $conn->exec("ALTER TABLE users ADD COLUMN ot_rate DECIMAL(10,2) DEFAULT 0.00");
    } catch (Exception $e) {}

    try {
        $conn->exec("ALTER TABLE attendance ADD COLUMN is_manual TINYINT(1) DEFAULT 0");
    } catch (Exception $e) {}

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
    } catch (Exception $e) {}

    // Ensure uploads directory exists
    $uploadDir = __DIR__ . '/../uploads/gov_ids';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
} catch(PDOException $exception) {
    header("Content-Type: application/json; charset=UTF-8");
    http_response_code(500);
    echo json_encode([
        "status" => "error", 
        "message" => "Database connection error: " . $exception->getMessage()
    ]);
    exit;
}
?>
