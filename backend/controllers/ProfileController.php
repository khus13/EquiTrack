<?php
/**
 * controllers/ProfileController.php
 * "My Account" actions for the logged-in user: edit name/e-mail, change password,
 * deactivate or delete their own account.
 */
class ProfileController
{
    /** PATCH /api/profile */
    public static function update(array $p): never
    {
        $me = AuthMiddleware::user();
        $in = [
            'first_name' => Validator::clean(Request::input('first_name')),
            'last_name'  => Validator::clean(Request::input('last_name')),
            'email'      => strtolower(Validator::clean(Request::input('email'))),
        ];
        $errors = Validator::check($in, [
            'first_name' => 'required|max:80|letters',
            'last_name'  => 'required|max:80|letters',
            'email'      => 'required|email|max:190',
        ]);
        if (!isset($errors['email']) && User::emailTaken($in['email'], (int) $me['id'])) {
            $errors['email'] = 'That e-mail is already registered.';
        }
        if ($errors) Response::validation($errors);

        User::update((int) $me['id'], $in);
        AuditLog::log((int) $me['id'], 'profile.update', 'user', (int) $me['id']);
        Response::ok(['user' => User::find((int) $me['id'])], 'Profile updated.');
    }

    /** PATCH /api/profile/password */
    public static function changePassword(array $p): never
    {
        $me = AuthMiddleware::user();
        $current = (string) Request::input('current_password', '');
        $new     = (string) Request::input('new_password', '');
        $confirm = (string) Request::input('confirm_password', '');

        $errors = [];
        if (!password_verify($current, (string) User::passwordHash((int) $me['id']))) $errors['current_password'] = 'Current password is incorrect.';
        if ($e = Validator::passwordError($new)) $errors['new_password'] = $e;
        elseif ($new === $current) $errors['new_password'] = 'Choose a password different from the current one.';
        if ($new !== $confirm) $errors['confirm_password'] = 'Passwords do not match.';
        if ($errors) Response::validation($errors);

        User::setPassword((int) $me['id'], $new);
        AuditLog::log((int) $me['id'], 'profile.password_change', 'user', (int) $me['id']);
        Response::ok(null, 'Password changed.');
    }

    /** POST /api/profile/deactivate  (temporarily disable own account) */
    public static function deactivate(array $p): never
    {
        $me = self::confirmPassword();
        self::guardLastSuperAdmin($me);
        User::setStatus((int) $me['id'], 'inactive');
        AuditLog::log((int) $me['id'], 'profile.deactivate', 'user', (int) $me['id']);
        $_SESSION = [];
        session_regenerate_id(true);
        Response::ok(['csrf_token' => CsrfMiddleware::rotate()], 'Account deactivated. Ask an administrator to reactivate it.');
    }

    /** DELETE /api/profile  (permanently delete own account and their reports) */
    public static function destroy(array $p): never
    {
        $me = self::confirmPassword();
        self::guardLastSuperAdmin($me);
        // remove photo files first, then the rows (reports are deleted by ON DELETE CASCADE)
        foreach (Database::all('SELECT i.file_path FROM report_images i JOIN reports r ON r.id = i.report_id WHERE r.user_id = ?', [$me['id']]) as $f) {
            Uploader::delete($f['file_path']);
        }
        AuditLog::log((int) $me['id'], 'profile.delete', 'user', (int) $me['id'], ['email' => $me['email']]);
        User::delete((int) $me['id']);
        $_SESSION = [];
        session_regenerate_id(true);
        Response::ok(['csrf_token' => CsrfMiddleware::rotate()], 'Your account has been deleted.');
    }

    /** Dangerous actions must be confirmed with the password. */
    private static function confirmPassword(): array
    {
        $me = AuthMiddleware::user();
        $pw = (string) Request::input('password', '');
        if (!password_verify($pw, (string) User::passwordHash((int) $me['id']))) {
            Response::validation(['password' => 'Password is incorrect.']);
        }
        return $me;
    }

    private static function guardLastSuperAdmin(array $me): void
    {
        if ($me['role'] === 'super_admin' && User::countByRole('super_admin') <= 1) {
            Response::error('You are the only Super Admin. Create another one first.', 409);
        }
    }
}
