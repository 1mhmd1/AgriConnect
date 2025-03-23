<?php
session_start();

// Clear all session variables
$_SESSION = [];

// Regenerate session ID and delete old session file
session_regenerate_id(true);

// Destroy the session
session_destroy();

// Redirect to login page
header("Location: login.php");
exit();
?>