<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../config/logger.php';

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
            $conn->exec("ALTER TABLE users ADD COLUMN IF NOT EXISTS leave_credits INT DEFAULT 0");
        } catch (Throwable $e) {
            try { $conn->exec("ALTER TABLE users ADD COLUMN leave_credits INT DEFAULT 0"); } catch (Throwable $e2) {}
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

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Function to handle image upload
function uploadProfilePicture($file) {
    $localDir = "../../frontend/public/img/profiles/";
    $prodDir = "../../img/profiles/";
    $isLocal = ($_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false || strpos($_SERVER['HTTP_HOST'], '192.168.') !== false);
    $target_dir = $isLocal ? $localDir : $prodDir;
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0777, true);
    }
    $file_extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $check = getimagesize($file["tmp_name"]);
    if($check !== false) {
        $new_filename = uniqid() . '.' . $file_extension;
        $target_file = $target_dir . $new_filename;
        if (move_uploaded_file($file["tmp_name"], $target_file)) {
            return "img/profiles/" . $new_filename;
        }
    }
    return null;
}

// Function to handle government ID upload
function uploadGovIdFile($file) {
    $localDir = "../../frontend/public/img/gov_ids/";
    $prodDir = "../../img/gov_ids/";
    $isLocal = ($_SERVER['HTTP_HOST'] === 'localhost' || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false || strpos($_SERVER['HTTP_HOST'], '192.168.') !== false);
    $target_dir = $isLocal ? $localDir : $prodDir;
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0777, true);
    }
    $file_extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
    $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf'];
    if(in_array($file_extension, $allowedTypes)) {
        $new_filename = uniqid('govid_') . '_' . time() . '.' . $file_extension;
        $target_file = $target_dir . $new_filename;
        if (move_uploaded_file($file["tmp_name"], $target_file)) {
            return "img/gov_ids/" . $new_filename;
        }
    }
    return null;
}

try {
    if ($method === 'GET' && $action === 'list') {
        try {
            $query = "SELECT id, username, role, full_name, hourly_rate, weekly_rate, ot_rate, profile_picture, email, phone, address, id_number, sex, created_at, is_active, leave_credits, last_active, employee_type FROM users";
            $stmt = $conn->prepare($query);
            $stmt->execute();
            $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status" => "success", "data" => $employees]);
        } catch (Throwable $e) {
            // Bulletproof fallback: fetch * and normalize columns
            try {
                $stmt = $conn->query("SELECT * FROM users");
                $rawEmployees = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $employees = array_map(function($emp) {
                    return [
                        'id' => $emp['id'] ?? 0,
                        'username' => $emp['username'] ?? '',
                        'role' => $emp['role'] ?? 'user',
                        'full_name' => $emp['full_name'] ?? '',
                        'hourly_rate' => $emp['hourly_rate'] ?? '0.00',
                        'weekly_rate' => $emp['weekly_rate'] ?? '0.00',
                        'ot_rate' => $emp['ot_rate'] ?? '0.00',
                        'profile_picture' => $emp['profile_picture'] ?? null,
                        'email' => $emp['email'] ?? '',
                        'phone' => $emp['phone'] ?? '',
                        'address' => $emp['address'] ?? '',
                        'id_number' => $emp['id_number'] ?? '',
                        'sex' => $emp['sex'] ?? '',
                        'created_at' => $emp['created_at'] ?? '',
                        'is_active' => $emp['is_active'] ?? 1,
                        'leave_credits' => $emp['leave_credits'] ?? 0,
                        'last_active' => $emp['last_active'] ?? null,
                        'employee_type' => $emp['employee_type'] ?? 'Timed'
                    ];
                }, $rawEmployees);
                echo json_encode(["status" => "success", "data" => $employees]);
            } catch (Throwable $e2) {
                echo json_encode(["status" => "error", "message" => $e2->getMessage(), "data" => []]);
            }
        }
    } 
    elseif ($method === 'POST') {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        
        $id = $_POST['id'] ?? ($data->id ?? null);
        $methodParam = $_POST['_method'] ?? ($data->_method ?? '');
        $isUpdate = (strtoupper(trim($methodParam)) === 'PUT') || !empty($id);
        
        $username = $_POST['username'] ?? ($data->username ?? '');
        $password = $_POST['password'] ?? ($data->password ?? '');
        $role = $_POST['role'] ?? ($data->role ?? 'user');
        $full_name = $_POST['full_name'] ?? ($data->full_name ?? '');
        $hourly_rate = isset($_POST['hourly_rate']) ? floatval($_POST['hourly_rate']) : (isset($data->hourly_rate) ? floatval($data->hourly_rate) : 0);
        $weekly_rate = isset($_POST['weekly_rate']) ? floatval($_POST['weekly_rate']) : (isset($data->weekly_rate) ? floatval($data->weekly_rate) : 0);
        $ot_rate = isset($_POST['ot_rate']) ? floatval($_POST['ot_rate']) : (isset($data->ot_rate) ? floatval($data->ot_rate) : 0);
        
        $email = $_POST['email'] ?? ($data->email ?? null);
        $phone = $_POST['phone'] ?? ($data->phone ?? null);
        $address = $_POST['address'] ?? ($data->address ?? null);
        $id_number = $_POST['id_number'] ?? ($data->id_number ?? null);
        $sex = $_POST['sex'] ?? ($data->sex ?? null);
        $is_active = $_POST['is_active'] ?? ($data->is_active ?? 1);
        $leave_credits = $_POST['leave_credits'] ?? ($data->leave_credits ?? 0);
        $employee_type_raw = $_POST['employee_type'] ?? ($data->employee_type ?? 'Timed');
        $employee_type = strtolower(trim($employee_type_raw)) === 'fixed' ? 'Fixed' : 'Timed';
        
        $profile_picture = null;
        if (isset($_FILES['profile_picture']) && $_FILES['profile_picture']['error'] == 0) {
            $profile_picture = uploadProfilePicture($_FILES['profile_picture']);
        }

        // Check for duplicate username
        $check_query = "SELECT id FROM users WHERE username = :username";
        if ($isUpdate) {
            $check_query .= " AND id != :id";
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->execute([':username' => $username, ':id' => $id]);
        } else {
            $check_stmt = $conn->prepare($check_query);
            $check_stmt->execute([':username' => $username]);
        }

        if ($check_stmt->rowCount() > 0) {
            echo json_encode(["status" => "error", "message" => "Username already exists."]);
            exit;
        }

        $has_ot = tableHasColumn($conn, 'users', 'ot_rate');
        $has_weekly = tableHasColumn($conn, 'users', 'weekly_rate');
        $has_type = tableHasColumn($conn, 'users', 'employee_type');
        $has_leave = tableHasColumn($conn, 'users', 'leave_credits');

        if ($isUpdate) {
            $setClauses = [
                "username=:username", "role=:role", "full_name=:name", "hourly_rate=:rate",
                "email=:email", "phone=:phone", "address=:address", "id_number=:id_number",
                "sex=:sex", "is_active=:is_active"
            ];
            $params = [
                ':username' => $username, ':role' => $role, ':name' => $full_name, ':rate' => $hourly_rate,
                ':email' => $email, ':phone' => $phone, ':address' => $address, ':id_number' => $id_number,
                ':sex' => $sex, ':is_active' => $is_active, ':id' => $id
            ];
            
            if ($has_weekly) {
                $setClauses[] = "weekly_rate=:weekly_rate";
                $params[':weekly_rate'] = $weekly_rate;
            }
            if ($has_ot) {
                $setClauses[] = "ot_rate=:ot_rate";
                $params[':ot_rate'] = $ot_rate;
            }
            if ($has_type) {
                $setClauses[] = "employee_type=:employee_type";
                $params[':employee_type'] = $employee_type;
            }
            if ($has_leave) {
                $setClauses[] = "leave_credits=:leave_credits";
                $params[':leave_credits'] = $leave_credits;
            }
            if (!empty($password)) {
                $password_hash = password_hash($password, PASSWORD_BCRYPT);
                $setClauses[] = "password_hash=:pass";
                $params[':pass'] = $password_hash;
            }
            if ($profile_picture) {
                $setClauses[] = "profile_picture=:pic";
                $params[':pic'] = $profile_picture;
            }

            $query = "UPDATE users SET " . implode(", ", $setClauses) . " WHERE id=:id";
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            
            if (isset($_FILES['gov_id_file']) && $_FILES['gov_id_file']['error'] == 0) {
                $gov_id_file_path = uploadGovIdFile($_FILES['gov_id_file']);
                if ($gov_id_file_path) {
                    try {
                        $gov_query = "INSERT INTO government_ids (user_id, id_type, id_number, file_path) VALUES (:user_id, :id_type, :id_number, :file_path)";
                        $gov_stmt = $conn->prepare($gov_query);
                        $gov_stmt->execute([
                            ':user_id' => $id,
                            ':id_type' => 'Primary ID',
                            ':id_number' => $id_number ?? '',
                            ':file_path' => $gov_id_file_path
                        ]);
                    } catch (Throwable $ge) {}
                }
            }
            
            logAction($conn, $id, 'UPDATE_EMPLOYEE', "Administrator updated the employee record for {$full_name} (Username: {$username}, Role: {$role}).");
            echo json_encode(["status" => "success", "message" => "Employee updated successfully", "profile_picture" => $profile_picture]);
        } else {
            // Create new employee
            $password_hash = password_hash($password, PASSWORD_BCRYPT);
            
            $cols = ["username", "password_hash", "role", "full_name", "hourly_rate", "profile_picture", "email", "phone", "address", "id_number", "sex", "is_active"];
            $vals = [":username", ":pass", ":role", ":name", ":rate", ":pic", ":email", ":phone", ":address", ":id_number", ":sex", ":is_active"];
            $params = [
                ':username' => $username, ':pass' => $password_hash, ':role' => $role, ':name' => $full_name,
                ':rate' => $hourly_rate, ':pic' => $profile_picture, ':email' => $email, ':phone' => $phone,
                ':address' => $address, ':id_number' => $id_number, ':sex' => $sex, ':is_active' => $is_active
            ];

            if ($has_weekly) {
                $cols[] = "weekly_rate"; $vals[] = ":weekly_rate"; $params[':weekly_rate'] = $weekly_rate;
            }
            if ($has_ot) {
                $cols[] = "ot_rate"; $vals[] = ":ot_rate"; $params[':ot_rate'] = $ot_rate;
            }
            if ($has_type) {
                $cols[] = "employee_type"; $vals[] = ":employee_type"; $params[':employee_type'] = $employee_type;
            }
            if ($has_leave) {
                $cols[] = "leave_credits"; $vals[] = ":leave_credits"; $params[':leave_credits'] = $leave_credits;
            }

            $query = "INSERT INTO users (" . implode(", ", $cols) . ") VALUES (" . implode(", ", $vals) . ")";
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            $new_id = $conn->lastInsertId();
            
            if (isset($_FILES['gov_id_file']) && $_FILES['gov_id_file']['error'] == 0) {
                $gov_id_file_path = uploadGovIdFile($_FILES['gov_id_file']);
                if ($gov_id_file_path) {
                    try {
                        $gov_query = "INSERT INTO government_ids (user_id, id_type, id_number, file_path) VALUES (:user_id, :id_type, :id_number, :file_path)";
                        $gov_stmt = $conn->prepare($gov_query);
                        $gov_stmt->execute([
                            ':user_id' => $new_id,
                            ':id_type' => 'Primary ID',
                            ':id_number' => $id_number ?? '',
                            ':file_path' => $gov_id_file_path
                        ]);
                    } catch (Throwable $ge) {}
                }
            }
            
            logAction($conn, $new_id, 'CREATE_EMPLOYEE', "Administrator created a new employee record for {$full_name} (Username: {$username}, Role: {$role}).");
            echo json_encode(["status" => "success", "message" => "Employee created successfully", "profile_picture" => $profile_picture]);
        }
    }
    elseif ($method === 'DELETE') {
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if($id) {
            $query = "DELETE FROM users WHERE id = :id";
            $stmt = $conn->prepare($query);
            $stmt->execute([':id' => $id]);
            logAction($conn, $id, 'DELETE_EMPLOYEE', "Administrator deleted the employee record with ID {$id}.");
            echo json_encode(["status" => "success", "message" => "Employee deleted"]);
        }
    }
    elseif ($method === 'PUT') {
        $input = file_get_contents("php://input");
        $data = json_decode($input);
        if($data && isset($data->id)) {
            $id = $data->id;
            $username = $data->username;
            $role = $data->role ?? 'user';
            $full_name = $data->full_name;
            $hourly_rate = isset($data->hourly_rate) ? floatval($data->hourly_rate) : 0;
            $weekly_rate = isset($data->weekly_rate) ? floatval($data->weekly_rate) : 0;
            $ot_rate = isset($data->ot_rate) ? floatval($data->ot_rate) : 0;
            $employee_type = (isset($data->employee_type) && strtolower(trim($data->employee_type)) === 'fixed') ? 'Fixed' : 'Timed';

            $has_ot = tableHasColumn($conn, 'users', 'ot_rate');
            $has_weekly = tableHasColumn($conn, 'users', 'weekly_rate');
            $has_type = tableHasColumn($conn, 'users', 'employee_type');

            $setClauses = ["username=:username", "role=:role", "full_name=:name", "hourly_rate=:rate"];
            $params = [':username' => $username, ':role' => $role, ':name' => $full_name, ':rate' => $hourly_rate, ':id' => $id];

            if ($has_weekly) {
                $setClauses[] = "weekly_rate=:weekly_rate";
                $params[':weekly_rate'] = $weekly_rate;
            }
            if ($has_ot) {
                $setClauses[] = "ot_rate=:ot_rate";
                $params[':ot_rate'] = $ot_rate;
            }
            if ($has_type) {
                $setClauses[] = "employee_type=:employee_type";
                $params[':employee_type'] = $employee_type;
            }
            if (!empty($data->password)) {
                $password_hash = password_hash($data->password, PASSWORD_BCRYPT);
                $setClauses[] = "password_hash=:pass";
                $params[':pass'] = $password_hash;
            }

            $query = "UPDATE users SET " . implode(", ", $setClauses) . " WHERE id=:id";
            $stmt = $conn->prepare($query);
            $stmt->execute($params);
            logAction($conn, $id, 'UPDATE_EMPLOYEE', "Administrator updated the employee record for {$full_name} (Username: {$username}, Role: {$role}).");
            echo json_encode(["status" => "success", "message" => "Employee updated successfully"]);
        }
    }
} catch (Throwable $topLevelEx) {
    http_response_code(200);
    echo json_encode([
        "status" => "error",
        "message" => "Server error: " . $topLevelEx->getMessage()
    ]);
}
?>
