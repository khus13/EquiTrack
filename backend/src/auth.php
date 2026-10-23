<?php
function auth_register(): void {
    $d = body();
    $first = trim($d['first_name'] ?? '');
    $last  = trim($d['last_name'] ?? '');
    $email = strtolower(trim($d['email'] ?? ''));
    $pass  = (string)($d['password'] ?? '');
    $conf  = (string)($d['confirm_password'] ?? '');
    $e = [];
    if ($first === '') $e['first_name'] = 'First name is required.';
    if ($last === '')  $e['last_name'] = 'Last name is required.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $e['email'] = 'Enter a valid email address.';
    else if ($domains = config()['allowed_email_domains']) {
        if (!in_array(substr(strrchr($email, '@'), 1), $domains, true))
            $e['email'] = 'Please use your university email.';
    }
    if (strlen($pass) < 8) $e['password'] = 'Password must be at least 8 characters.';
    if ($pass !== $conf)   $e['confirm_password'] = 'Passwords do not match.';
    if ($e) fail('Please fix the highlighted fields.', 422, $e);

    $s = db()->prepare('SELECT 1 FROM users WHERE email = ?');
    $s->execute([$email]);
    if ($s->fetch()) fail('Please fix the highlighted fields.', 422, ['email' => 'That email is already registered.']);

    $s = db()->prepare('INSERT INTO users (first_name,last_name,email,password_hash) VALUES (?,?,?,?)');
    $s->execute([$first, $last, $email, password_hash($pass, PASSWORD_BCRYPT)]);
    session_regenerate_id(true);
    $_SESSION['uid'] = (int)db()->lastInsertId();
    json_out(['user' => current_user()], 201);
}

function auth_login(): void {
    $d = body();
    $email = strtolower(trim($d['email'] ?? ''));
    $s = db()->prepare('SELECT * FROM users WHERE email = ?');
    $s->execute([$email]);
    $u = $s->fetch();
    if (!$u || !password_verify((string)($d['password'] ?? ''), $u['password_hash']))
        fail('Invalid email or password.', 401);
    session_regenerate_id(true);
    $_SESSION['uid'] = (int)$u['id'];
    json_out(['user' => current_user()]);
}

function auth_logout(): void {
    $_SESSION = [];
    session_destroy();
    json_out(['ok' => true]);
}

function auth_me(): void {
    json_out(['user' => current_user()]);
}
