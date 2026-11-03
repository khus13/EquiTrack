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
            (SELECT COUNT(*) FROM reports r WHERE r.equipment_id = e.id AND r.status <> 'Solved') AS open_reports
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
        return $r;
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
        $rows  = Database::all(self::SELECT . $w . " ORDER BY e.name ASC, e.id ASC LIMIT $limit OFFSET $offset", $args);
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
