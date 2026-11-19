<?php
/**
 * controllers/AuthController.php
 * Register, login, logout and "who am I?".
 * Passwords are stored with password_hash() and checked with password_verify().
 */
class AuthController
{
    /** A throw-away hash so a wrong e-mail takes as long as a wrong password (prevents user enumeration by timing). */
    private const DUMMY_HASH = '$2y$10$1LFwndl5iDbDGBkdYgoz2eGvhiedRoxhjnWiV6YlehWSSSYkgYVWW';

    /** What we send back to the browser about the session. */
    private static function session(?array $user): array
    {
        return ['user' => $user, 'csrf_token' => CsrfMiddleware::token()];
    }

    /** GET /api/auth/me   (also hands out the CSRF token, even when logged out) */
    public static function me(array $p): never
    {
        Response::ok(self::session(AuthMiddleware::user()));
    }

    /** GET /api/auth/csrf */
    public static function csrf(array $p): never
    {
        Response::ok(['csrf_token' => CsrfMiddleware::token()]);
    }

    /** POST /api/auth/register */
    public static function register(array $p): never
    {
        $in = [
            'first_name' => Validator::clean(Request::input('first_name')),
            'last_name'  => Validator::clean(Request::input('last_name')),
            'email'      => strtolower(Validator::clean(Request::input('email'))),
        ];
        $password = (string) Request::input('password', '');
        $confirm  = (string) Request::input('confirm_password', '');

        $errors = Validator::check($in, [
            'first_name' => 'required|max:80|letters',
            'last_name'  => 'required|max:80|letters',
            'email'      => 'required|email|max:190',
        ]);
        if (!isset($errors['email'])) {
            $domains = config('auth.email_domains');
            if ($domains && !in_array(substr(strrchr($in['email'], '@'), 1), $domains, true)) {
                $errors['email'] = 'Please use your university e-mail (' . implode(', ', array_map(fn($d) => "@$d", $domains)) . ').';
            } elseif (User::emailTaken($in['email'])) {
                $errors['email'] = 'That e-mail is already registered.';
            }
        }
        if ($e = Validator::passwordError($password)) $errors['password'] = $e;
        if ($password !== $confirm) $errors['confirm_password'] = 'Passwords do not match.';
        if ($errors) Response::validation($errors);

        $id = User::create($in + ['password' => $password, 'role' => 'user']);
        self::startSession($id);
        AuditLog::log($id, 'auth.register', 'user', $id);
        Response::created(self::session(User::find($id)), 'Account created. Welcome to EquiTrack!');
    }

    /** POST /api/auth/login */
    public static function login(array $p): never
    {
        $email    = strtolower(Validator::clean(Request::input('email')));
        $password = (string) Request::input('password', '');
        $errors = Validator::check(['email' => $email, 'password' => $password], ['email' => 'required|email', 'password' => 'required']);
        if ($errors) Response::validation($errors);

        // Brute-force guard: 10 failed attempts from one IP within 15 minutes -> 429.
        $since = date('Y-m-d H:i:s', time() - 900);
        $failed = (int) Database::value("SELECT COUNT(*) FROM audit_logs WHERE action = 'auth.login_failed' AND ip_address = ? AND created_at >= ?", [Request::ip(), $since]);
        if ($failed >= 10) {
            Response::error('Too many failed attempts. Please try again in 15 minutes.', 429);
        }

        $user = User::findByEmailWithHash($email);
        $ok   = password_verify($password, $user['password_hash'] ?? self::DUMMY_HASH);
        if (!$user || !$ok) {
            AuditLog::log($user['id'] ?? null, 'auth.login_failed', 'user', $user['id'] ?? null, ['email' => $email]);
            Response::error('Invalid e-mail or password.', 401);
        }
        if ($user['status'] !== 'active') {
            Response::error('This account is deactivated. Please contact an administrator.', 403);
        }
        // upgrade old hashes automatically when PHP's default algorithm gets stronger
        if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
            User::setPassword((int) $user['id'], $password);
        }

        self::startSession((int) $user['id']);
        AuditLog::log((int) $user['id'], 'auth.login', 'user', (int) $user['id']);
        Response::ok(self::session(User::find((int) $user['id'])), 'Signed in.');
    }

    /** POST /api/auth/logout */
    public static function logout(array $p): never
    {
        $u = AuthMiddleware::user();
        if ($u) AuditLog::log((int) $u['id'], 'auth.logout', 'user', (int) $u['id']);
        $_SESSION = [];
        session_regenerate_id(true);
        CsrfMiddleware::rotate();
        Response::ok(self::session(null), 'Signed out.');
    }

    /** Log a user in: new session id (stops session fixation) + new CSRF token. */
    public static function startSession(int $userId): void
    {
        session_regenerate_id(true);
        $_SESSION = ['user_id' => $userId];
        CsrfMiddleware::rotate();
    }
}
