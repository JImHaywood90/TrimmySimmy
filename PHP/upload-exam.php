<?php
// Set the log file path
$log_file_path = 'error.log';

if ($_SERVER['CONTENT_TYPE'] == 'application/json') {
    try {
        // Get the JSON data from the request
        $jsonContent = file_get_contents('php://input');
        $requestData = json_decode($jsonContent, true);

        // Validate JSON
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON data');
        }

        // Validate filename
        if (!isset($requestData['fileName']) || !preg_match('/^[a-zA-Z0-9_-]+\.json$/', $requestData['fileName'])) {
            throw new Exception('Invalid or missing file name');
        }

        // Validate data
        if (!isset($requestData['data'])) {
            throw new Exception('Missing data in request');
        }

        // Get the file name and data
        $fileName = basename($requestData['fileName']); // Use basename to prevent path traversal attacks
        $jsonData = json_encode($requestData['data']);

        if (!is_dir('JSON')) {
            mkdir('JSON', 0777, true);
        }

        $dir = dirname(dirname(__FILE__)); // Path to the folder containing the 'JSON' directory
        $filePath = $dir . '/JSON/' . $fileName; // Full path to the 'JSON' directory

        // Check if the file already exists
        if (file_exists($filePath)) {
            // Create the archive directory name with the current date
            $archive_directory = $dir . "/_Archive" . date('Ymd');

            // Check if the archive directory exists, if not, create it
            if (!file_exists($archive_directory)) {
                mkdir($archive_directory, 0777, true);
            }

            // Move the existing file to the archive directory
            $archive_file = $archive_directory . "/" . $fileName;
            rename($filePath, $archive_file);
        }

        // Save the file
        if (file_put_contents($filePath, $jsonData)) {
            echo 'File saved successfully';
        } else {
            throw new Exception('An error occurred while saving the file');
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo $e->getMessage();
        error_log($e->getMessage(), 3, $log_file_path);
    }
} else {
    http_response_code(400);
    echo 'Request does not contain JSON data';
}
?>
