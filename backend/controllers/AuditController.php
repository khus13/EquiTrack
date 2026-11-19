<?php
/**
 * controllers/AuditController.php   (Super Admin only)
 */
class AuditController
{
    /** GET /api/audit-logs?q=&action=&entity_type=&user_id=&from=&to=&page= */
    public static function index(array $p): never
    {
        [$page, $perPage, $offset] = Paginator::params(15);
        $date = fn($v) => is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : null;
        [$rows, $total] = AuditLog::paginate([
            'q'           => Validator::clean(Request::query('q', '')),
            'action'      => Validator::clean(Request::query('action', '')),
            'entity_type' => Validator::clean(Request::query('entity_type', '')),
            'user_id'     => Request::query('user_id'),
            'from'        => $date(Request::query('from')),
            'to'          => $date(Request::query('to')),
        ], $perPage, $offset);
        Response::paginated($rows, $total, $page, $perPage);
    }
}
