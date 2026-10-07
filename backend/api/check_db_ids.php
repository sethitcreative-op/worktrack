<?php
require_once '../config/database.php';
$stmt = $conn->query("SELECT * FROM government_ids ORDER BY uploaded_at DESC LIMIT 5");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
