<?php
/**
 * helpers/Uploader.php
 * Secure image upload: we never trust the file name or the browser-supplied type.
 *   1. PHP upload error code        4. real image check with getimagesize()
 *   2. size limit (2 MB)            5. random server-side file name + safe extension
 *   3. real MIME type via finfo     6. stored OUTSIDE public access (uploads/ is blocked by .htaccess)
 */
class Uploader
{
    /**
     * @return array{error:?string, file:?array}  error message OR saved file info
     */
    public static function saveImage(?array $file, string $subDir = 'reports'): array
    {
        if ($file === null || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            return ['error' => null, 'file' => null];                 // photo is optional
        }
        $maxMb = round(config('upload.max_bytes') / 1048576, 1);

        if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
            return ['error' => "Image is larger than {$maxMb}MB.", 'file' => null];
        }
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['error' => 'The upload failed. Please try again.', 'file' => null];
        }
        if ($file['size'] > config('upload.max_bytes')) {
            return ['error' => "Image is larger than {$maxMb}MB.", 'file' => null];
        }
        if (!is_uploaded_file($file['tmp_name'])) {
            return ['error' => 'Invalid upload.', 'file' => null];
        }

        $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        $ext  = config('upload.mimes')[$mime] ?? null;
        if ($ext === null) {
            return ['error' => 'Only JPG or PNG images are accepted.', 'file' => null];
        }
        if (@getimagesize($file['tmp_name']) === false) {              // must really be an image
            return ['error' => 'The file is not a valid image.', 'file' => null];
        }

        $dir = rtrim(config('upload.dir'), '/\\') . '/' . $subDir;
        if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
            return ['error' => 'Server cannot store the image.', 'file' => null];
        }
        $name = bin2hex(random_bytes(16)) . '.' . $ext;               // e.g. 9f3c...a1.jpg
        if (!move_uploaded_file($file['tmp_name'], "$dir/$name")) {
            return ['error' => 'Could not save the image.', 'file' => null];
        }
        @chmod("$dir/$name", 0644);

        return ['error' => null, 'file' => [
            'file_path'     => "$subDir/$name",
            'original_name' => mb_substr(preg_replace('/[^\w.\- ]/u', '_', basename($file['name'])), 0, 180),
            'mime_type'     => $mime,
            'file_size'     => (int) $file['size'],
        ]];
    }

    /** Absolute path for a stored file, or null if it would escape the uploads folder. */
    public static function absolutePath(string $relative): ?string
    {
        $base = realpath(config('upload.dir'));
        $full = realpath(config('upload.dir') . '/' . $relative);
        if ($base === false || $full === false || !str_starts_with($full, $base . DIRECTORY_SEPARATOR)) {
            return null;                                              // blocks ../ tricks
        }
        return $full;
    }

    public static function delete(string $relative): void
    {
        $path = self::absolutePath($relative);
        if ($path !== null && is_file($path)) {
            @unlink($path);
        }
    }
}
