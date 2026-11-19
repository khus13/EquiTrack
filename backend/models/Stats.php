<?php
/**
 * models/Stats.php
 * Numbers for the dashboards and the Super Admin statistics page.
 * (Month grouping / averages are done in PHP so the SQL stays simple.)
 */
class Stats
{
    /** [ 'Pending' => 3, 'In Progress' => 1, 'Solved' => 2 ] (always all three keys). */
    public static function statusCounts(?int $userId = null): array
    {
        $out = ['Pending' => 0, 'In Progress' => 0, 'Solved' => 0];
        $w = $userId ? ' WHERE user_id = ' . (int) $userId : '';
        foreach (Database::all('SELECT status, COUNT(*) AS n FROM reports' . $w . ' GROUP BY status') as $r) {
            $out[$r['status']] = (int) $r['n'];
        }
        return $out;
    }

    /** Admin dashboard. */
    public static function dashboard(): array
    {
        $counts = self::statusCounts();
        return [
            'counts'        => $counts + ['total' => array_sum($counts)],
            'urgent_open'   => (int) Database::value("SELECT COUNT(*) FROM reports WHERE priority = 'Urgent' AND status <> 'Solved'"),
            'recent'        => Report::recent(6),
            'to_repair'     => Report::toRepair(8),
        ];
    }

    /** User dashboard. */
    public static function forUser(int $userId): array
    {
        $counts = self::statusCounts($userId);
        return ['counts' => $counts + ['total' => array_sum($counts)], 'recent' => Report::recent(5, $userId)];
    }

    /** Landing page (public, numbers only). */
    public static function publicSummary(): array
    {
        $c = self::statusCounts();
        return [
            'reports_total'  => array_sum($c),
            'reports_solved' => $c['Solved'],
            'equipment_total' => (int) Database::value('SELECT COUNT(*) FROM equipment'),
            'buildings_total' => (int) Database::value('SELECT COUNT(*) FROM buildings'),
        ];
    }

    private static function grouped(string $sql): array
    {
        return array_map(fn($r) => ['label' => $r['label'], 'count' => (int) $r['n']], Database::all($sql));
    }

    /** Super Admin "Reports / Statistics". */
    public static function overview(): array
    {
        $counts = self::statusCounts();

        // ---- reports per month, last 6 months (bucketed in PHP) ----
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $months[date('Y-m', strtotime("first day of -$i month"))] = ['label' => date('M Y', strtotime("first day of -$i month")), 'created' => 0, 'solved' => 0];
        }
        $since = date('Y-m-01 00:00:00', strtotime('first day of -5 month'));
        foreach (Database::all('SELECT created_at, resolved_at FROM reports WHERE created_at >= ? OR resolved_at >= ?', [$since, $since]) as $r) {
            $c = substr($r['created_at'], 0, 7);
            if (isset($months[$c])) $months[$c]['created']++;
            if ($r['resolved_at'] && isset($months[substr($r['resolved_at'], 0, 7)])) $months[substr($r['resolved_at'], 0, 7)]['solved']++;
        }

        // ---- average time to solve (hours) ----
        $hours = [];
        foreach (Database::all("SELECT created_at, resolved_at FROM reports WHERE status = 'Solved' AND resolved_at IS NOT NULL") as $r) {
            $hours[] = max(0, (strtotime($r['resolved_at']) - strtotime($r['created_at'])) / 3600);
        }

        return [
            'status_counts' => $counts + ['total' => array_sum($counts)],
            'avg_resolution_hours' => $hours ? round(array_sum($hours) / count($hours), 1) : null,
            'by_priority' => self::grouped("SELECT priority AS label, COUNT(*) AS n FROM reports GROUP BY priority"),
            'by_category' => self::grouped('SELECT c.name AS label, COUNT(*) AS n FROM reports r JOIN categories c ON c.id = r.category_id GROUP BY c.name ORDER BY n DESC'),
            'by_campus'   => self::grouped('SELECT cp.name AS label, COUNT(*) AS n FROM reports r JOIN campuses cp ON cp.id = r.campus_id GROUP BY cp.name ORDER BY n DESC'),
            'by_building' => self::grouped('SELECT b.name AS label, COUNT(*) AS n FROM reports r JOIN buildings b ON b.id = r.building_id GROUP BY b.name ORDER BY n DESC LIMIT 8'),
            'by_damage'   => self::grouped('SELECT d.name AS label, COUNT(*) AS n FROM reports r JOIN damage_types d ON d.id = r.damage_type_id GROUP BY d.name ORDER BY n DESC'),
            'monthly'     => array_values($months),
            'users_by_role' => self::grouped('SELECT ro.name AS label, COUNT(*) AS n FROM users u JOIN roles ro ON ro.id = u.role_id GROUP BY ro.name'),
            'equipment_by_status' => self::grouped('SELECT status AS label, COUNT(*) AS n FROM equipment GROUP BY status'),
        ];
    }
}
