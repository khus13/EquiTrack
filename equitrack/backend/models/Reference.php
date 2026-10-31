<?php
/**
 * models/Reference.php
 * One small class that handles CRUD for ALL the "reference data" tables
 * (campuses, buildings, rooms, categories, equipment types, damage types).
 * Each table is described once in resources() - add a new entry to add a new table.
 */
class Reference
{
    /**
     * table   : database table
     * select  : SQL used to list rows (joins parent tables for display names)
     * fields  : writable columns => validation rules
     * parents : foreign-key column => parent table (checked before saving)
     */
    public static function resources(): array
    {
        return [
            'campuses' => [
                'table' => 'campuses', 'label' => 'Campus',
                'select' => 'SELECT id, name, code, address FROM campuses ORDER BY name',
                'fields' => ['name' => 'required|max:120', 'code' => 'required|max:10', 'address' => 'max:190'],
                'parents' => [],
            ],
            'buildings' => [
                'table' => 'buildings', 'label' => 'Building',
                'select' => 'SELECT b.id, b.campus_id, b.name, b.code, c.name AS campus_name
                             FROM buildings b JOIN campuses c ON c.id = b.campus_id ORDER BY c.name, b.name',
                'fields' => ['campus_id' => 'required|int', 'name' => 'required|max:120', 'code' => 'max:20'],
                'parents' => ['campus_id' => 'campuses'],
            ],
            'rooms' => [
                'table' => 'rooms', 'label' => 'Room',
                'select' => 'SELECT r.id, r.building_id, r.name, r.floor, b.name AS building_name, b.campus_id
                             FROM rooms r JOIN buildings b ON b.id = r.building_id ORDER BY b.name, r.name',
                'fields' => ['building_id' => 'required|int', 'name' => 'required|max:120', 'floor' => 'max:20'],
                'parents' => ['building_id' => 'buildings'],
            ],
            'categories' => [
                'table' => 'categories', 'label' => 'Category',
                'select' => 'SELECT id, name, description FROM categories ORDER BY id',
                'fields' => ['name' => 'required|max:80', 'description' => 'max:190'],
                'parents' => [],
            ],
            'equipment_types' => [
                'table' => 'equipment_types', 'label' => 'Equipment type',
                'select' => 'SELECT t.id, t.category_id, t.name, c.name AS category_name
                             FROM equipment_types t JOIN categories c ON c.id = t.category_id ORDER BY c.name, t.name',
                'fields' => ['category_id' => 'required|int', 'name' => 'required|max:80'],
                'parents' => ['category_id' => 'categories'],
            ],
            'damage_types' => [
                'table' => 'damage_types', 'label' => 'Damage type',
                'select' => 'SELECT id, name, description FROM damage_types ORDER BY id',
                'fields' => ['name' => 'required|max:80', 'description' => 'max:190'],
                'parents' => [],
            ],
        ];
    }

    public static function resource(string $key): ?array
    {
        return self::resources()[$key] ?? null;
    }

    public static function all(string $key): array
    {
        return Database::all(self::resource($key)['select']);
    }

    /** Everything the React forms need in ONE call (GET /api/meta). */
    public static function meta(): array
    {
        $out = [];
        foreach (array_keys(self::resources()) as $key) {
            $out[$key] = self::all($key);
        }
        $out['priorities'] = ['Low', 'Medium', 'High', 'Urgent'];
        $out['statuses']   = ['Pending', 'In Progress', 'Solved'];
        $out['equipment_statuses'] = ['operational', 'needs_repair', 'under_repair', 'retired'];
        return $out;
    }

    public static function find(string $key, int $id): ?array
    {
        $t = self::resource($key)['table'];
        return Database::one("SELECT * FROM $t WHERE id = ?", [$id]);   // $t comes from OUR list, never from the user
    }

    public static function exists(string $table, int $id): bool
    {
        return (bool) Database::value("SELECT 1 FROM $table WHERE id = ?", [$id]);
    }

    public static function create(string $key, array $data): int
    {
        $r = self::resource($key);
        $cols = array_keys($r['fields']);
        $sql  = 'INSERT INTO ' . $r['table'] . ' (' . implode(', ', $cols) . ') VALUES (' . implode(', ', array_fill(0, count($cols), '?')) . ')';
        return Database::insert($sql, array_map(fn($c) => $data[$c] === '' ? null : $data[$c], $cols));
    }

    public static function update(string $key, int $id, array $data): void
    {
        $r = self::resource($key);
        $cols = array_keys($r['fields']);
        $sql  = 'UPDATE ' . $r['table'] . ' SET ' . implode(', ', array_map(fn($c) => "$c = ?", $cols)) . ' WHERE id = ?';
        Database::run($sql, array_merge(array_map(fn($c) => $data[$c] === '' ? null : $data[$c], $cols), [$id]));
    }

    public static function delete(string $key, int $id): void
    {
        Database::run('DELETE FROM ' . self::resource($key)['table'] . ' WHERE id = ?', [$id]);
    }
}
