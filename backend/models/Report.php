<?php
/**
 * models/Report.php
 * Reports + their images + the status history (timeline).
 */
class Report
{
    public const STATUSES   = ['Pending', 'In Progress', 'Solved'];
    public const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

    /** Columns shown in lists (joins give us readable names instead of ids). */
    private const LIST_SELECT = "SELECT r.id, r.reference_no, r.item_name, r.priority, r.status, r.created_at, r.updated_at,
            r.user_id, r.equipment_id, r.category_id, r.campus_id, r.building_id, r.room_id, r.location_note,
            c.name AS category_name, cp.name AS campus_name, b.name AS building_name, rm.name AS room_name,
            d.name AS damage_type_name, u.first_name AS reporter_first, u.last_name AS reporter_last, u.email AS reporter_email,
            (SELECT MIN(i.id) FROM report_images i WHERE i.report_id = r.id) AS image_id
        FROM reports r
        JOIN categories c    ON c.id  = r.category_id
        JOIN campuses cp     ON cp.id = r.campus_id
        JOIN buildings b     ON b.id  = r.building_id
        JOIN rooms rm        ON rm.id = r.room_id
        JOIN damage_types d  ON d.id  = r.damage_type_id
        JOIN users u         ON u.id  = r.user_id";

    private const COUNT_FROM = " FROM reports r
        JOIN buildings b ON b.id = r.building_id
        JOIN rooms rm    ON rm.id = r.room_id
        JOIN users u     ON u.id = r.user_id";

    /** Sort options the client may choose (whitelist -> no SQL injection through ?sort=). */
    private const SORTS = [
        'created_at' => 'r.created_at',
        'updated_at' => 'r.updated_at',
        'item_name'  => 'r.item_name',
        'status'     => "CASE r.status WHEN 'Pending' THEN 1 WHEN 'In Progress' THEN 2 ELSE 3 END",
        'priority'   => "CASE r.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END",
    ];

    private static function present(array $r): array
    {
        $r['reporter_name'] = trim(($r['reporter_first'] ?? '') . ' ' . ($r['reporter_last'] ?? ''));
        unset($r['reporter_first'], $r['reporter_last']);
        $r['image_id'] = $r['image_id'] !== null ? (int) $r['image_id'] : null;
        return $r;
    }

    /** Build the WHERE part shared by the list and the count query. */
    private static function where(array $f): array
    {
        $where = []; $args = [];
        if (!empty($f['user_id'])) { $where[] = 'r.user_id = ?'; $args[] = (int) $f['user_id']; }
        if (!empty($f['q'])) {
            $like = Paginator::like($f['q']);
            $where[] = "(r.item_name LIKE ? ESCAPE '!' OR r.reference_no LIKE ? ESCAPE '!' OR r.description LIKE ? ESCAPE '!'
                        OR b.name LIKE ? ESCAPE '!' OR rm.name LIKE ? ESCAPE '!' OR u.email LIKE ? ESCAPE '!'
                        OR u.first_name LIKE ? ESCAPE '!' OR u.last_name LIKE ? ESCAPE '!')";
            array_push($args, $like, $like, $like, $like, $like, $like, $like, $like);
        }
        if (!empty($f['status']))   { $where[] = 'r.status = ?';   $args[] = $f['status']; }
        if (!empty($f['priority'])) { $where[] = 'r.priority = ?'; $args[] = $f['priority']; }
        foreach (['category_id' => 'r.category_id', 'campus_id' => 'r.campus_id', 'building_id' => 'r.building_id', 'equipment_id' => 'r.equipment_id'] as $k => $col) {
            if (!empty($f[$k])) { $where[] = "$col = ?"; $args[] = (int) $f[$k]; }
        }
        if (!empty($f['open_only'])) { $where[] = "r.status <> 'Solved'"; }
        if (!empty($f['from'])) { $where[] = 'r.created_at >= ?'; $args[] = $f['from'] . ' 00:00:00'; }
        if (!empty($f['to']))   { $where[] = 'r.created_at <= ?'; $args[] = $f['to'] . ' 23:59:59'; }
        return [$where ? ' WHERE ' . implode(' AND ', $where) : '', $args];
    }

    public static function paginate(array $f, int $limit, int $offset): array
    {
        [$w, $args] = self::where($f);
        $sortKey = self::SORTS[$f['sort'] ?? ''] ?? self::SORTS['created_at'];
        $dir     = strtolower($f['dir'] ?? 'desc') === 'asc' ? 'ASC' : 'DESC';

        $total = (int) Database::value('SELECT COUNT(*)' . self::COUNT_FROM . $w, $args);
        $rows  = Database::all(self::LIST_SELECT . $w . " ORDER BY $sortKey $dir, r.id DESC LIMIT $limit OFFSET $offset", $args);
        return [array_map([self::class, 'present'], $rows), $total];
    }

    /** The admin "To Repair" list: open reports, most urgent first, oldest first within a priority. */
    public static function toRepair(int $limit = 8): array
    {
        $rows = Database::all(self::LIST_SELECT . " WHERE r.status <> 'Solved' ORDER BY " . self::SORTS['priority'] . ", r.created_at ASC LIMIT " . (int) $limit);
        return array_map([self::class, 'present'], $rows);
    }

    public static function recent(int $limit = 5, ?int $userId = null): array
    {
        $w = $userId ? ' WHERE r.user_id = ' . (int) $userId : '';
        return array_map([self::class, 'present'], Database::all(self::LIST_SELECT . $w . ' ORDER BY r.created_at DESC, r.id DESC LIMIT ' . (int) $limit));
    }

    /** One report with everything: description, remarks, images and the timeline. */
    public static function find(int $id): ?array
    {
        $r = Database::one(self::LIST_SELECT . ' WHERE r.id = ?', [$id]);
        if ($r === null) return null;
        $r = self::present($r);

        $extra = Database::one(
            'SELECT r.description, r.remarks, r.resolved_at, r.resolved_by, e.name AS equipment_name, e.asset_tag,
                    rb.first_name AS rb_first, rb.last_name AS rb_last
             FROM reports r LEFT JOIN equipment e ON e.id = r.equipment_id LEFT JOIN users rb ON rb.id = r.resolved_by
             WHERE r.id = ?', [$id]);
        $r['description']    = $extra['description'];
        $r['remarks']        = $extra['remarks'];
        $r['resolved_at']    = $extra['resolved_at'];
        $r['equipment_name'] = $extra['equipment_name'];
        $r['asset_tag']      = $extra['asset_tag'];
        $r['resolved_by_name'] = $extra['rb_first'] ? trim($extra['rb_first'] . ' ' . $extra['rb_last']) : null;

        $r['images'] = Database::all('SELECT id, original_name, mime_type FROM report_images WHERE report_id = ? ORDER BY id', [$id]);
        $r['history'] = Database::all(
            'SELECT h.id, h.old_status, h.new_status, h.remarks, h.created_at, h.changed_by,
                    u.first_name, u.last_name
             FROM report_status_history h LEFT JOIN users u ON u.id = h.changed_by
             WHERE h.report_id = ? ORDER BY h.created_at ASC, h.id ASC', [$id]);
        foreach ($r['history'] as &$h) {
            $h['changed_by_name'] = $h['first_name'] ? trim($h['first_name'] . ' ' . $h['last_name']) : 'System';
            unset($h['first_name'], $h['last_name']);
        }
        return $r;
    }

    public static function ownerId(int $id): ?int
    {
        $v = Database::value('SELECT user_id FROM reports WHERE id = ?', [$id]);
        return $v === null ? null : (int) $v;
    }

    /** Insert the report, its photo and the first timeline entry in ONE transaction. */
    public static function create(array $d, int $userId, ?array $image): int
    {
        $pdo = Database::pdo();
        $pdo->beginTransaction();
        try {
            $id = Database::insert(
                'INSERT INTO reports (user_id, equipment_id, item_name, category_id, campus_id, building_id, room_id,
                                      location_note, damage_type_id, description, priority, status)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
                [$userId, $d['equipment_id'], $d['item_name'], $d['category_id'], $d['campus_id'], $d['building_id'],
                 $d['room_id'], $d['location_note'], $d['damage_type_id'], $d['description'], $d['priority'], 'Pending']);

            Database::run('UPDATE reports SET reference_no = ? WHERE id = ?',
                [sprintf('ET-%s-%06d', date('Y'), $id), $id]);

            if ($image !== null) {
                Database::run('INSERT INTO report_images (report_id, file_path, original_name, mime_type, file_size) VALUES (?,?,?,?,?)',
                    [$id, $image['file_path'], $image['original_name'], $image['mime_type'], $image['file_size']]);
            }
            Database::run('INSERT INTO report_status_history (report_id, old_status, new_status, changed_by, remarks) VALUES (?,?,?,?,?)',
                [$id, null, 'Pending', $userId, 'Report submitted']);

            Equipment::syncStatus($d['equipment_id']);
            $pdo->commit();
            return $id;
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /** Change status, remember who did it and why (history), and keep the equipment status in sync. */
    public static function changeStatus(int $id, string $newStatus, int $adminId, ?string $remarks): void
    {
        $row = Database::one('SELECT status, equipment_id FROM reports WHERE id = ?', [$id]);
        $now = date('Y-m-d H:i:s');
        $pdo = Database::pdo();
        $pdo->beginTransaction();
        try {
            Database::run(
                'UPDATE reports SET status = ?, remarks = ?, updated_at = ?, resolved_by = ?, resolved_at = ? WHERE id = ?',
                [$newStatus, $remarks, $now,
                 $newStatus === 'Solved' ? $adminId : null,     // reopening clears the "solved by" info
                 $newStatus === 'Solved' ? $now : null, $id]);
            Database::run('INSERT INTO report_status_history (report_id, old_status, new_status, changed_by, remarks) VALUES (?,?,?,?,?)',
                [$id, $row['status'], $newStatus, $adminId, $remarks]);
            Equipment::syncStatus($row['equipment_id'] ? (int) $row['equipment_id'] : null);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    /** Delete a report and its photo files. */
    public static function delete(int $id): void
    {
        $equipmentId = Database::value('SELECT equipment_id FROM reports WHERE id = ?', [$id]);
        $files = Database::all('SELECT file_path FROM report_images WHERE report_id = ?', [$id]);
        Database::run('DELETE FROM reports WHERE id = ?', [$id]);     // images + history go too (ON DELETE CASCADE)
        foreach ($files as $f) Uploader::delete($f['file_path']);
        Equipment::syncStatus($equipmentId ? (int) $equipmentId : null);
    }

    public static function image(int $imageId): ?array
    {
        return Database::one(
            'SELECT i.id, i.file_path, i.mime_type, i.original_name, r.user_id
             FROM report_images i JOIN reports r ON r.id = i.report_id WHERE i.id = ?', [$imageId]);
    }
}
