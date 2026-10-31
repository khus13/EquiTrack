<?php
/**
 * controllers/ReferenceController.php
 * Reference data = campuses, buildings, rooms, categories, equipment types, damage types.
 *   GET /api/meta                     -> everything at once (any logged-in user, used by forms)
 *   GET /api/reference/{resource}     -> list one table (admin)
 *   POST/PUT/DELETE ...               -> Super Admin
 */
class ReferenceController
{
    /** GET /api/meta */
    public static function meta(array $p): never
    {
        Response::ok(Reference::meta());
    }

    private static function resource(array $p): array
    {
        return Reference::resource($p['resource']) ?? Response::error('Unknown reference table.', 404);
    }

    /** GET /api/reference/{resource} */
    public static function index(array $p): never
    {
        self::resource($p);
        Response::ok(Reference::all($p['resource']));
    }

    /** POST /api/reference/{resource} */
    public static function store(array $p): never
    {
        $res = self::resource($p);
        $data = self::validated($res, null);
        try {
            $id = Reference::create($p['resource'], $data);
        } catch (PDOException $e) {
            Response::validation(['name' => $res['label'] . ' already exists.']);
        }
        AuditLog::log((int) AuthMiddleware::user()['id'], 'reference.create', $p['resource'], $id, $data);
        Response::created(Reference::find($p['resource'], $id), $res['label'] . ' added.');
    }

    /** PUT /api/reference/{resource}/{id} */
    public static function update(array $p): never
    {
        $res = self::resource($p);
        $id = (int) $p['id'];
        Reference::find($p['resource'], $id) ?? Response::error($res['label'] . ' not found.', 404);
        $data = self::validated($res, $id);
        try {
            Reference::update($p['resource'], $id, $data);
        } catch (PDOException $e) {
            Response::validation(['name' => $res['label'] . ' already exists.']);
        }
        AuditLog::log((int) AuthMiddleware::user()['id'], 'reference.update', $p['resource'], $id, $data);
        Response::ok(Reference::find($p['resource'], $id), $res['label'] . ' updated.');
    }

    /** DELETE /api/reference/{resource}/{id} */
    public static function destroy(array $p): never
    {
        $res = self::resource($p);
        $id = (int) $p['id'];
        $row = Reference::find($p['resource'], $id) ?? Response::error($res['label'] . ' not found.', 404);
        try {
            Reference::delete($p['resource'], $id);
        } catch (PDOException $e) {
            // foreign key RESTRICT: something (a report, room, equipment...) still points to this row
            Response::error('Cannot delete: this ' . strtolower($res['label']) . ' is still in use by other records.', 409);
        }
        AuditLog::log((int) AuthMiddleware::user()['id'], 'reference.delete', $p['resource'], $id, ['name' => $row['name'] ?? null]);
        Response::ok(null, $res['label'] . ' deleted.');
    }

    /** Clean + validate the fields declared for this resource; parents must exist. */
    private static function validated(array $res, ?int $id): array
    {
        $data = [];
        foreach ($res['fields'] as $field => $rule) {
            $data[$field] = str_ends_with($field, '_id') ? Request::input($field) : Validator::clean(Request::input($field));
        }
        $errors = Validator::check($data, $res['fields']);
        foreach ($res['parents'] as $col => $table) {
            if (!isset($errors[$col]) && !Reference::exists($table, (int) $data[$col])) $errors[$col] = 'Select a valid parent record.';
        }
        if ($errors) Response::validation($errors);
        foreach ($res['parents'] as $col => $_) $data[$col] = (int) $data[$col];
        return $data;
    }
}
