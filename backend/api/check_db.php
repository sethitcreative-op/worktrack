<?php
require_once '../config/database.php';
$stmt = $conn->query("DESCRIBE chat_messages");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
