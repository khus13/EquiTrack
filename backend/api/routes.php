<?php
/**
 * api/routes.php  -  THE list of every endpoint (read this file to understand the API).
 *
 * Roles:  auth = any logged-in user | role:admin = admin + super admin | role:super_admin = super admin only
 * All write requests (POST/PUT/PATCH/DELETE) also need the X-CSRF-Token header (checked in index.php).
 */
function registerRoutes(Router $r): void
{
    // ---------- Auth (public) ----------
    $r->add('GET',  '/auth/me',       [AuthController::class, 'me']);
    $r->add('GET',  '/auth/csrf',     [AuthController::class, 'csrf']);
    $r->add('POST', '/auth/register', [AuthController::class, 'register']);
    $r->add('POST', '/auth/login',    [AuthController::class, 'login']);
    $r->add('POST', '/auth/logout',   [AuthController::class, 'logout']);

    // ---------- Public numbers for the landing page ----------
    $r->add('GET', '/stats/public', [StatsController::class, 'publicSummary']);

    // ---------- My account ----------
    $r->add('PATCH',  '/profile',            [ProfileController::class, 'update'],         ['auth']);
    $r->add('PATCH',  '/profile/password',   [ProfileController::class, 'changePassword'], ['auth']);
    $r->add('POST',   '/profile/deactivate', [ProfileController::class, 'deactivate'],     ['auth']);
    $r->add('DELETE', '/profile',            [ProfileController::class, 'destroy'],        ['auth']);

    // ---------- Reference data ----------
    $r->add('GET',    '/meta',                    [ReferenceController::class, 'meta'],    ['auth']);
    $r->add('GET',    '/reference/{resource}',    [ReferenceController::class, 'index'],   ['auth', 'role:admin']);
    $r->add('POST',   '/reference/{resource}',    [ReferenceController::class, 'store'],   ['auth', 'role:super_admin']);
    $r->add('PUT',    '/reference/{resource}/{id}',    [ReferenceController::class, 'update'],  ['auth', 'role:super_admin']);
    $r->add('DELETE', '/reference/{resource}/{id}',    [ReferenceController::class, 'destroy'], ['auth', 'role:super_admin']);

    // ---------- Equipment directory ----------
    $r->add('GET',    '/equipment',      [EquipmentController::class, 'index'],   ['auth']);
    $r->add('GET',    '/equipment/{id}', [EquipmentController::class, 'show'],    ['auth']);
    $r->add('POST',   '/equipment',      [EquipmentController::class, 'store'],   ['auth', 'role:super_admin']);
    $r->add('PUT',    '/equipment/{id}', [EquipmentController::class, 'update'],  ['auth', 'role:super_admin']);
    $r->add('DELETE', '/equipment/{id}', [EquipmentController::class, 'destroy'], ['auth', 'role:super_admin']);

    // ---------- Reports ----------
    $r->add('GET',    '/reports',              [ReportController::class, 'index'],        ['auth']);   // users: own only
    $r->add('POST',   '/reports',              [ReportController::class, 'store'],        ['auth']);
    $r->add('GET',    '/reports/{id}',         [ReportController::class, 'show'],         ['auth']);   // owner or admin
    $r->add('PATCH',  '/reports/{id}/status',  [ReportController::class, 'updateStatus'], ['auth', 'role:admin']);
    $r->add('DELETE', '/reports/{id}',         [ReportController::class, 'destroy'],      ['auth']);   // owner(Pending) or super admin
    $r->add('GET',    '/report-images/{id}',   [FileController::class, 'reportImage'],    ['auth']);

    // ---------- Users (super admin) ----------
    $r->add('GET',    '/users',                [UserController::class, 'index'],     ['auth', 'role:super_admin']);
    $r->add('POST',   '/users',                [UserController::class, 'store'],     ['auth', 'role:super_admin']);
    $r->add('GET',    '/users/{id}',           [UserController::class, 'show'],      ['auth', 'role:super_admin']);
    $r->add('PUT',    '/users/{id}',           [UserController::class, 'update'],    ['auth', 'role:super_admin']);
    $r->add('PATCH',  '/users/{id}/status',    [UserController::class, 'setStatus'], ['auth', 'role:super_admin']);
    $r->add('DELETE', '/users/{id}',           [UserController::class, 'destroy'],   ['auth', 'role:super_admin']);

    // ---------- Stats + audit ----------
    $r->add('GET', '/stats/me',        [StatsController::class, 'me'],        ['auth']);
    $r->add('GET', '/stats/dashboard', [StatsController::class, 'dashboard'], ['auth', 'role:admin']);
    $r->add('GET', '/stats/overview',  [StatsController::class, 'overview'],  ['auth', 'role:super_admin']);
    $r->add('GET', '/audit-logs',      [AuditController::class, 'index'],     ['auth', 'role:super_admin']);
}
