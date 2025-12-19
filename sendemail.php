<?php

// Read the form values
$userName = isset( $_POST['username'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['username'] ) : "";
$senderEmail = isset( $_POST['email'] ) ? preg_replace( "/[^\.\-\_\@a-zA-Z0-9]/", "", $_POST['email'] ) : "";
$userPhone = isset( $_POST['phone'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['phone'] ) : "";
$userCountry = isset( $_POST['country'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['country'] ) : "";
$userState = isset( $_POST['state'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['state'] ) : "";
$userCity = isset( $_POST['city'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['city'] ) : "";
$userSubject = isset( $_POST['subject'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['subject'] ) : "";
$message = isset( $_POST['message'] ) ? preg_replace( "/(From:|To:|BCC:|CC:|Subject:|Content-Type:)/", "", $_POST['message'] ) : "";

// If all values exist, call the API
if ( $userName && $senderEmail && $userPhone && $userSubject && $message) {
  // Prepare the data for the API
  $data = array(
    'name' => $userName,
    'email' => $senderEmail,
    'number' => $userPhone,
    'country' => $userCountry,
    'state' => $userState,
    'city' => $userCity,
    'subject' => $userSubject,
    'message' => $message
  );

  // Initialize cURL
  $ch = curl_init();

  // Set the API endpoint
  curl_setopt($ch, CURLOPT_URL, 'http://localhost:8007/send-email');
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
  curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

  // Execute the request
  $response = curl_exec($ch);

  // Check for errors
  if (curl_errno($ch)) {
    $success = false;
  } else {
    // Check the HTTP status code
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    if ($http_code >= 200 && $http_code < 300) {
      $success = true;
    } else {
      $success = false;
    }
  }

  // Close cURL
  curl_close($ch);

  // Set Location After Submission
  if ($success) {
    header('Location: contact.html?message=Successfull');
  } else {
    header('Location: contact.html?message=Failed');
  }
} else {
  // Set Location After Unsuccessful Submission
  header('Location: contact.html?message=Failed');
}

?>
