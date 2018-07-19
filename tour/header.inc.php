<!-- GET TOUR INFO FOR USER -->
<?php
  require_once("../php/globals.inc.php");

  $uri = explode("/", $_SERVER["REQUEST_URI"]);
  
  $db->where('USER_USERNAME', $uri[3]);
  $user = $db->getOne("USER");
  
  if ($user === NULL) {
    // user not found (404 or redirect)
    die("Could not find user");
  }
  
  define('USER_NAME', $user['USER_USERNAME']);  
  define('USER_ID', $user["USER_ID"]);  

  $user = NULL;
  
  ?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Tour - <?php echo USER_NAME; ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="http://tourbytouch.com/bootstrap/css/bootstrap.min.css">
  <link rel="stylesheet" href="../css/globals.css">
  <link rel="stylesheet" type="text/css" media="screen" href="main.css" />
  <link rel="stylesheet" type="text/css" media="screen" href="../css/modal.css"/>
</head>
<body>
  <header>
    <div class="logo"><a href=""><img src="../images/logos/logo2.png" alt="SelectMe Services Logo"></a></div>
    <nav>
      <li>About</li>
      <li>Services</li>
      <li>Take A Tour</li>
      <li>Register/Sign In</li>
      <li>Contact</li>
    </nav>
  </header>