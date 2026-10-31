<?php
/**
 * controllers/ReportController.php
 *   - users see and create THEIR OWN reports
 *   - admins see all reports and change their status
 */
class ReportController
{
    /** GET /api/reports?q=&status=&priority=&category_id=&campus_id=&building_id=&sort=&dir=&page=&per_page= */
    public static function index(array $p): never
    {
        $me = AuthMiddleware::user();
        [$page, $perPage, $offset] = Paginator::params(10);

        $filters = [
            'q'           => Validator::clean(Request::query('q', '')),
            'status'      => in_array(Request::query('status'), Report::STATUSES, true) ? Request::query('status') : null,
            'priority'    => in_array(Request::query('priority'), Report::PRIORITIES, true) ? Request::query('priority') : null,
            'category_id' => Request::query('category_id'),
            'campus_id'   => Request::query('campus_id'),
            'building_id' => Request::query('building_id'),
            'equipment_id'=> Request::query('equipment_id'),
            'from'        => self::date(Request::query('from')),
            'to'          => self::date(Request::query('to')),
            'sort'        => Request::query('sort'),
            'dir'         => Request::query('dir'),
        ];
        // Regular users can ONLY ever see their own reports - enforced here, not in the browser.
        if (!AuthMiddleware::atLeast('admin')) {
            $filters['user_id'] = (int) $me['id'];
        }
        [$rows, $total] = Report::paginate($filters, $perPage, $offset);
        Response::paginated($rows, $total, $page, $perPage);
    }

    /** GET /api/reports/{id} */
    public static function show(array $p): never
    {
        $report = Report::find((int) $p['id']) ?? Response::error('Report not found.', 404);
        self::mustSee($report);
        Response::ok($report);
    }

    /** POST /api/reports   (multipart/form-data because of the photo) */
    public static function store(array $p): never
    {
        $me = AuthMiddleware::user();
        $data = [
            'item_name'      => Validator::clean(Request::input('item_name')),
            'category_id'    => Request::input('category_id'),
            'campus_id'      => Request::input('campus_id'),
            'building_id'    => Request::input('building_id'),
            'room_id'        => Request::input('room_id'),
            'location_note'  => Validator::clean(Request::input('location_note')),
            'damage_type_id' => Request::input('damage_type_id'),
            'description'    => Validator::clean(Request::input('description')),
            'priority'       => (string) Request::input('priority', ''),
            'equipment_id'   => Request::input('equipment_id'),
        ];

        $errors = Validator::check($data, [
            'item_name'      => 'required|max:150',
            'category_id'    => 'required|int',
            'campus_id'      => 'required|int',
            'building_id'    => 'required|int',
            'room_id'        => 'required|int',
            'damage_type_id' => 'required|int',
            'description'    => 'required|min:10|max:2000',
            'priority'       => 'required|in:' . implode(',', Report::PRIORITIES),
            'location_note'  => 'max:190',
        ]);

        // The chosen ids must exist AND fit together (room belongs to building belongs to campus).
        if (!isset($errors['category_id'])    && !Reference::exists('categories', (int) $data['category_id']))       $errors['category_id'] = 'Select a valid category.';
        if (!isset($errors['damage_type_id']) && !Reference::exists('damage_types', (int) $data['damage_type_id'])) $errors['damage_type_id'] = 'Select a valid damage type.';
        if (!isset($errors['campus_id']) && !Reference::exists('campuses', (int) $data['campus_id']))               $errors['campus_id'] = 'Select a valid campus.';
        if (!isset($errors['building_id']) && !isset($errors['campus_id'])
            && !Database::value('SELECT 1 FROM buildings WHERE id = ? AND campus_id = ?', [(int) $data['building_id'], (int) $data['campus_id']])) {
            $errors['building_id'] = 'That building is not on the selected campus.';
        }
        if (!isset($errors['room_id']) && !isset($errors['building_id'])
            && !Database::value('SELECT 1 FROM rooms WHERE id = ? AND building_id = ?', [(int) $data['room_id'], (int) $data['building_id']])) {
            $errors['room_id'] = 'That room is not in the selected building.';
        }
        $equipmentId = null;
        if ($data['equipment_id'] !== null && $data['equipment_id'] !== '') {
            if (!Reference::exists('equipment', (int) $data['equipment_id'])) $errors['equipment_id'] = 'Selected equipment does not exist.';
            else $equipmentId = (int) $data['equipment_id'];
        }

        // Optional photo (jpg/png, max 2MB) - validated BEFORE saving anything.
        $upload = Uploader::saveImage($_FILES['photo'] ?? null);
        if ($upload['error']) $errors['photo'] = $upload['error'];

        if ($errors) {
            if ($upload['file']) Uploader::delete($upload['file']['file_path']);    // do not keep files of rejected forms
            Response::validation($errors);
        }

        $data['equipment_id'] = $equipmentId;
        foreach (['category_id', 'campus_id', 'building_id', 'room_id', 'damage_type_id'] as $k) $data[$k] = (int) $data[$k];
        $data['location_note'] = $data['location_note'] !== '' ? $data['location_note'] : null;

        try {
            $id = Report::create($data, (int) $me['id'], $upload['file']);
        } catch (Throwable $e) {
            if ($upload['file']) Uploader::delete($upload['file']['file_path']);
            throw $e;
        }
        AuditLog::log((int) $me['id'], 'report.create', 'report', $id, ['item' => $data['item_name'], 'priority' => $data['priority']]);
        Response::created(Report::find($id), 'Report submitted. Thank you!');
    }

    /** PATCH /api/reports/{id}/status   (admin)  body: {status, remarks} */
    public static function updateStatus(array $p): never
    {
        $id = (int) $p['id'];
        $me = AuthMiddleware::user();
        $report = Report::find($id) ?? Response::error('Report not found.', 404);

        $status  = (string) Request::input('status', '');
        $remarks = Validator::clean(Request::input('remarks'));
        $errors = Validator::check(['status' => $status, 'remarks' => $remarks], [
            'status'  => 'required|in:' . implode(',', Report::STATUSES),
            'remarks' => 'max:1000',
        ]);
        if ($errors) Response::validation($errors);
        if ($status === $report['status'] && $remarks === '') {
            Response::validation(['status' => 'The report is already "' . $status . '". Add remarks or pick another status.']);
        }

        Report::changeStatus($id, $status, (int) $me['id'], $remarks !== '' ? $remarks : null);
        AuditLog::log((int) $me['id'], 'report.status', 'report', $id, ['from' => $report['status'], 'to' => $status]);
        Response::ok(Report::find($id), $status === 'Solved' ? 'Report marked as solved.' : 'Status updated.');
    }

    /** DELETE /api/reports/{id}   owner (only while Pending) or super admin */
    public static function destroy(array $p): never
    {
        $id = (int) $p['id'];
        $me = AuthMiddleware::user();
        $report = Report::find($id) ?? Response::error('Report not found.', 404);

        $isOwnerPending = (int) $report['user_id'] === (int) $me['id'] && $report['status'] === 'Pending';
        if (!$isOwnerPending && !AuthMiddleware::atLeast('super_admin')) {
            Response::error('You can only delete your own reports while they are still Pending.', 403);
        }
        Report::delete($id);
        AuditLog::log((int) $me['id'], 'report.delete', 'report', $id, ['item' => $report['item_name']]);
        Response::ok(null, 'Report deleted.');
    }

    /** A user may open only their own report; admins may open any. */
    private static function mustSee(array $report): void
    {
        $me = AuthMiddleware::user();
        if ((int) $report['user_id'] !== (int) $me['id'] && !AuthMiddleware::atLeast('admin')) {
            Response::error('You do not have permission to view this report.', 403);
        }
    }

    private static function date($v): ?string
    {
        return is_string($v) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $v) ? $v : null;
    }
}
