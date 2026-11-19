<?php
/**
 * middleware/CsrfMiddleware.php
 * CSRF protection (synchronizer-token pattern).
 *   - The server keeps a random token in the session.
 *   - The React app reads it (GET /api/auth/csrf) and sends it back in the
 *     "X-CSRF-Token" header on every POST / PUT / PATCH / DELETE.
 *   - A malicious site cannot read our token, so its forged requests fail.
 */
class CsrfMiddleware
{
    /** Get (or create) the token for this session. */
    public static function token(): string
    {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['csrf_token'];
    }

    /** Replace the token (called after login/logout). */
    public static function rotate(): string
    {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        return $_SESSION['csrf_token'];
    }

    public static function handle(): void
    {
        if (in_array(Request::method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;                                   // reading data is safe
        }
        $sent = Request::header('X-CSRF-Token') ?? '';
        if ($sent === '' || !hash_equals(self::token(), $sent)) {   // hash_equals = timing-safe compare
            Response::error('Security token missing or expired. Please refresh the page.', 419);
        }
    }
}
