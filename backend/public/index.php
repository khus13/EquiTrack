<?php
// Front controller. Dev:  php -S localhost:8000 -t public public/index.php
declare(strict_types=1);

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
// Let the built-in server serve real static files (uploads).
if (PHP_SAPI === 'cli-server' && is_file(__DIR__ . $path) && !str_ends_with($path, '.php')) return false;

require __DIR__ . '/../src/helpers.php';
require __DIR__ . '/../src/auth.php';
require __DIR__ . '/../src/reports.php';

session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'path' => '/']);
session_name('equitrack');
session_start();

// Same-origin in dev via the Vite proxy; allow an explicit origin if needed.
if ($o = getenv('CORS_ORIGIN')) {
    header("Access-Control-Allow-Origin: $o");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: GET,POST,PATCH,OPTIONS');
}
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'OPTIONS') { http_response_code(204); exit; }

$route = '/' . trim(preg_replace('#^/api#', '', $path), '/');

try {
    switch (true) {
        case $route === '/meta' && $method === 'GET':           meta();
        case $route === '/auth/register' && $method === 'POST': auth_register();
        case $route === '/auth/login' && $method === 'POST':    auth_login();
        case $route === '/auth/logout' && $method === 'POST':   auth_logout();
        case $route === '/auth/me' && $method === 'GET':        auth_me();
        case $route === '/reports' && $method === 'GET':        reports_list();
        case $route === '/reports' && $method === 'POST':       report_create();
        case preg_match('#^/reports/(\d+)$#', $route, $m) && $method === 'GET': report_get((int)$m[1]);
        case preg_match('#^/reports/(\d+)/status$#', $route, $m) && $method === 'PATCH': report_set_status((int)$m[1]);
        default: fail('Not found.', 404);
    }
} catch (PDOException $ex) {
    error_log($ex->getMessage());
    fail('Database error. Is MySQL running and configured?', 500);
} catch (Throwable $ex) {
    error_log($ex->getMessage());
    fail('Server error.', 500);
}
