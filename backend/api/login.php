<?php
require __DIR__ . '/../bootstrap.php';
require_method('POST');

$in = body();
$email = strtolower(trim((string)($in['email'] ?? '')));
$pass = (string)($in['password'] ?? '');

if ($email === '' || $pass === '') {
    fail('Enter your email and password.');
}

$stmt = db()->prepare('SELECT id, password_hash FROM users WHERE email = ?');
$stmt->execute([$email]);
$row = $stmt->fetch();

// Same message for unknown email / wrong password to avoid account enumeration.
if (!$row || !password_verify($pass, $row['password_hash'])) {
    fail('Incorrect email or password.', 401);
}

session_regenerate_id(true);
$_SESSION['uid'] = (int)$row['id'];

json_out(['user' => current_user()]);
