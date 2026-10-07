<?php
require_once '../config/cors.php';
require_once '../config/database.php';

// Ensure is_edited column exists (safe migration)
try {
    $conn->exec("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_edited TINYINT(1) NOT NULL DEFAULT 0");
    $conn->exec("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS receiver_id INT NOT NULL DEFAULT 0");
    $conn->exec("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read TINYINT(1) NOT NULL DEFAULT 0");
} catch (Exception $e) { /* columns may already exist */ }

$data = json_decode(file_get_contents("php://input"));

if(isset($data->action)) {
    if($data->action === 'get_messages') {
        $user_id = $data->user_id;
        $chat_partner_id = $data->chat_partner_id;
        
        $query = "SELECT * FROM chat_messages 
                  WHERE (sender_id = :uid AND receiver_id = :pid) 
                     OR (sender_id = :pid AND receiver_id = :uid)
                  ORDER BY created_at ASC";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':uid', $user_id);
        $stmt->bindParam(':pid', $chat_partner_id);
        $stmt->execute();
        
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "messages" => $messages]);
        exit;
    }
    
    if($data->action === 'get_unread_counts') {
        $user_id = $data->user_id;
        $query = "SELECT sender_id, COUNT(*) as count FROM chat_messages WHERE receiver_id = :uid AND is_read = 0 GROUP BY sender_id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':uid', $user_id);
        $stmt->execute();
        $counts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(["status" => "success", "data" => $counts]);
        exit;
    }
    
    if($data->action === 'mark_read') {
        $user_id = $data->user_id;
        $chat_partner_id = $data->chat_partner_id;
        $query = "UPDATE chat_messages SET is_read = 1 WHERE receiver_id = :uid AND sender_id = :pid AND is_read = 0";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':uid', $user_id);
        $stmt->bindParam(':pid', $chat_partner_id);
        $stmt->execute();
        
        // Clear related global notifications
        $userQuery = "SELECT full_name, username FROM users WHERE id = :pid";
        $uStmt = $conn->prepare($userQuery);
        $uStmt->execute([':pid' => $chat_partner_id]);
        $partner = $uStmt->fetch(PDO::FETCH_ASSOC);
        
        if ($partner) {
            $sender_name = $partner['full_name'] ? $partner['full_name'] : $partner['username'];
            $notifMsg = "New message from " . $sender_name;
            $notifUpdate = "UPDATE notifications SET is_read = 1 WHERE user_id = :uid AND message = :msg AND is_read = 0";
            $nStmt = $conn->prepare($notifUpdate);
            $nStmt->execute([':uid' => $user_id, ':msg' => $notifMsg]);
        }

        echo json_encode(["status" => "success"]);
        exit;
    }
    
    if($data->action === 'send_message') {
        $employee_id = $data->employee_id ?? 0;
        $sender_id = $data->sender_id;
        $receiver_id = $data->receiver_id;
        $sender_name = $data->sender_name;
        $sender_role = $data->sender_role;
        $message = $data->message;
        
        $query = "INSERT INTO chat_messages (employee_id, sender_id, receiver_id, sender_name, sender_role, message) 
                  VALUES (:employee_id, :sender_id, :receiver_id, :sender_name, :sender_role, :message)";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(':employee_id', $employee_id);
        $stmt->bindParam(':sender_id', $sender_id);
        $stmt->bindParam(':receiver_id', $receiver_id);
        $stmt->bindParam(':sender_name', $sender_name);
        $stmt->bindParam(':sender_role', $sender_role);
        $stmt->bindParam(':message', $message);
        
        if($stmt->execute()) {
            $newMessageId = $conn->lastInsertId();
            
            // Fetch the newly created message to return it
            $queryFetch = "SELECT * FROM chat_messages WHERE id = :id";
            $stmtFetch = $conn->prepare($queryFetch);
            $stmtFetch->bindParam(':id', $newMessageId);
            $stmtFetch->execute();
            $newMessage = $stmtFetch->fetch(PDO::FETCH_ASSOC);
            
            // --- Notification Logic ---
            $notifMsg = "New message from " . $sender_name;
            $checkNotif = "SELECT id FROM notifications WHERE user_id = :uid AND message = :msg AND is_read = 0";
            $checkStmt = $conn->prepare($checkNotif);
            $checkStmt->execute([':uid' => $receiver_id, ':msg' => $notifMsg]);
            
            if ($checkStmt->rowCount() == 0) {
                $notifQuery = "INSERT INTO notifications (user_id, type, message) VALUES (:uid, 'info', :msg)";
                $nStmt = $conn->prepare($notifQuery);
                $nStmt->execute([':uid' => $receiver_id, ':msg' => $notifMsg]);
            }
            // --------------------------
            
            echo json_encode(["status" => "success", "message" => "Message sent.", "data" => $newMessage]);
        } else {
            echo json_encode(["status" => "error", "message" => "Failed to send message."]);
        }
        exit;
    }

    if($data->action === 'edit_message') {
        $message_id = $data->message_id;
        $sender_id  = $data->sender_id;
        $new_text   = trim($data->message);

        if (empty($new_text)) {
            echo json_encode(["status" => "error", "message" => "Message cannot be empty."]);
            exit;
        }

        // Only allow the original sender to edit
        $check = $conn->prepare("SELECT id FROM chat_messages WHERE id = :id AND sender_id = :sid");
        $check->execute([':id' => $message_id, ':sid' => $sender_id]);
        if ($check->rowCount() === 0) {
            echo json_encode(["status" => "error", "message" => "Not allowed."]);
            exit;
        }

        $stmt = $conn->prepare("UPDATE chat_messages SET message = :msg, is_edited = 1 WHERE id = :id");
        $stmt->execute([':msg' => $new_text, ':id' => $message_id]);
        echo json_encode(["status" => "success", "message" => "Message updated."]);
        exit;
    }

    if($data->action === 'delete_message') {
        $message_id = $data->message_id;
        $sender_id  = $data->sender_id;

        // Only allow the original sender to delete
        $check = $conn->prepare("SELECT id FROM chat_messages WHERE id = :id AND sender_id = :sid");
        $check->execute([':id' => $message_id, ':sid' => $sender_id]);
        if ($check->rowCount() === 0) {
            echo json_encode(["status" => "error", "message" => "Not allowed."]);
            exit;
        }

        $stmt = $conn->prepare("DELETE FROM chat_messages WHERE id = :id");
        $stmt->execute([':id' => $message_id]);
        echo json_encode(["status" => "success", "message" => "Message deleted."]);
        exit;
    }
}
?>
