<?php
/**
 * models/User.php
 * All SQL for the `users` table.  Every query uses prepared statements (the ? marks).
 */
class User
{
    private const SELECT = 'SELECT u.id, u.first_name, u.last_name, u.email, u.status, u.created_at, r.name AS role
                            FROM users u JOIN roles r ON r.id = u.role_id';

    /** Add a ready-made full_name to a row. */
    public static function present(?array $u): ?array
    {
        if ($u === null) return null;
        unset($u['password_hash']);
        $u['full_name'] = trim($u['first_name'] . ' ' . $u['last_name']);
        return $u;
    }

    public static function find(int $id): ?array
    {
        return self::present(Database::one(self::SELECT . ' WHERE u.id = ?', [$id]));
    }

    /** Includes password_hash - only used by login / password checks. */
    public static function findByEmailWithHash(string $email): ?array
    {
        return Database::one(
            'SELECT u.id, u.first_name, u.last_name, u.email, u.status, u.password_hash, r.name AS role
             FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ?', [$email]);
    }

    public static function passwordHash(int $id): ?string
    {
        return Database::value('SELECT password_hash FROM users WHERE id = ?', [$id]);
    }

    public static function emailTaken(string $email, ?int $exceptId = null): bool
    {
        return (bool) Database::value('SELECT 1 FROM users WHERE email = ? AND id <> ?', [$email, $exceptId ?? 0]);
    }

    public static function roleId(string $name): ?int
    {
        $id = Database::value('SELECT id FROM roles WHERE name = ?', [$name]);
        return $id === null ? null : (int) $id;
    }

    public static function create(array $d): int
    {
        return Database::insert(
            'INSERT INTO users (role_id, first_name, last_name, email, password_hash, status) VALUES (?,?,?,?,?,?)',
            [self::roleId($d['role']), $d['first_name'], $d['last_name'], $d['email'],
             password_hash($d['password'], PASSWORD_DEFAULT), $d['status'] ?? 'active']);
    }

    /** Update name/email (and optionally role/status when an admin edits a user). */
    public static function update(int $id, array $d): void
    {
        $sets = ['first_name = ?', 'last_name = ?', 'email = ?', 'updated_at = ?'];
        $args = [$d['first_name'], $d['last_name'], $d['email'], date('Y-m-d H:i:s')];
        if (isset($d['role']))   { $sets[] = 'role_id = ?'; $args[] = self::roleId($d['role']); }
        if (isset($d['status'])) { $sets[] = 'status = ?';  $args[] = $d['status']; }
        $args[] = $id;
        Database::run('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?', $args);
    }

    public static function setPassword(int $id, string $plain): void
    {
        Database::run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?',
            [password_hash($plain, PASSWORD_DEFAULT), date('Y-m-d H:i:s'), $id]);
    }

    public static function setStatus(int $id, string $status): void
    {
        Database::run('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [$status, date('Y-m-d H:i:s'), $id]);
    }

    public static function delete(int $id): void
    {
        Database::run('DELETE FROM users WHERE id = ?', [$id]);
    }

    public static function countByRole(string $role): int
    {
        return (int) Database::value('SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = ? AND u.status = ?', [$role, 'active']);
    }

    /** Search + filter + paginate for the Super Admin "Users" page. */
    public static function paginate(array $f, int $limit, int $offset): array
    {
        $where = []; $args = [];
        if (!empty($f['q'])) {
            $like = Paginator::like($f['q']);
            $where[] = "(u.first_name LIKE ? ESCAPE '!' OR u.last_name LIKE ? ESCAPE '!' OR u.email LIKE ? ESCAPE '!')";
            array_push($args, $like, $like, $like);
        }
        if (!empty($f['role']))   { $where[] = 'r.name = ?';   $args[] = $f['role']; }
        if (!empty($f['status'])) { $where[] = 'u.status = ?'; $args[] = $f['status']; }
        $w = $where ? ' WHERE ' . implode(' AND ', $where) : '';

        $total = (int) Database::value('SELECT COUNT(*) FROM users u JOIN roles r ON r.id = u.role_id' . $w, $args);
        $rows  = Database::all(self::SELECT . $w . " ORDER BY u.created_at DESC, u.id DESC LIMIT $limit OFFSET $offset", $args);
        return [array_map([self::class, 'present'], $rows), $total];
    }
}
