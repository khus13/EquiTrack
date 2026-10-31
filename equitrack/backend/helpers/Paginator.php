<?php
/**
 * helpers/Paginator.php
 * Reads ?page= and ?per_page= and builds a safe LIMIT/OFFSET clause.
 * LIMIT values are integers we validated ourselves, so they are safe to inline.
 */
class Paginator
{
    public static function params(int $defaultPerPage = 10): array
    {
        $page    = Request::intQuery('page', 1, 1, 100000);
        $perPage = Request::intQuery('per_page', $defaultPerPage, 1, 100);
        return [$page, $perPage, ($page - 1) * $perPage];
    }

    /** Escape % and _ so users can search for them literally. Use with:  LIKE ? ESCAPE '!' */
    public static function like(string $term): string
    {
        return '%' . str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $term) . '%';
    }
}
