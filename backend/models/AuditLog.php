<?php
/**
 * models/AuditLog.php
 * Writes and reads the audit trail (who did what, when, from which IP).
 */
class AuditLog
{
    /** Record one event. Failures here must never break the real request. */
    public static function log(?int $userId, string $action, ?string $entityType = null, ?int $entityId = null, array $details = []): void
    {
        try {
            Database::run(
                'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?,?,?,?,?,?)',
                [$userId, $action, $entityType, $entityId,
                 $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null, Request::ip()]);
        } catch (Throwable $e) {
            error_log('[EquiTrack] audit log failed: ' . $e->getMessage());
        }
    }

    public static function paginate(array $f, int $limit, int $offset): array
    {
        $where = []; $args = [];
        if (!empty($f['q'])) {
            $like = Paginator::like($f['q']);
            $where[] = "(a.action LIKE ? ESCAPE '!' OR a.details LIKE ? ESCAPE '!' OR u.email LIKE ? ESCAPE '!')";
            array_push($args, $like, $like, $like);
        }
        if (!empty($f['action']))      { $where[] = 'a.action LIKE ?';  $args[] = $f['action'] . '%'; }   // "report." matches all report actions
        if (!empty($f['entity_type'])) { $where[] = 'a.entity_type = ?'; $args[] = $f['entity_type']; }
        if (!empty($f['user_id']))     { $where[] = 'a.user_id = ?';     $args[] = (int) $f['user_id']; }
        if (!empty($f['from']))        { $where[] = 'a.created_at >= ?'; $args[] = $f['from'] . ' 00:00:00'; }
        if (!empty($f['to']))          { $where[] = 'a.created_at <= ?'; $args[] = $f['to'] . ' 23:59:59'; }
        $w = $where ? ' WHERE ' . implode(' AND ', $where) : '';

        $from  = ' FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id';
        $total = (int) Database::value('SELECT COUNT(*)' . $from . $w, $args);
        $rows  = Database::all(
            'SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.details, a.ip_address, a.created_at,
                    u.first_name, u.last_name, u.email' . $from . $w .
            " ORDER BY a.created_at DESC, a.id DESC LIMIT $limit OFFSET $offset", $args);

        foreach ($rows as &$r) {
            $r['user_name'] = $r['user_id'] ? trim($r['first_name'] . ' ' . $r['last_name']) : null;
            $r['details']   = $r['details'] ? json_decode($r['details'], true) : null;
            unset($r['first_name'], $r['last_name']);
        }
        return [$rows, $total];
    }
}
