<?php
/**
 * helpers/Response.php
 * EVERY JSON reply from the API has the same shape:
 *     { "success": true|false, "message": "text", "data": ... }
 */
class Response
{
    public static function json(bool $success, string $message, $data = null, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(
            ['success' => $success, 'message' => $message, 'data' => $data],
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
        );
        exit;
    }

    public static function ok($data = null, string $message = 'OK'): never          { self::json(true, $message, $data, 200); }
    public static function created($data = null, string $message = 'Created'): never { self::json(true, $message, $data, 201); }

    public static function error(string $message, int $status = 400, $data = null): never
    {
        self::json(false, $message, $data, $status);
    }

    /** 422 with {errors: {field: "message"}} so the form can show inline errors. */
    public static function validation(array $errors, string $message = 'Please fix the highlighted fields.'): never
    {
        self::json(false, $message, ['errors' => $errors], 422);
    }

    /** Paginated list: data = { items: [...], pagination: {...} } */
    public static function paginated(array $items, int $total, int $page, int $perPage, string $message = 'OK'): never
    {
        self::ok([
            'items'      => $items,
            'pagination' => [
                'page'        => $page,
                'per_page'    => $perPage,
                'total'       => $total,
                'total_pages' => max(1, (int) ceil($total / max(1, $perPage))),
            ],
        ], $message);
    }
}
