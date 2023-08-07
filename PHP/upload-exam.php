<?php
// Set the log file path
$log_file_path = 'error.log';

if ($_SERVER['CONTENT_TYPE'] == 'application/json') {
    // Get the JSON data from the request
    $jsonContent = file_get_contents('php://input');
    $requestData = json_decode($jsonContent, true);

    // Check if JSON is valid and if fileName is set
    if (json_last_error() == JSON_ERROR_NONE && isset($requestData['fileName']) && isset($requestData['data'])) {

        // Get the file name and data
        $fileName = basename($requestData['fileName']); // Use basename to prevent path traversal attacks
        $jsonData = json_encode($requestData['data']);

        if (!is_dir('JSON')) {
            mkdir('JSON', 0777, true);
        }
        
        $dir = dirname(dirname(__FILE__)); // Path to the folder containing the 'JSON' directory
        $filePath = $dir . '/JSON/' . $fileName; // Full path to the 'JSON' directory

        // Save the file
        if (file_put_contents($filePath, $jsonData)) {
            echo 'File saved successfully';
        } else {
            http_response_code(500);
            echo 'An error occurred while saving the file';
        }
    } else {
        http_response_code(400);
        echo 'Invalid JSON data or missing file name';
    }
} else {
    http_response_code(400);
    echo 'Request does not contain JSON data';
}
?>
