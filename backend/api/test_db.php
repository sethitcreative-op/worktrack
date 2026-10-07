<?php
require_once "../config/cors.php";
require_once "../config/database.php";

try {
    $conn->exec("ALTER TABLE chat_messages ADD COLUMN is_read TINYINT(1) DEFAULT 0");
    echo "Column added successfully.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), "Duplicate column name") !== false) {
        echo "Column already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
