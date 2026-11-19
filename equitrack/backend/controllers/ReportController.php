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

    /** GET /api/public-reports/{id} */
    public static function publicSummary(array $p): never
    {
        $report = Report::publicSummary((int) $p['id'])
            ?? Response::error('Report not found.', 404);
        Response::ok($report);
    }

    /** PATCH /api/reports/{id}   (owner or admin) */
    public static function update(array $p): never
    {
        $id = (int) $p['id'];
        $me = AuthMiddleware::user();
        $report = Report::find($id) ?? Response::error('Report not found.', 404);
        if ((int) $report['user_id'] !== (int) $me['id'] && !AuthMiddleware::atLeast('admin')) {
            Response::error('You do not have permission to edit this report.', 403);
        }

        $data = [
            'item_name'      => Validator::clean(Request::input('item_name')),
            'category_id'    => Request::input('category_id'),
            'campus_id'      => Request::input('campus_id'),
            'building_name'  => Validator::clean(Request::input('building_name')),
            'room_name'      => Validator::clean(Request::input('room_name')),
            'location_note'  => Validator::clean(Request::input('location_note')),
            'damage_type_id' => Request::input('damage_type_id'),
            'description'    => Validator::clean(Request::input('description')),
            'priority'       => (string) Request::input('priority', ''),
        ];
        $errors = Validator::check($data, [
            'item_name'      => 'required|max:150',
            'category_id'    => 'required|int',
            'campus_id'      => 'required|int',
            'building_name'  => 'required|max:120',
            'room_name'      => 'required|max:120',
            'damage_type_id' => 'required|int',
            'description'    => 'max:2000',
            'priority'       => 'required|in:' . implode(',', Report::PRIORITIES),
            'location_note'  => 'max:190',
        ]);

        if (!isset($errors['category_id']) && !Reference::exists('categories', (int) $data['category_id'])) {
            $errors['category_id'] = 'Select a valid category.';
        }
        if (!isset($errors['damage_type_id']) && !Reference::exists('damage_types', (int) $data['damage_type_id'])) {
            $errors['damage_type_id'] = 'Select a valid damage type.';
        }
        if (!isset($errors['campus_id']) && !Reference::exists('campuses', (int) $data['campus_id'])) {
            $errors['campus_id'] = 'Select a valid campus.';
        }
        if ($errors) Response::validation($errors);

        $location = Reference::resolveLocation((int) $data['campus_id'], $data['building_name'], $data['room_name']);
        $data['building_id'] = $location['building_id'];
        $data['room_id'] = $location['room_id'];
        foreach (['category_id', 'campus_id', 'building_id', 'room_id', 'damage_type_id'] as $key) {
            $data[$key] = (int) $data[$key];
        }
        $data['location_note'] = $data['location_note'] !== '' ? $data['location_note'] : null;

        Report::updateDetails($id, $data);
        AuditLog::logNewLocations((int) $me['id'], $location, (int) $data['campus_id'], $data['building_name'], $data['room_name']);
        AuditLog::log((int) $me['id'], 'report.update', 'report', $id, ['item' => $data['item_name']]);
        Response::ok(Report::find($id), 'Report updated.');
    }

    /** POST /api/reports/{id}/images   (owner or admin) */
    public static function addImage(array $p): never
    {
        $id = (int) $p['id'];
        $me = AuthMiddleware::user();
        $report = Report::find($id) ?? Response::error('Report not found.', 404);
        if ((int) $report['user_id'] !== (int) $me['id'] && !AuthMiddleware::atLeast('admin')) {
            Response::error('You do not have permission to edit this report.', 403);
        }

        $upload = Uploader::saveImage($_FILES['photo'] ?? null);
        if ($upload['error']) Response::validation(['photo' => $upload['error']]);
        if ($upload['file'] === null) Response::validation(['photo' => 'Choose a photo to upload.']);

        try {
            Report::addImage($id, $upload['file']);
        } catch (Throwable $e) {
            Uploader::delete($upload['file']['file_path']);
            throw $e;
        }
        AuditLog::log((int) $me['id'], 'report.image_add', 'report', $id);
        Response::ok(Report::find($id), 'Photo added to report.');
    }

    /** POST /api/reports   (multipart/form-data because of the photos) */
    public static function store(array $p): never
    {
        $me = AuthMiddleware::user();
        $data = [
            'item_name'      => Validator::clean(Request::input('item_name')),
            'category_id'    => Request::input('category_id'),
            'campus_id'      => Request::input('campus_id'),
            'building_name'  => Validator::clean(Request::input('building_name')),
            'room_name'      => Validator::clean(Request::input('room_name')),
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
            'building_name'  => 'required|max:120',
            'room_name'      => 'required|max:120',
            'damage_type_id' => 'required|int',
            'description'    => 'max:2000',
            'priority'       => 'required|in:' . implode(',', Report::PRIORITIES),
            'location_note'  => 'max:190',
        ]);

        // The campus must exist; typed buildings and rooms are resolved below.
        if (!isset($errors['category_id'])    && !Reference::exists('categories', (int) $data['category_id']))       $errors['category_id'] = 'Select a valid category.';
        if (!isset($errors['damage_type_id']) && !Reference::exists('damage_types', (int) $data['damage_type_id'])) $errors['damage_type_id'] = 'Select a valid damage type.';
        if (!isset($errors['campus_id']) && !Reference::exists('campuses', (int) $data['campus_id']))               $errors['campus_id'] = 'Select a valid campus.';
        $equipmentId = null;
        if ($data['equipment_id'] !== null && $data['equipment_id'] !== '') {
            if (!Reference::exists('equipment', (int) $data['equipment_id'])) $errors['equipment_id'] = 'Selected equipment does not exist.';
            else $equipmentId = (int) $data['equipment_id'];
        }

        // Optional photos (jpg/png, max 2MB each) - validated BEFORE saving anything.
        $upload = Uploader::saveImages($_FILES['photos'] ?? $_FILES['photo'] ?? null);
        if ($upload['error']) $errors['photos'] = $upload['error'];

        if ($errors) {
            foreach ($upload['files'] as $image) Uploader::delete($image['file_path']);
            Response::validation($errors);
        }

        try {
            $location = Reference::resolveLocation((int) $data['campus_id'], $data['building_name'], $data['room_name']);
        } catch (Throwable $e) {
            foreach ($upload['files'] as $image) Uploader::delete($image['file_path']);
            throw $e;
        }
        $data['building_id'] = $location['building_id'];
        $data['room_id'] = $location['room_id'];
        if ($equipmentId === null) $equipmentId = Equipment::matchReport($data);

        $data['equipment_id'] = $equipmentId;
        foreach (['category_id', 'campus_id', 'building_id', 'room_id', 'damage_type_id'] as $k) $data[$k] = (int) $data[$k];
        $data['location_note'] = $data['location_note'] !== '' ? $data['location_note'] : null;

        try {
            $id = Report::create($data, (int) $me['id'], $upload['files']);
        } catch (Throwable $e) {
            foreach ($upload['files'] as $image) Uploader::delete($image['file_path']);
            throw $e;
        }
        AuditLog::logNewLocations((int) $me['id'], $location, (int) $data['campus_id'], $data['building_name'], $data['room_name']);
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

    /** DELETE /api/reports/{id}   owner or admin */
    public static function destroy(array $p): never
    {
        $id = (int) $p['id'];
        $me = AuthMiddleware::user();
        $report = Report::find($id) ?? Response::error('Report not found.', 404);

        $isOwner = (int) $report['user_id'] === (int) $me['id'];
        if (!$isOwner && !AuthMiddleware::atLeast('admin')) {
            Response::error('You can only delete your own reports.', 403);
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
