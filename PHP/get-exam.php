<?php
$fileName = $_GET['fileName'];

$dir = dirname(dirname(__FILE__)); // Path to the folder containing the 'JSON' directory
$filePath = $dir . '/JSON/' . $fileName;; // Full path to the 'JSON' directory

// Check if the file exists
if (file_exists($filePath)) {
  // Read the file content
  $fileContent = file_get_contents($filePath);
  
  // Set the appropriate content type for JSON
  header('Content-Type: application/json');

  // Echo the file content
  echo $fileContent;
} else {
  // Handle the error if the file does not exist
  http_response_code(404);
  echo json_encode(['error' => 'File not found']);
}
?>

