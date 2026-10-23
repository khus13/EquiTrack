<?php
require __DIR__ . '/../bootstrap.php';
require_method('POST');

$in = body();
$first = trim((string)($in['first_name'] ?? ''));
$last = trim((string)($in['last_name'] ?? ''));
$email = strtolower(trim((string)($in['email'] ?? '')));
$pass = (string)($in['password'] ?? '');
$confirm = (string)($in['confirm_password'] ?? '');

if ($first === '' || $last === '' || $email === '' || $pass === '') {
    fail('Please fill out all fields.');
}
if (mb_strlen($first) > 60 || mb_strlen($last) > 60) {
    fail('Names must be 60 characters or fewer.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 150) {
    fail('Please enter a valid email address.');
}
if (strlen($pass) < 8) {
    fail('Password must be at least 8 characters.');
}
if ($pass !== $confirm) {
    fail('Passwords do not match.');
}

$stmt = db()->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    fail('An account with that email already exists.', 409);
}

$hash = password_hash($pass, PASSWORD_DEFAULT);
db()->prepare('INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?,?,?,?)')
    ->execute([$first, $last, $email, $hash]);

session_regenerate_id(true);
$_SESSION['uid'] = (int)db()->lastInsertId();

json_out(['user' => current_user()], 201);
