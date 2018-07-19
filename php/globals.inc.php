<?php
/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 6/17/2018
  Notes:
   This is thee parent file for most front-end related pages on site.

   This relies on config.ini being a valid file, as does most of the files that included this parent file into the environment
 */ 
  $config = parse_ini_file('../config.ini');

  ($config["IS_DEBUG"] === '1') ? ini_set("display_errors", 1) : ini_set("display_errors", 0);

  if (!empty($config["DEFAULT_TIMEZONE"])) ini_set("date.timezone", $config["DEFAULT_TIMEZONE"]);

  require_once('mysqlidb.class.php');
  require_once('functions.inc.php');

  $db = new mysqlidb($config['DB_HOST'], $config['DB_USER'], $config['DB_PASSCODE'], $config['DB_NAME']);   //mysqlidb.class.php throws exception if not connected
 ?>
