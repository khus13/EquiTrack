<?php
/**
 * controllers/UserController.php
 * Super Admin: manages every account.
 * Admin: manages plain "user" accounts only (cannot see admins/super admins,
 * cannot create accounts, cannot change roles).
 */
class UserController
{
    /** Roles that can be assigned. Nobody can create or promote a Super Admin. */
    private const ROLES = ['user', 'admin'];

    /** True when the caller is an admin but not a super admin. */
    private static function adminOnly(): bool
    {
        return !AuthMiddleware::atLeast('super_admin');
    }

    /** Admins may only touch plain users; any other account "does not exist" for them. */
    private static function guardTarget(array $target): void
    {
        if (self::adminOnly() && $target['role'] !== 'user') {
            Response::error('User not found.', 404);
        }
    }

    /** GET /api/users?q=&role=&status=&page=&per_page= */
    public static function index(array $p): never
    {
        [$page, $perPage, $offset] = Paginator::params(10);
        [$rows, $total] = User::paginate([
            'q' => Validator::clean(Request::query('q', '')),
            'role' => self::adminOnly() ? 'user' : Request::query('role'),
            'status' => Request::query('status'),
        ], $perPage, $offset);
        Response::paginated($rows, $total, $page, $perPage);
    }

    /** GET /api/users/{id} */
    public static function show(array $p): never
    {
        $u = User::find((int) $p['id']) ?? Response::error('User not found.', 404);
        self::guardTarget($u);
        Response::ok($u);
    }

    /** POST /api/users  (super admin only, enforced in routes) */
    public static function store(array $p): never
    {
        [$in, $errors] = self::validated(null, true);
        if ($errors) Response::validation($errors);
        $id = User::create($in);
        AuditLog::log((int) AuthMiddleware::user()['id'], 'user.create', 'user', $id, ['email' => $in['email'], 'role' => $in['role']]);
        Response::created(User::find($id), 'User created.');
    }

    /** PUT /api/users/{id} */
    public static function update(array $p): never
    {
        $id = (int) $p['id'];
        $target = User::find($id) ?? Response::error('User not found.', 404);
        self::guardTarget($target);
        [$in, $errors] = self::validated($id, false);

        // Admins can never change a role. A Super Admin's own role is fixed too.
        if (self::adminOnly() || $target['role'] === 'super_admin') {
            $in['role'] = $target['role'];
            unset($errors['role']);
        }
        if ($errors) Response::validation($errors);

        if (AuthMiddleware::user()['role'] !== 'user') {
            Response::error('Admin accounts cannot be deactivated or deleted here.', 403);
        }

        // Nobody may deactivate their own account here.
        if ($id === (int) AuthMiddleware::user()['id'] && $in['status'] !== 'active') {
            Response::error('You cannot deactivate your own account.', 409);
        }

        // Never leave the system without an active Super Admin.
        if ($target['role'] === 'super_admin' && ($in['role'] !== 'super_admin' || $in['status'] !== 'active') && User::countByRole('super_admin') <= 1) {
            Response::error('This is the only active Super Admin and cannot be demoted or deactivated.', 409);
        }
        User::update($id, $in);
        if (!empty($in['password'])) User::setPassword($id, $in['password']);
        AuditLog::log((int) AuthMiddleware::user()['id'], 'user.update', 'user', $id, ['email' => $in['email'], 'role' => $in['role'], 'status' => $in['status']]);
        Response::ok(User::find($id), 'User updated.');
    }

    /** PATCH /api/users/{id}/status   body: {status: active|inactive} */
    public static function setStatus(array $p): never
    {
        $id = (int) $p['id'];
        $target = User::find($id) ?? Response::error('User not found.', 404);
        self::guardTarget($target);
        $status = (string) Request::input('status', '');
        if (!in_array($status, ['active', 'inactive'], true)) Response::validation(['status' => 'Status must be active or inactive.']);
        if ($status === 'inactive' && $id === (int) AuthMiddleware::user()['id']) {
            Response::error('You cannot deactivate your own account.', 409);
        }
        if ($status === 'inactive' && $target['role'] === 'super_admin' && User::countByRole('super_admin') <= 1) {
            Response::error('This is the only active Super Admin.', 409);
        }
        User::setStatus($id, $status);
        AuditLog::log((int) AuthMiddleware::user()['id'], 'user.status', 'user', $id, ['status' => $status]);
        Response::ok(User::find($id), 'Status updated.');
    }

    /** DELETE /api/users/{id} */
    public static function destroy(array $p): never
    {
        $id = (int) $p['id'];
        $me = AuthMiddleware::user();
        $target = User::find($id) ?? Response::error('User not found.', 404);
        self::guardTarget($target);
        if ($id === (int) $me['id']) Response::error('You cannot delete your own account here. Use My Account instead.', 409);
        if ($target['role'] === 'super_admin' && User::countByRole('super_admin') <= 1) Response::error('Cannot delete the only Super Admin.', 409);

        foreach (Database::all('SELECT i.file_path FROM report_images i JOIN reports r ON r.id = i.report_id WHERE r.user_id = ?', [$id]) as $f) {
            Uploader::delete($f['file_path']);
        }
        AuditLog::log((int) $me['id'], 'user.delete', 'user', $id, ['email' => $target['email']]);
        User::delete($id);
        Response::ok(null, 'User deleted.');
    }

    /** Shared validation for create + update. Returns [cleanData, errors]. */
    private static function validated(?int $id, bool $isCreate): array
    {
        $in = [
            'first_name' => Validator::clean(Request::input('first_name')),
            'last_name'  => Validator::clean(Request::input('last_name')),
            'email'      => strtolower(Validator::clean(Request::input('email'))),
            'role'       => (string) Request::input('role', 'user'),
            'status'     => (string) Request::input('status', 'active'),
            'password'   => (string) Request::input('password', ''),
        ];
        $errors = Validator::check($in, [
            'first_name' => 'required|max:80|letters',
            'last_name'  => 'required|max:80|letters',
            'email'      => 'required|email|max:190',
            'role'       => 'required|in:' . implode(',', self::ROLES),
            'status'     => 'required|in:active,inactive',
        ]);
        if (!isset($errors['email']) && User::emailTaken($in['email'], $id)) $errors['email'] = 'That e-mail is already registered.';
        if ($isCreate || $in['password'] !== '') {            // on edit the password is optional
            if ($e = Validator::passwordError($in['password'])) $errors['password'] = $e;
        }
        return [$in, $errors];
    }
}