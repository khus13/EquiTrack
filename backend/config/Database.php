<?php
/**
 * config/database.php
 * One shared PDO connection.  PDO + prepared statements = protection against SQL injection.
 */
class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo !== null) {
            return self::$pdo;
        }

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,   // throw errors instead of failing silently
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,                    // real prepared statements
        ];

        if (config('db.driver') === 'sqlite') {
            // Used ONLY by the automated test-suite (no MySQL server needed).
            self::$pdo = new PDO('sqlite:' . config('db.sqlite'), null, null, $options);
            self::$pdo->exec('PRAGMA foreign_keys = ON');
        } else {
            $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
                config('db.host'), config('db.port'), config('db.name'));
            self::$pdo = new PDO($dsn, config('db.user'), config('db.pass'), $options);
            self::$pdo->exec("SET time_zone = '+00:00'");     // same clock as PHP (UTC) for every timestamp
        }
        return self::$pdo;
    }

    /** Run a SELECT and return all rows. */
    public static function all(string $sql, array $params = []): array
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /** Run a SELECT and return the first row (or null). */
    public static function one(string $sql, array $params = []): ?array
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row === false ? null : $row;
    }

    /** Run a SELECT and return the first column of the first row. */
    public static function value(string $sql, array $params = [])
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        $v = $stmt->fetchColumn();
        return $v === false ? null : $v;
    }

    /** Run INSERT / UPDATE / DELETE; returns the number of affected rows. */
    public static function run(string $sql, array $params = []): int
    {
        $stmt = self::pdo()->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    /** Insert and return the new auto-increment id. */
    public static function insert(string $sql, array $params = []): int
    {
        self::run($sql, $params);
        return (int) self::pdo()->lastInsertId();
    }
}
