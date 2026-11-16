<?php
/**
 * models/Equipment.php
 * The equipment / asset directory.
 */
class Equipment
{
    private const SELECT = "SELECT e.id, e.asset_tag, e.name, e.status, e.description, e.created_at,
            e.category_id, e.type_id, e.room_id,
            c.name AS category_name, t.name AS type_name,
            rm.name AS room_name, rm.building_id, b.name AS building_name,
            b.campus_id, cp.name AS campus_name,
            (SELECT i.id FROM reports r JOIN report_images i ON i.report_id = r.id
                WHERE r.equipment_id = e.id
                ORDER BY CASE WHEN r.status <> 'Solved' THEN 0 ELSE 1 END, r.created_at DESC, r.id DESC, i.id ASC
                LIMIT 1) AS image_id,
            (SELECT COUNT(*) FROM reports r WHERE r.equipment_id = e.id AND r.status <> 'Solved') AS open_reports,
            (SELECT r.id FROM reports r
                WHERE r.equipment_id = e.id
                ORDER BY r.created_at DESC, r.id DESC
                LIMIT 1) AS latest_report_id
        FROM equipment e
        JOIN categories c ON c.id = e.category_id
        LEFT JOIN equipment_types t ON t.id = e.type_id
        JOIN rooms rm     ON rm.id = e.room_id
        JOIN buildings b  ON b.id = rm.building_id
        JOIN campuses cp  ON cp.id = b.campus_id";

    public static function find(int $id): ?array
    {
        $row = Database::one(self::SELECT . ' WHERE e.id = ?', [$id]);
        return $row ? self::cast($row) : null;
    }

    private static function cast(array $r): array
    {
        $r['open_reports'] = (int) $r['open_reports'];
        $r['image_id'] = $r['image_id'] !== null ? (int) $r['image_id'] : null;
        $r['latest_report_id'] = $r['latest_report_id'] !== null ? (int) $r['latest_report_id'] : null;
        return $r;
    }

    public static function directoryImage(int $equipmentId): ?array
    {
        return Database::one(
            "SELECT i.id, i.file_path, i.mime_type, i.original_name
             FROM report_images i
             JOIN reports r ON r.id = i.report_id
             WHERE r.equipment_id = ?
             ORDER BY CASE WHEN r.status <> 'Solved' THEN 0 ELSE 1 END, r.created_at DESC, r.id DESC, i.id ASC
             LIMIT 1",
            [$equipmentId]
        );
    }

    public static function matchReport(array $report): ?int
    {
        $matches = Database::all(
            "SELECT e.id
             FROM equipment e
             JOIN rooms rm ON rm.id = e.room_id
             JOIN buildings b ON b.id = rm.building_id
             WHERE lower(trim(e.name)) = lower(trim(?))
               AND e.category_id = ?
               AND b.campus_id = ?
               AND b.id = ?
               AND e.room_id = ?
             LIMIT 2",
            [$report['item_name'], $report['category_id'], $report['campus_id'], $report['building_id'], $report['room_id']]
        );
        return count($matches) === 1 ? (int) $matches[0]['id'] : null;
    }

    public static function paginate(array $f, int $limit, int $offset): array
    {
        $where = []; $args = [];
        if (!empty($f['q'])) {
            $like = Paginator::like($f['q']);
            $where[] = "(e.name LIKE ? ESCAPE '!' OR e.asset_tag LIKE ? ESCAPE '!' OR rm.name LIKE ? ESCAPE '!' OR b.name LIKE ? ESCAPE '!')";
            array_push($args, $like, $like, $like, $like);
        }
        foreach (['category_id' => 'e.category_id', 'type_id' => 'e.type_id', 'building_id' => 'b.id', 'campus_id' => 'b.campus_id', 'room_id' => 'e.room_id'] as $key => $col) {
            if (!empty($f[$key])) { $where[] = "$col = ?"; $args[] = (int) $f[$key]; }
        }
        if (!empty($f['status'])) { $where[] = 'e.status = ?'; $args[] = $f['status']; }
        $w = $where ? ' WHERE ' . implode(' AND ', $where) : '';

        $count = 'SELECT COUNT(*) FROM equipment e JOIN rooms rm ON rm.id = e.room_id JOIN buildings b ON b.id = rm.building_id';
        $total = (int) Database::value($count . $w, $args);
        $rows  = Database::all(self::SELECT . $w . " ORDER BY e.updated_at DESC, e.id DESC LIMIT $limit OFFSET $offset", $args);
        return [array_map([self::class, 'cast'], $rows), $total];
    }

    public static function assetTagTaken(string $tag, ?int $exceptId = null): bool
    {
        return (bool) Database::value('SELECT 1 FROM equipment WHERE asset_tag = ? AND id <> ?', [$tag, $exceptId ?? 0]);
    }

    public static function create(array $d): int
    {
        return Database::insert(
            'INSERT INTO equipment (asset_tag, name, category_id, type_id, room_id, status, description) VALUES (?,?,?,?,?,?,?)',
            [$d['asset_tag'], $d['name'], $d['category_id'], $d['type_id'], $d['room_id'], $d['status'], $d['description']]);
    }

    public static function createFromReport(array $report, int $reportId): int
    {
        $assetTag = sprintf('RPT-%s-%06d', date('Y'), $reportId);
        if (self::assetTagTaken($assetTag)) {
            $assetTag .= '-' . strtoupper(bin2hex(random_bytes(4)));
        }

        return Database::insert(
            'INSERT INTO equipment (asset_tag, name, category_id, type_id, room_id, status, description) VALUES (?,?,?,?,?,?,?)',
            [$assetTag, $report['item_name'], $report['category_id'], null, $report['room_id'], 'needs_repair', null]
        );
    }

    public static function update(int $id, array $d): void
    {
        Database::run(
            'UPDATE equipment SET asset_tag=?, name=?, category_id=?, type_id=?, room_id=?, status=?, description=?, updated_at=? WHERE id=?',
            [$d['asset_tag'], $d['name'], $d['category_id'], $d['type_id'], $d['room_id'], $d['status'], $d['description'], date('Y-m-d H:i:s'), $id]);
    }

    public static function delete(int $id): void
    {
        Database::run('DELETE FROM equipment WHERE id = ?', [$id]);
    }

    /**
     * Keep the equipment status in step with its open reports:
     *   any "In Progress" report -> under_repair, else any "Pending" -> needs_repair, else operational.
     * Retired items are left alone.
     */
    public static function syncStatus(?int $equipmentId): void
    {
        if (!$equipmentId) return;
        $current = Database::value('SELECT status FROM equipment WHERE id = ?', [$equipmentId]);
        if ($current === null || $current === 'retired') return;

        $inProgress = (int) Database::value("SELECT COUNT(*) FROM reports WHERE equipment_id = ? AND status = 'In Progress'", [$equipmentId]);
        $pending    = (int) Database::value("SELECT COUNT(*) FROM reports WHERE equipment_id = ? AND status = 'Pending'", [$equipmentId]);
        $new = $inProgress > 0 ? 'under_repair' : ($pending > 0 ? 'needs_repair' : 'operational');
        Database::run('UPDATE equipment SET status = ?, updated_at = ? WHERE id = ?', [$new, date('Y-m-d H:i:s'), $equipmentId]);
    }
}
