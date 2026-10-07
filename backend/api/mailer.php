<?php
// send_email.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Require PHPMailer (Manual Installation from GitHub)
// require '../vendor/autoload.php'; // (Commented out Composer)

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Configure sender accounts. Each entry has: password, SMTP host, port, and encryption.
// - Domain emails (e.g. @corerxreturns.com, @impactproph.com): use Hostinger SMTP (mail.<yourdomain.com>)
// - Gmail accounts: use smtp.gmail.com with a Google App Password
$senderCredentials = [
    'seth.itcreative@impactproph.com' => [
        'password' => 'crty ovbj jlet rcyj',
        'host'     => 'smtp.gmail.com',  // Google Workspace account
        'port'     => 465,
        'secure'   => PHPMailer::ENCRYPTION_SMTPS,
    ],
    'aly@corerxreturns.com' => [
        'password' => 'cxtp zrou gyrn ojel',
        'host'     => 'smtp.gmail.com',  // Google Workspace account
        'port'     => 465,
        'secure'   => PHPMailer::ENCRYPTION_SMTPS,
    ],
    'finance@corerxreturns.com' => [
        'password' => 'tozj tvvr tyfp gynq',
        'host'     => 'smtp.gmail.com',  // Google Workspace account
        'port'     => 465,
        'secure'   => PHPMailer::ENCRYPTION_SMTPS,
    ],
    // Gmail accounts — use smtp.gmail.com with a Google App Password (not your normal Gmail password)
    // 'payroll@gmail.com' => [
    //     'password' => 'your-16-char-app-password',
    //     'host'     => 'smtp.gmail.com',
    //     'port'     => 465,
    //     'secure'   => PHPMailer::ENCRYPTION_SMTPS,
    // ],
];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Return only the email addresses for the frontend dropdown
    $emails = array_keys($senderCredentials);
    echo json_encode(["status" => "success", "emails" => $emails]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $from_email = $_POST['from_email'] ?? '';
    $recipient = $_POST['recipient'] ?? '';
    $subject = $_POST['subject'] ?? '';
    $message = $_POST['message'] ?? '';

    if (empty($recipient) || empty($subject) || empty($message) || empty($from_email)) {
        echo json_encode(["status" => "error", "message" => "All fields including from_email are required."]);
        exit;
    }

    // Check if the requested sender exists in our configuration
    if (!array_key_exists($from_email, $senderCredentials)) {
        echo json_encode(["status" => "error", "message" => "Invalid sender account selected."]);
        exit;
    }

    $senderConfig   = $senderCredentials[$from_email];
    $senderPassword = $senderConfig['password'];
    $smtpHost       = $senderConfig['host'];
    $smtpPort       = $senderConfig['port'];
    $smtpSecure     = $senderConfig['secure'];

    $hasAttachment = false;
    $attachmentName = '';

    // Handle File Uploads (Attachments)
    if (isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['attachment']['tmp_name'];
        $fileName = $_FILES['attachment']['name'];
        $fileType = $_FILES['attachment']['type'];

        // Allow only specific types (PDF, Images)
        $allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif'];
        if (in_array($fileType, $allowedTypes)) {
            $hasAttachment = true;
            $attachmentName = $fileName;
        } else {
            echo json_encode(["status" => "error", "message" => "Invalid file type. Only PDF and images are allowed."]);
            exit;
        }
    }

    // Configure PHPMailer to send the email using Gmail SMTP (since you are using @gmail.com accounts).
    $mail = new PHPMailer(true);

    try {
        // Server settings — dynamically set per sender account
        $mail->isSMTP();
        $mail->Host       = $smtpHost;       // SMTP host for this sender
        $mail->SMTPAuth   = true;
        $mail->Username   = $from_email;     // Sender email address
        $mail->Password   = $senderPassword; // Password / App Password
        $mail->SMTPSecure = $smtpSecure;     // TLS encryption type
        $mail->Port       = $smtpPort;       // SMTP port

        // Recipients
        $mail->setFrom($from_email, 'EMS System');            // Dynamically set From Address
        $mail->addAddress($recipient);                        // Add a recipient

        // Attachments
        if ($hasAttachment) {
            $mail->addAttachment($fileTmpPath, $attachmentName);
        }

        // Embed Logo
        $logoPath = __DIR__ . '/../../frontend/dist/img/logo.jpg';
        if (!file_exists($logoPath)) {
            $logoPath = __DIR__ . '/../../frontend/public/img/logo.jpg';
        }
        if (file_exists($logoPath)) {
            $mail->addEmbeddedImage($logoPath, 'worktrack_logo');
        }


        // Content
        $mail->isHTML(true);                                  // Set email format to HTML
        $mail->Subject = $subject;
        
        // Wrap the message in a nice HTML template
        $allowed_tags = '<br><b><i><u><strong><em><div><p><span><ul><li><ol><a>';
        $messageHtml = strip_tags($message, $allowed_tags);
        
        $htmlTemplate = "
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {
                    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    background-color: #f4f7f6;
                    color: #333333;
                    margin: 0;
                    padding: 0;
                }
                .email-container {
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    border: 1px solid #f0f0f0;
                }
                .email-header {
                    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
                    color: #ffffff;
                    padding: 24px 30px;
                    text-align: center;
                }
                .email-header img {
                    max-height: 45px;
                    margin-bottom: 10px;
                    border-radius: 4px;
                }
                .email-header h1 {
                    margin: 0;
                    font-size: 22px;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                .email-body {
                    padding: 32px 30px;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #334155;
                }
                .email-footer {
                    background-color: #f8fafc;
                    padding: 24px 30px;
                    text-align: center;
                    font-size: 13px;
                    color: #64748b;
                    border-top: 1px solid #f1f5f9;
                }
            </style>
        </head>
        <body>
            <div class='email-container'>
                <div class='email-header'>
                    <img src='cid:worktrack_logo' alt='WorkTrack Logo' />
                    <h1>WorkTrack</h1>
                </div>
                <div class='email-body'>
                    {$messageHtml}
                </div>
                <div class='email-footer'>
                    &copy; " . date('Y') . " WorkTrack. All rights reserved.<br>
                    This is an automated message, please do not reply.
                </div>
            </div>
        </body>
        </html>
        ";

        $mail->Body    = $htmlTemplate;
        $mail->AltBody = $message;

        $mail->send();
        
        echo json_encode([
            "status" => "success", 
            "message" => "Email has been sent successfully.",
            "details" => [
                "to" => $recipient,
                "subject" => $subject,
                "has_attachment" => $hasAttachment,
                "attachment_name" => $attachmentName
            ]
        ]);
    } catch (Exception $e) {
        echo json_encode([
            "status" => "error", 
            "message" => "Message could not be sent. Mailer Error: {$mail->ErrorInfo}"
        ]);
    }

} else {
    echo json_encode(["status" => "error", "message" => "Invalid request method."]);
}
?>
