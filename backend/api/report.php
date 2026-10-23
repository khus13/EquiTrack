<?php
require __DIR__ . '/../bootstrap.php';

$method = require_method('GET', 'POST');
$user = require_login();

$id = (int)($_GET['id'] ?? 0);
if (!$id) fail('Missing report id.');

if ($method === 'POST') {
    // Only admins may change a report's status.
    if ($user['role'] !== 'admin') fail('Only administrators can update a report.', 403);
    $status = (string)(body()['status'] ?? '');
    if (!in_array($status, ['Unresolved', 'Work In Progress', 'Resolved'], true)) {
        fail('Invalid status.');
    }
    $upd = db()->prepare('UPDATE reports SET status = ? WHERE id = ?');
    $upd->execute([$status, $id]);
}

$stmt = db()->prepare("SELECT r.id, r.item_name, r.category, r.description, r.status, r.photo_path,
        r.created_at, r.updated_at, b.id AS building_id, b.name AS building,
        l.id AS location_id, l.name AS location,
        CONCAT(u.first_name, ' ', u.last_name) AS reporter
    FROM reports r
    JOIN buildings b ON b.id = r.building_id
    JOIN locations l ON l.id = r.location_id
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.id = ?");
$stmt->execute([$id]);
$report = $stmt->fetch();
if (!$report) fail('Report not found.', 404);

json_out(['report' => $report]);
