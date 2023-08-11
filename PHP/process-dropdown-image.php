<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['imageUrl'])) {
    $imageUrl = $_POST['imageUrl'];

    // Validate the URL (you might want to add more validation)
    if (filter_var($imageUrl, FILTER_VALIDATE_URL)) {
        // Get the image extension
        $extension = pathinfo(parse_url($imageUrl, PHP_URL_PATH), PATHINFO_EXTENSION);
        
        // Create a unique filename for the saved image
        $filename = uniqid() . '.' . $extension;
        
        // Set the path to save the image on your server
        $savePath = $filename;
        
        // Download the image and save it to the server
        $downloaded = file_put_contents($savePath, file_get_contents($imageUrl));
        
        if ($downloaded !== false) {
            // Return the local URL of the saved image
            echo json_encode(['localImageUrl' => $savePath]);
        } else {
            echo json_encode(['error' => 'Image download failed']);
        }
    } else {
        echo json_encode(['error' => 'Invalid image URL']);
    }
} else {
    echo json_encode(['error' => 'Invalid request']);
}
?>