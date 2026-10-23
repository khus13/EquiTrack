<?php
// Configuration – override with environment variables.
return [
    'db_host' => getenv('DB_HOST') ?: '127.0.0.1',
    'db_port' => getenv('DB_PORT') ?: '3306',
    'db_name' => getenv('DB_NAME') ?: 'equitrack',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') ?: '',
    'upload_dir' => __DIR__ . '/../public/uploads',
    'max_upload' => 5 * 1024 * 1024,
    // Only these email domains may register. Empty array = allow any.
    'allowed_email_domains' => [],
];
