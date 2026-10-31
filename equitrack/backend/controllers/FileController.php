<?php
/**
 * controllers/FileController.php
 * Photos are NOT public files. They are streamed through PHP after a permission check:
 * only the reporter and admins may view a report photo.
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
}
