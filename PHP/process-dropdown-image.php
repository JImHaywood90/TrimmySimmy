<?php
$imageUrl = $_GET['imageUrl'];

// Download the image and store it locally
$tempImageFile = 'temp_image.jpg';
file_put_contents($tempImageFile, file_get_contents($imageUrl));

// Run Tesseract.js on the local image
$ocrResult = shell_exec("tesseract $tempImageFile stdout");

echo $ocrResult
?>
