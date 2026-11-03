<?php
/**
 * config/config.php
 * Loads settings from backend/.env (if it exists) and exposes them through
 * two tiny helpers:  env('KEY', 'default')  and  config('app.debug').
 */

// ---- 1. Read the .env file (very small parser: KEY=value, # comments) ----
(function () {
    $file = __DIR__ . '/../.env';
    if (!is_readable($file)) {
        return;
    }
    foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $value = trim($value);
        // remove trailing "# comment" when the value is not quoted
        if ($value !== '' && $value[0] !== '"' && $value[0] !== "'") {
            $value = trim(preg_replace('/\s+#.*$/', '', $value));
        }
        $value = trim($value, "\"'");
        if (getenv(trim($key)) === false) {      // real environment variables win
            putenv(trim($key) . '=' . $value);
        }
    }
})();

/** Read an environment value with a fallback. */
function env(string $key, $default = null)
{
    $value = getenv($key);
    return ($value === false || $value === '') ? $default : $value;
}

/** Read a config value using dot notation, e.g. config('db.host'). */
function config(string $path, $default = null)
{
    static $settings = null;
    if ($settings === null) {
        $maxMb = (int) env('MAX_UPLOAD_MB', 2);
        $settings = [
            'app' => [
                'env'   => env('APP_ENV', 'development'),
                'debug' => filter_var(env('APP_DEBUG', 'true'), FILTER_VALIDATE_BOOLEAN),
            ],
            'db' => [
                'driver' => env('DB_DRIVER', 'mysql'),          // 'sqlite' is used only by automated tests
                'host'   => env('DB_HOST', '127.0.0.1'),
                'port'   => env('DB_PORT', '3306'),
                'name'   => env('DB_NAME', 'equitrack'),
                'user'   => env('DB_USER', 'root'),
                'pass'   => env('DB_PASS', ''),
                'sqlite' => env('DB_SQLITE_PATH', ''),
            ],
            'cors' => [
                'origins' => array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))),
            ],
            'auth' => [
                'email_domains' => array_filter(array_map('strtolower', array_map('trim', explode(',', (string) env('ALLOWED_EMAIL_DOMAINS', ''))))),
                'min_password'  => 8,
            ],
            'upload' => [
                'dir'       => __DIR__ . '/../uploads',
                'max_bytes' => $maxMb * 1024 * 1024,
                'mimes'     => ['image/jpeg' => 'jpg', 'image/png' => 'png'],   // spec: jpg / png only
            ],
        ];
    }
    $value = $settings;
    foreach (explode('.', $path) as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return $default;
        }
        $value = $value[$part];
    }
    return $value;
}
