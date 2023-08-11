<?php
$imageUrl = $_GET['imageUrl'];

// Download the image and store it locally
$tempImageFile = 'temp_image.jpg';
file_put_contents($tempImageFile, file_get_contents($imageUrl));

// Run Tesseract.js on the local image
$ocrResult = shell_exec("tesseract $tempImageFile stdout");

// Delete the downloaded image
unlink($tempImageFile);

// Parse the OCR result to extract question and options
function parseDropdownText($text) {
    $lines = explode("\n", $text);
    $parsedQuestion = '';
    $parsedOptions = [];

    foreach ($lines as $line) {
        $trimmedLine = trim($line);
        $colonIndex = strpos($trimmedLine, ':');
        
        if ($colonIndex !== false) {
            $parsedQuestion = trim(substr($trimmedLine, 0, $colonIndex));
        } elseif (!empty($trimmedLine)) {
            $parsedOptions[] = $trimmedLine;
        }
    }

    return [
        'question' => $parsedQuestion,
        'options' => $parsedOptions
    ];
}

// Use the parseDropdownText function to parse the OCR result
$parsedData = parseDropdownText($ocrResult);

// Return the parsed data as JSON response
header('Content-Type: application/json');
echo json_encode($parsedData);
?>
