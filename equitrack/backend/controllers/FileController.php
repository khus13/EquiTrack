<?php
/**
 * controllers/FileController.php
 * Report photos are streamed through PHP. Report-detail photos require permission;
 * the public directory exposes photos only for reports linked to equipment.
 */
class FileController
{
    /** GET /api/report-images/{id} */
    public static function reportImage(array $p): never
    {
        $img = Report::image((int) $p['id']) ?? Response::error('Image not found.', 404);
        $me  = AuthMiddleware::user();
        if ((int) $img['user_id'] !== (int) $me['id'] && !AuthMiddleware::atLeast('admin')) {
            Response::error('You do not have permission to view this image.', 403);
        }
        $path = Uploader::absolutePath($img['file_path']);
        if ($path === null || !is_file($path)) {
            Response::error('Image file is missing.', 404);
        }
        header('Content-Type: ' . $img['mime_type']);
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: private, max-age=86400');
        header('Content-Disposition: inline; filename="' . preg_replace('/[^\w.\-]/', '_', $img['original_name'] ?: 'photo') . '"');
        readfile($path);
        exit;
    }

    /** GET /api/public-report-images/{id}?report_id={id} */
    public static function publicReportImage(array $p): never
    {
        $reportId = filter_var(Request::query('report_id'), FILTER_VALIDATE_INT);
        if (!$reportId || $reportId < 1) {
            Response::error('Report image not found.', 404);
        }
        $img = Report::publicImage((int) $reportId, (int) $p['id'])
            ?? Response::error('Report image not found.', 404);
        $path = Uploader::absolutePath($img['file_path']);
        if ($path === null || !is_file($path)) {
            Response::error('Image file is missing.', 404);
        }
        header('Content-Type: ' . $img['mime_type']);
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: public, max-age=300');
        header('Content-Disposition: inline; filename="' . preg_replace('/[^\w.\-]/', '_', $img['original_name'] ?: 'photo') . '"');
        readfile($path);
        exit;
    }

    /** GET /api/equipment/{id}/image */
    public static function equipmentImage(array $p): never
    {
        $img = Equipment::directoryImage((int) $p['id']) ?? Response::error('Directory image not found.', 404);
        $path = Uploader::absolutePath($img['file_path']);
        if ($path === null || !is_file($path)) {
            Response::error('Image file is missing.', 404);
        }
        header('Content-Type: ' . $img['mime_type']);
        header('Content-Length: ' . filesize($path));
        header('Cache-Control: public, max-age=300');
        header('Content-Disposition: inline; filename="' . preg_replace('/[^\w.\-]/', '_', $img['original_name'] ?: 'photo') . '"');
        readfile($path);
        exit;
    }
}
