<?php
require __DIR__ . '/../bootstrap.php';
require_method('GET');

json_out(['user' => current_user()]);
