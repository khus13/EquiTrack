<?php
const STATUSES = ['Unresolved', 'Work In Progress', 'Resolved'];

const REPORT_SELECT = "SELECT r.id, r.title, r.description, r.status, r.image_path, r.created_at, r.updated_at,
        c.name AS category, b.name AS building, l.name AS location,
        r.category_id, r.building_id, r.location_id,
        CONCAT(u.first_name, ' ', u.last_name) AS reporter, r.user_id
    FROM reports r
    JOIN categories c ON c.id = r.category_id
    JOIN buildings b  ON b.id = r.building_id
    JOIN locations l  ON l.id = r.location_id
    JOIN users u      ON u.id = r.user_id";

function present(array $r): array {
    $r['image_url'] = $r['image_path'] ? '/uploads/' . $r['image_path'] : null;
    unset($r['image_path']);
    return $r;
}

function meta(): void {
    $pdo = db();
    json_out([
        'categories' => $pdo->query('SELECT id, name FROM categories ORDER BY id')->fetchAll(),
        'buildings'  => $pdo->query('SELECT id, name FROM buildings ORDER BY id')->fetchAll(),
        'locations'  => $pdo->query('SELECT id, building_id, name FROM locations ORDER BY name')->fetchAll(),
        'statuses'   => STATUSES,
    ]);
}

function reports_list(): void {
    require_user();
    $where = []; $p = [];
    if (!empty($_GET['category']))  { $where[] = 'r.category_id = ?'; $p[] = (int)$_GET['category']; }
    if (!empty($_GET['building']))  { $where[] = 'r.building_id = ?'; $p[] = (int)$_GET['building']; }
    if (!empty($_GET['status']) && in_array($_GET['status'], STATUSES, true)) {
        $where[] = 'r.status = ?'; $p[] = $_GET['status'];
    }
    if (!empty($_GET['mine'])) { $where[] = 'r.user_id = ?'; $p[] = $_SESSION['uid']; }
    if (($q = trim($_GET['q'] ?? '')) !== '') {
        $like = '%' . addcslashes($q, '%_\\') . '%';
        $where[] = '(r.status LIKE ? OR b.name LIKE ? OR l.name LIKE ? OR r.title LIKE ? OR c.name LIKE ?)';
        array_push($p, $like, $like, $like, $like, $like);
    }
    $sql = REPORT_SELECT . ($where ? ' WHERE ' . implode(' AND ', $where) : '') . ' ORDER BY r.created_at DESC, r.id DESC LIMIT 200';
    $s = db()->prepare($sql);
    $s->execute($p);
    $rows = array_map('present', $s->fetchAll());
    json_out(['count' => count($rows), 'reports' => $rows]);
}

function report_get(int $id): void {
    require_user();
    $s = db()->prepare(REPORT_SELECT . ' WHERE r.id = ?');
    $s->execute([$id]);
    $r = $s->fetch();
    if (!$r) fail('Report not found.', 404);
    json_out(['report' => present($r)]);
}

function report_create(): void {
    $user = require_user();
    $title = trim($_POST['title'] ?? '');
    $desc  = trim($_POST['description'] ?? '');
    $cat   = (int)($_POST['category_id'] ?? 0);
    $bld   = (int)($_POST['building_id'] ?? 0);
    $loc   = (int)($_POST['location_id'] ?? 0);
    $e = [];
    if ($title === '' || mb_strlen($title) > 150) $e['title'] = 'Name of item is required (max 150 characters).';
    if ($desc === '') $e['description'] = 'Please describe the problem.';
    $pdo = db();
    $chk = fn(string $sql, array $a) => (function () use ($pdo, $sql, $a) { $s = $pdo->prepare($sql); $s->execute($a); return (bool)$s->fetch(); })();
    if (!$chk('SELECT 1 FROM categories WHERE id = ?', [$cat])) $e['category_id'] = 'Select a category.';
    if (!$chk('SELECT 1 FROM buildings WHERE id = ?', [$bld])) $e['building_id'] = 'Select a building.';
    elseif (!$chk('SELECT 1 FROM locations WHERE id = ? AND building_id = ?', [$loc, $bld])) $e['location_id'] = 'Select a location in that building.';

    $file = $_FILES['photo'] ?? null;
    $ext = null;
    if (!$file || $file['error'] === UPLOAD_ERR_NO_FILE) $e['photo'] = 'A photo of the item is required.';
    elseif ($file['error'] !== UPLOAD_ERR_OK) $e['photo'] = ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) ? 'Image exceeds 5MB.' : 'Upload failed.';
    elseif ($file['size'] > config()['max_upload']) $e['photo'] = 'Image exceeds 5MB.';
    else {
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'][$mime] ?? null;
        if (!$ext) $e['photo'] = 'Only JPG, PNG or WebP images are accepted.';
    }
    if ($e) fail('Please fix the highlighted fields.', 422, $e);

    $name = bin2hex(random_bytes(16)) . '.' . $ext;
    $dir = config()['upload_dir'];
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    if (!move_uploaded_file($file['tmp_name'], "$dir/$name")) fail('Could not save the image.', 500);

    $s = $pdo->prepare('INSERT INTO reports (user_id,title,category_id,description,building_id,location_id,image_path) VALUES (?,?,?,?,?,?,?)');
    $s->execute([$user['id'], $title, $cat, $desc, $bld, $loc, $name]);
    $id = (int)$pdo->lastInsertId();
    $s = $pdo->prepare(REPORT_SELECT . ' WHERE r.id = ?');
    $s->execute([$id]);
    json_out(['report' => present($s->fetch())], 201);
}

function report_set_status(int $id): void {
    $user = require_user();
    if ($user['role'] !== 'admin') fail('Only administrators can update status.', 403);
    $status = body()['status'] ?? '';
    if (!in_array($status, STATUSES, true)) fail('Invalid status.', 422);
    $s = db()->prepare('UPDATE reports SET status = ? WHERE id = ?');
    $s->execute([$status, $id]);
    report_get($id);
}
