<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require __DIR__ . '/../config/config.php';
spl_autoload_register(function (string $class): void {
    foreach (['config', 'helpers', 'middleware', 'models', 'controllers', 'api'] as $dir) {
        $file = __DIR__ . "/../$dir/$class.php";
        if (is_file($file)) {
            require $file;
            return;
        }
    }
});

if (in_array('--apply', $argv, true)) {
    $summary = Report::backfillUnlinkedEquipment();
    printf(
        "Backfill complete: %d old reports linked; %d matched existing equipment; %d directory entries created.\n",
        $summary['processed'],
        $summary['matched'],
        $summary['created']
    );
    exit;
}

$count = (int) Database::value('SELECT COUNT(*) FROM reports WHERE equipment_id IS NULL');
printf("%d older reports currently have no directory entry.\n", $count);
printf("Review the count, then run this script with --apply to backfill them.\n");
