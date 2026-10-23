<?php
// Usage: php backend/scripts/create_admin.php admin@usc.edu.ph "StrongPassword" "First" "Last"
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }

$_SERVER['REQUEST_METHOD'] = 'CLI';
$config = require __DIR__ . '/../config.php';

[$_, $email, $pass, $first, $last] = array_pad($argv, 5, null);
if (!$email || !$pass) {
    fwrite(STDERR, "Usage: php create_admin.php <email> <password> [first] [last]\n");
    exit(1);
}
if (strlen($pass) < 8) { fwrite(STDERR, "Password must be at least 8 characters.\n"); exit(1); }

$pdo = new PDO(
    "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
    $config['db_user'], $config['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$stmt = $pdo->prepare("INSERT INTO users (first_name,last_name,email,password_hash,role) VALUES (?,?,?,?, 'admin')
                       ON DUPLICATE KEY UPDATE role='admin', password_hash=VALUES(password_hash)");
$stmt->execute([$first ?: 'Admin', $last ?: 'User', strtolower($email), password_hash($pass, PASSWORD_DEFAULT)]);
echo "Admin ready: $email\n";
