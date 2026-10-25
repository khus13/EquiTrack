<?php
// Database + app configuration. Override with environment variables in production.
return [
    'db_host' => getenv('DB_HOST') ?: '127.0.0.1',
    'db_name' => getenv('DB_NAME') ?: 's23100488_equitrack',
    'db_user' => getenv('DB_USER') ?: 's23100488_equitrack',
    'db_pass' => getenv('DB_PASS') ?: 'Equitrack123',
    'upload_dir' => __DIR__ . '/uploads',
    'max_upload_bytes' => 5 * 1024 * 1024,
    // Origins allowed to call the API with cookies (only needed if the React dev
    // server is NOT using the Vite proxy).
    'allowed_origins' => ['http://localhost:5173', 'http://127.0.0.1:5173'],
];
