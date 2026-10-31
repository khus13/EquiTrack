<?php
/**
 * controllers/EquipmentController.php
 * The equipment directory. Everyone logged in can search it; only Super Admin edits it.
 */
class EquipmentController
{
    private const STATUSES = ['operational', 'needs_repair', 'under_repair', 'retired'];

    /** GET /api/equipment?q=&category_id=&campus_id=&building_id=&type_id=&status=&page= */
    public static function index(array $p): never
    {
        [$page, $perPage, $offset] = Paginator::params(12);
        [$rows, $total] = Equipment::paginate([
            'q'           => Validator::clean(Request::query('q', '')),
            'category_id' => Request::query('category_id'),
            'campus_id'   => Request::query('campus_id'),
            'building_id' => Request::query('building_id'),
            'type_id'     => Request::query('type_id'),
            'room_id'     => Request::query('room_id'),
            'status'      => in_array(Request::query('status'), self::STATUSES, true) ? Request::query('status') : null,
        ], $perPage, $offset);
        Response::paginated($rows, $total, $page, $perPage);
    }

    /** GET /api/equipment/{id} */
    public static function show(array $p): never
    {
        $e = Equipment::find((int) $p['id']) ?? Response::error('Equipment not found.', 404);
        $e['recent_reports'] = Report::paginate(['equipment_id' => $e['id']], 5, 0)[0];
        Response::ok($e);
    }

    /** POST /api/equipment */
    public static function store(array $p): never
    {
        [$d, $errors] = self::validated(null);
        if ($errors) Response::validation($errors);
        $id = Equipment::create($d);
        AuditLog::log((int) AuthMiddleware::user()['id'], 'equipment.create', 'equipment', $id, ['asset_tag' => $d['asset_tag']]);
        Response::created(Equipment::find($id), 'Equipment added.');
    }

    /** PUT /api/equipment/{id} */
    public static function update(array $p): never
    {
        $id = (int) $p['id'];
        Equipment::find($id) ?? Response::error('Equipment not found.', 404);
        [$d, $errors] = self::validated($id);
        if ($errors) Response::validation($errors);
        Equipment::update($id, $d);
        AuditLog::log((int) AuthMiddleware::user()['id'], 'equipment.update', 'equipment', $id, ['asset_tag' => $d['asset_tag']]);
        Response::ok(Equipment::find($id), 'Equipment updated.');
    }

    /** DELETE /api/equipment/{id} */
    public static function destroy(array $p): never
    {
        $id = (int) $p['id'];
        $e = Equipment::find($id) ?? Response::error('Equipment not found.', 404);
        Equipment::delete($id);          // reports keep existing (equipment_id becomes NULL)
        AuditLog::log((int) AuthMiddleware::user()['id'], 'equipment.delete', 'equipment', $id, ['asset_tag' => $e['asset_tag']]);
        Response::ok(null, 'Equipment deleted.');
    }

    private static function validated(?int $id): array
    {
        $d = [
            'asset_tag'   => strtoupper(Validator::clean(Request::input('asset_tag'))),
            'name'        => Validator::clean(Request::input('name')),
            'category_id' => Request::input('category_id'),
            'type_id'     => Request::input('type_id'),
            'room_id'     => Request::input('room_id'),
            'status'      => (string) Request::input('status', 'operational'),
            'description' => Validator::clean(Request::input('description')),
        ];
        $errors = Validator::check($d, [
            'asset_tag'   => 'required|max:40',
            'name'        => 'required|max:150',
            'category_id' => 'required|int',
            'room_id'     => 'required|int',
            'status'      => 'required|in:' . implode(',', self::STATUSES),
            'description' => 'max:1000',
        ]);
        if (!isset($errors['asset_tag'])) {
            if (!preg_match('/^[A-Z0-9][A-Z0-9\-_.]*$/', $d['asset_tag'])) $errors['asset_tag'] = 'Use letters, numbers, dashes only (e.g. TC-LB-0001).';
            elseif (Equipment::assetTagTaken($d['asset_tag'], $id)) $errors['asset_tag'] = 'That asset tag is already used.';
        }
        if (!isset($errors['category_id']) && !Reference::exists('categories', (int) $d['category_id'])) $errors['category_id'] = 'Select a valid category.';
        if (!isset($errors['room_id']) && !Reference::exists('rooms', (int) $d['room_id'])) $errors['room_id'] = 'Select a valid room.';

        $typeId = null;
        if ($d['type_id'] !== null && $d['type_id'] !== '') {
            if (!Database::value('SELECT 1 FROM equipment_types WHERE id = ? AND category_id = ?', [(int) $d['type_id'], (int) $d['category_id']])) {
                $errors['type_id'] = 'That type does not belong to the selected category.';
            } else $typeId = (int) $d['type_id'];
        }
        $d['category_id'] = (int) $d['category_id'];
        $d['room_id']     = (int) $d['room_id'];
        $d['type_id']     = $typeId;
        $d['description'] = $d['description'] !== '' ? $d['description'] : null;
        return [$d, $errors];
    }
}
