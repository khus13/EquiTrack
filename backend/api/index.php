<?php
/**
 * api/index.php  -  FRONT CONTROLLER: every /api/... request enters here.
 *
 * Flow:  load config -> security headers -> start session -> CORS -> CSRF -> router -> controller -> JSON
 */
declare(strict_types=1);

require __DIR__ . '/../config/config.php';

// ---- 1. Autoload: find a class file by name in these folders --------------------------------
spl_autoload_register(function (string $class): void {
    foreach (['config', 'helpers', 'middleware', 'models', 'controllers', 'api'] as $dir) {
        $file = __DIR__ . "/../$dir/$class.php";
        if (is_file($file)) {
            require $file;
            return;
        }
    }
});
require __DIR__ . '/routes.php';

// ---- 2. Basics --------------------------------------------------------------------------------
date_default_timezone_set('UTC');            // all timestamps are stored/sent in UTC
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('Cache-Control: no-store');

// Never leak PHP errors to the browser; log them, and answer with clean JSON instead.
ini_set('display_errors', '0');
set_exception_handler(function (Throwable $e): void {
    error_log('[EquiTrack] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    $detail = config('app.debug') ? ['error' => $e->getMessage(), 'where' => basename($e->getFile()) . ':' . $e->getLine()] : null;
    Response::error('Something went wrong on the server.', 500, $detail);
});

// ---- 3. Session (the login cookie) ---------------------------------------------------------------
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
ini_set('session.use_strict_mode', '1');     // refuse session ids the server did not create
session_name('equitrack_sid');
session_set_cookie_params([
    'lifetime' => 0,                         // until the browser closes
    'path'     => '/',
    'secure'   => $https,                    // HTTPS only when the site uses HTTPS
    'httponly' => true,                      // JavaScript cannot read the cookie (blocks XSS theft)
    'samesite' => 'Lax',                     // cookie is not sent on cross-site POSTs
]);
session_start();

// ---- 4. CORS + CSRF ---------------------------------------------------------------------------------
CorsMiddleware::handle();
CsrfMiddleware::handle();

// ---- 5. Work out the route (the part of the URL after "/api") ---------------------------------------
$path  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$route = preg_replace('#^.*?/api(?:/index\.php)?#', '', $path);
$route = '/' . trim($route, '/');

$router = new Router();
registerRoutes($router);
$router->dispatch(Request::method(), $route);
