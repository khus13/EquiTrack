<?php
/**
 * middleware/RoleMiddleware.php
 * Exact roles, no hierarchy:
 *   'role:admin'              -> admin only
 *   'role:admin,super_admin'  -> either of the two
 */
class RoleMiddleware
{
    private const NEXT = ['user' => 'admin', 'admin' => 'super_admin', 'super_admin' => null];

    public static function handle(string ...$args): void
    {
        $roles = [];
        foreach ($args as $arg) {
            foreach (explode(',', $arg) as $role) $roles[] = trim($role);
        }
        foreach ($roles as $role) {
            if (self::is($role)) return;
        }
        Response::error('You do not have permission to do that.', 403);
    }

    /** True only if the current user's role is exactly $role. */
    private static function is(string $role): bool
    {
        if (!AuthMiddleware::atLeast($role)) return false;
        $next = self::NEXT[$role] ?? null;
        return $next === null || !AuthMiddleware::atLeast($next);
    }
}