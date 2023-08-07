<?php

$dir = dirname(dirname(__FILE__)); // Path to the folder containing the 'JSON' directory
$dirPath = $dir . '/JSON/'; // Full path to the 'JSON' directory

$files = glob($dirPath . '*.json'); // Search for all .json files in directory

// Use array_map to only return the file names, not the full path
$fileNames = array_map('basename', $files);

header('Content-Type: application/json');
echo json_encode($fileNames); // Output the list of file names in JSON format
?>