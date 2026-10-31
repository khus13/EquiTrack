<?php
/**
 * backend/scripts/create_user.php  -  create an account from the command line.
 * Use it to make your REAL Super Admin before you delete the demo accounts.
 *
 *   php backend/scripts/create_user.php  super_admin  you@usc.edu.ph  "StrongPass123"  "First" "Last"
 *   roles: user | admin | super_admin
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }        // never runnable from the browser

require __DIR__ . '/../config/config.php';
foreach (['config/Database', 'helpers/Validator', 'models/User'] as $f) require __DIR__ . "/../$f.php";

[$self, $role, $email, $password, $first, $last] = array_pad($argv, 6, null);
if (!$role || !$email || !$password || !$first || !$last) {
    fwrite(STDERR, "Usage: php create_user.php <role> <email> <password> <first> <last>\n");
    exit(1);
}
$errors = Validator::check(['email' => $email, 'role' => $role], ['email' => 'required|email', 'role' => 'required|in:user,admin,super_admin']);
if ($pe = Validator::passwordError($password)) $errors['password'] = $pe;
if (User::emailTaken(strtolower($email))) $errors['email'] = 'E-mail already registered.';
if ($errors) { foreach ($errors as $k => $v) fwrite(STDERR, "$k: $v\n"); exit(1); }

$id = User::create(['first_name' => $first, 'last_name' => $last, 'email' => strtolower($email), 'password' => $password, 'role' => $role]);
echo "Created $role #$id ($email)\n";
