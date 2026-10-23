<?php
require __DIR__ . '/../bootstrap.php';

const CATEGORIES = ['Equipment & Utilities', 'Facilities', 'Other'];
const REPORT_SELECT = "SELECT r.id, r.item_name, r.category, r.description, r.status, r.photo_path,
        r.created_at, r.updated_at, b.id AS building_id, b.name AS building,
        l.id AS location_id, l.name AS location,
        CONCAT(u.first_name, ' ', u.last_name) AS reporter
    FROM reports r
    JOIN buildings b ON b.id = r.building_id
    JOIN locations l ON l.id = r.location_id
    LEFT JOIN users u ON u.id = r.user_id";

function as_list($v): array
{
    if ($v === null || $v === '') return [];
    return array_values(array_filter(array_map('strval', (array)$v), fn($x) => $x !== ''));
}

function in_clause(string $prefix, array $values, array &$params): string
{
    $names = [];
    foreach ($values as $i => $v) {
        $key = ":{$prefix}{$i}";
        $params[$key] = $v;
        $names[] = $key;
    }
    return '(' . implode(',', $names) . ')';
}

function save_photo(array $file): string
{
    global $config;
    if ($file['error'] === UPLOAD_ERR_NO_FILE) {
        fail('A photo of the item is required.');
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        fail($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE
            ? 'Photo is too large (max 5MB).' : 'Photo upload failed. Please try again.');
    }
    if ($file['size'] > $config['max_upload_bytes']) {
        fail('Photo is too large (max 5MB).');
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    if (!isset($allowed[$mime])) {
        fail('Photo must be a JPG, PNG, or WebP image.');
    }
    if (@getimagesize($file['tmp_name']) === false) {
        fail('That file is not a valid image.');
    }
    if (!is_dir($config['upload_dir'])) {
        mkdir($config['upload_dir'], 0755, true);
    }
    $name = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
    if (!move_uploaded_file($file['tmp_name'], $config['upload_dir'] . '/' . $name)) {
        throw new RuntimeException('Could not move uploaded file.');
    }
    return 'uploads/' . $name;
}

$method = require_method('GET', 'POST');
$user = require_login();

if ($method === 'GET') {
    $where = [];
    $params = [];

    $q = trim((string)($_GET['q'] ?? ''));
    if ($q !== '') {
        $where[] = '(r.item_name LIKE :q OR r.status LIKE :q OR r.category LIKE :q OR b.name LIKE :q OR l.name LIKE :q)';
        $params[':q'] = '%' . addcslashes($q, '%_\\') . '%';
    }

    $cats = array_values(array_intersect(as_list($_GET['categories'] ?? null), CATEGORIES));
    if ($cats) $where[] = 'r.category IN ' . in_clause('c', $cats, $params);

    $statuses = array_values(array_intersect(as_list($_GET['statuses'] ?? null), ['Unresolved', 'Work In Progress', 'Resolved']));
    if ($statuses) $where[] = 'r.status IN ' . in_clause('s', $statuses, $params);

    $buildings = array_map('intval', as_list($_GET['buildings'] ?? null));
    if ($buildings) $where[] = 'r.building_id IN ' . in_clause('b', $buildings, $params);

    $sql = REPORT_SELECT . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY r.created_at DESC, r.id DESC';
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    json_out(['count' => count($rows), 'reports' => $rows]);
}

// POST: create a report (multipart/form-data)
$in = $_POST;
$item = trim((string)($in['item_name'] ?? ''));
$category = (string)($in['category'] ?? '');
$desc = trim((string)($in['description'] ?? ''));
$buildingId = (int)($in['building_id'] ?? 0);
$locationId = (int)($in['location_id'] ?? 0);

if ($item === '' || $desc === '' || !$buildingId || !$locationId || $category === '') {
    fail('Please fill out all required fields.');
}
if (mb_strlen($item) > 120) fail('Item name must be 120 characters or fewer.');
if (mb_strlen($desc) > 2000) fail('Description must be 2000 characters or fewer.');
if (!in_array($category, CATEGORIES, true)) fail('Please choose a valid category.');

$chk = db()->prepare('SELECT 1 FROM locations WHERE id = ? AND building_id = ?');
$chk->execute([$locationId, $buildingId]);
if (!$chk->fetch()) fail('That location does not belong to the selected building.');

$photo = save_photo($_FILES['photo'] ?? ['error' => UPLOAD_ERR_NO_FILE]);

db()->prepare('INSERT INTO reports (user_id, item_name, category, description, building_id, location_id, photo_path)
               VALUES (?,?,?,?,?,?,?)')
    ->execute([$user['id'], $item, $category, $desc, $buildingId, $locationId, $photo]);

$id = (int)db()->lastInsertId();
$stmt = db()->prepare(REPORT_SELECT . ' WHERE r.id = ?');
$stmt->execute([$id]);
json_out(['report' => $stmt->fetch()], 201);
