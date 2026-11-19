<?php
/**
 * helpers/Request.php
 * Small helpers for reading what the browser sent.
 */
class Request
{
    private static ?array $body = null;

    public static function method(): string
    {
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    /** Body fields: JSON (application/json) or normal form / multipart fields. */
    public static function body(): array
    {
        if (self::$body !== null) {
            return self::$body;
        }
        $type = $_SERVER['CONTENT_TYPE'] ?? '';
        if (stripos($type, 'application/json') !== false) {
            $decoded = json_decode(file_get_contents('php://input') ?: '', true);
            self::$body = is_array($decoded) ? $decoded : [];
        } else {
            self::$body = $_POST;
        }
        return self::$body;
    }

    /** One body field, with a default. */
    public static function input(string $key, $default = null)
    {
        return self::body()[$key] ?? $default;
    }

    /** One query-string value (?page=2). */
    public static function query(string $key, $default = null)
    {
        return $_GET[$key] ?? $default;
    }

    /** Positive integer from the query string, clamped between $min and $max. */
    public static function intQuery(string $key, int $default, int $min = 1, int $max = 1000): int
    {
        $v = filter_var($_GET[$key] ?? null, FILTER_VALIDATE_INT);
        $v = $v === false || $v === null ? $default : $v;
        return max($min, min($max, $v));
    }

    public static function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$key] ?? null;
    }

    public static function ip(): string
    {
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}
