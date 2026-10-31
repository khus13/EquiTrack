<?php
/**
 * middleware/AuthMiddleware.php
 * Makes sure someone is logged in (a valid PHP session) and their account is active.
 * Role hierarchy:  user (1)  <  admin (2)  <  super_admin (3)
 */
class AuthMiddleware
{
    public const LEVELS = ['user' => 1, 'admin' => 2, 'super_admin' => 3];

    private static ?array $current = null;

    /** The logged-in user row (with role name) or null. Cached per request. */
    public static function user(): ?array
    {
        if (self::$current !== null) {
            return self::$current;
        }
        $id = $_SESSION['user_id'] ?? null;
        if (!$id) {
            return null;
        }
        $user = User::find((int) $id);
        // account deleted or deactivated after login -> kill the session
        if ($user === null || $user['status'] !== 'active') {
            $_SESSION = [];
            return null;
        }
        return self::$current = $user;
    }

    /** Use as middleware: stops with 401 when not logged in. */
    public static function handle(): void
    {
        if (self::user() === null) {
            Response::error('Please sign in to continue.', 401);
        }
    }

    /** True when the current user's role is at least $role. */
    public static function atLeast(string $role): bool
    {
        $u = self::user();
        return $u !== null && (self::LEVELS[$u['role']] ?? 0) >= (self::LEVELS[$role] ?? 99);
    }
}
