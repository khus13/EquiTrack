<?php
/**
 * middleware/RoleMiddleware.php
 * Used after AuthMiddleware:  'role:admin'  means "admin or super_admin".
 */
class RoleMiddleware
{
    public static function handle(string $minimumRole): void
    {
        if (!AuthMiddleware::atLeast($minimumRole)) {
            Response::error('You do not have permission to do that.', 403);   // 403 = logged in but not allowed
        }
    }
}
