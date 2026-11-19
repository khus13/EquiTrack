<?php
/**
 * router.php - ONLY for PHP's built-in development server (no Apache needed):
 *
 *     cd backend
 *     php -S 127.0.0.1:8000 router.php
 *
 * Sends every /api/... URL to api/index.php and refuses everything else
 * (so .env and the uploads folder can never be downloaded).
 */
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (str_starts_with($path, '/api')) {
    require __DIR__ . '/api/index.php';
    return true;
}
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'Not found. The API lives under /api.', 'data' => null]);
