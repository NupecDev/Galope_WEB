<?php

// Read the form values
$userName = isset( $_POST['username'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['username'] ) : ( isset( $_POST['name'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['name'] ) : "" );
$senderEmail = isset( $_POST['email'] ) ? preg_replace( "/[^\.\-\_\@a-zA-Z0-9]/", "", $_POST['email'] ) : "";
$userPhone = isset( $_POST['phone'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['phone'] ) : "";
$userCountry = isset( $_POST['country'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['country'] ) : "";
$userState = isset( $_POST['state'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['state'] ) : "";
$userCity = isset( $_POST['city'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['city'] ) : "";
$horseNum = isset( $_POST['horse-num'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['horse-num'] ) : "";
$horseActivity = isset( $_POST['horse-activity'] ) ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/u", "", $_POST['horse-activity'] ) : "";
$userSubject = isset( $_POST['subject'] ) && trim( $_POST['subject'] ) !== "" ? preg_replace( "/[^\s\S\.\-\_\@a-zA-Z0-9]/", "", $_POST['subject'] ) : "Nuevo registro en Galope";
$message = isset( $_POST['message'] ) && trim( $_POST['message'] ) !== "" ? preg_replace( "/(From:|To:|BCC:|CC:|Subject:|Content-Type:)/", "", $_POST['message'] ) : "";

// If this came from the signup form, build a message body from the extra fields
if ( $message === "" && ( $horseNum || $horseActivity ) ) {
  $messageLines = array();
  if ( $horseNum ) {
    $messageLines[] = "Número de caballos: " . $horseNum;
  }
  if ( $horseActivity ) {
    $messageLines[] = "Disciplina principal: " . $horseActivity;
  }
  $message = implode( "\n", $messageLines );
}

// Determine where to redirect back to based on the referring form
$redirectPage = 'contact.html';
if ( isset( $_POST['form-source'] ) ) {
  if ( $_POST['form-source'] === 'signup' ) {
    $redirectPage = 'signup.html';
  } elseif ( $_POST['form-source'] === 'contact' ) {
    $redirectPage = 'contact.html';
  }
} elseif ( !empty( $_SERVER['HTTP_REFERER'] ) && strpos( $_SERVER['HTTP_REFERER'], 'signup.html' ) !== false ) {
  $redirectPage = 'signup.html';
}

// If all values exist, call the API
if ( $userName && $senderEmail && $userPhone && $userSubject && $message) {
  // Prepare the data for the API (mailing.py expects a JSON body via Pydantic)
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
  curl_setopt($ch, CURLOPT_URL, 'https://api.galopemx.com/send-email');
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
    header('Location: ' . $redirectPage . '?message=Successfull');
  } else {
    header('Location: ' . $redirectPage . '?message=Failed');
  }
} else {
  // Set Location After Unsuccessful Submission
  header('Location: ' . $redirectPage . '?message=Failed');
}

?>
