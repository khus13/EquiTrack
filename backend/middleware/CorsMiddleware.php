<?php
/**
 * middleware/CorsMiddleware.php
 * CORS = which websites (origins) may call this API from a browser.
 * We only echo back origins listed in .env (CORS_ALLOWED_ORIGINS) - never "*",
 * because we use cookies (credentials).
 */
class CorsMiddleware
{
    public static function handle(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        if ($origin !== '' && in_array($origin, config('cors.origins'), true)) {
            header("Access-Control-Allow-Origin: $origin");
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
            header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
            header('Access-Control-Max-Age: 600');
            header('Vary: Origin');
        }
        // Browsers send an OPTIONS "preflight" request first; answer it and stop.
        if (Request::method() === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
