<?php
/**
 * controllers/StatsController.php
 * Numbers for the dashboards.
 */
class StatsController
{
    /** GET /api/stats/public  (no login - landing page) */
    public static function publicSummary(array $p): never
    {
        Response::ok(Stats::publicSummary());
    }

    /** GET /api/stats/me  (user dashboard) */
    public static function me(array $p): never
    {
        Response::ok(Stats::forUser((int) AuthMiddleware::user()['id']));
    }

    /** GET /api/stats/dashboard  (admin: counts + recent + To Repair) */
    public static function dashboard(array $p): never
    {
        Response::ok(Stats::dashboard());
    }

    /** GET /api/stats/overview  (super admin: charts) */
    public static function overview(array $p): never
    {
        Response::ok(Stats::overview());
    }
}
