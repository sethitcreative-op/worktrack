<?php
require 'config/database.php';
try {
    $conn->exec("ALTER TABLE users ADD COLUMN weekly_rate DECIMAL(10,2) DEFAULT 0.00 AFTER hourly_rate");
    echo "Success";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
