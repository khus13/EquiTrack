<?php
require __DIR__ . '/../bootstrap.php';
require_method('GET');
require_login();

$buildings = db()->query('SELECT id, name FROM buildings ORDER BY id')->fetchAll();
$locations = db()->query('SELECT id, building_id, name FROM locations ORDER BY name')->fetchAll();

$byBuilding = [];
foreach ($locations as $l) {
    $byBuilding[(int)$l['building_id']][] = ['id' => (int)$l['id'], 'name' => $l['name']];
}
foreach ($buildings as &$b) {
    $b['id'] = (int)$b['id'];
    $b['locations'] = $byBuilding[$b['id']] ?? [];
}
unset($b);

json_out([
    'categories' => ['Equipment & Utilities', 'Facilities', 'Other'],
    'statuses' => ['Unresolved', 'Work In Progress', 'Resolved'],
    'buildings' => $buildings,
]);
