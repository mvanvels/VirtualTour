<?php
/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 2/17/2018
  Notes:
   This file includes common helper functions and is self-sustaining

   Please read notes as some functions are not intended for production ready code
 */ 

 /**
  * Helper function for quickly adding new lines to html output
  * @param  integer optional $qty number of new lines to add - defaults to 1
  * @return String  number of new lines requested as <br> html entity
  */
  function html_newline($qty = 1) {
    $result = "<br>";
    for ($i=1; $i < $qty; $i++) {
      $result = $result . "<br>";
    }
    return $result;
  }
 /**
  * Helper function for quickly adding spaces to html output
  * @param  integer optional $qty number of spaces to add - defaults to 1
  * @return String  number of new spaces requested as $nbsp; html entity
  */
  function html_nbsp($qty = 1) {
    $result = "&nbsp;";
    for ($i=1; $i < $qty; $i++) {
      $result = $result . "&nbsp;";
    }
    return $result;
  }
 /**
  * This scans a directory and return files that exist in the directory that DO NOT exist in the passed array
  * This is not recursive and omits directories by intention
  * @param  String $dir    directory to check
  * @param  Array $in_files Array of files to check if they exist
  * @return Array         returns an array of files that are in the directory that are NOT in the files array passed
  */
  function scandir_diff($dir, $in_files) {
    if (!file_exists($dir) || !is_array($in_files)) return [];

    $dir_files = array_slice(scandir($dir), 2);
    #remove subdirectories
    foreach ($dir_files as $key => $value) {
      if (is_dir($dir . $value)) array_splice($dir_files, $key, 1);
    }

    array_walk($in_files, 'filterParentDir', $dir);

    return array_diff($dir_files,$in_files); #files that are in directory that not in in_array
  }
 /**
  * Helper function for scandir_diff
  * Removes the parent dir path from the filepath, this is needed ONLY because how we store it in MYSQL db. the entire path is stored in the database, but scandir doesn't include the parent path in returns
  * see array_walk()
  */
  function filterParentDir(&$item, $key, $dir) {
    if (substr($item,0,strlen($dir)) === $dir) $item = substr($item,strlen($dir));
  }

 /**
  * Deletes files from directory
  * Omits subdirectories by default [not recursive]
  * Do NOT pass absolute paths into files array
  *
  * NOTE: it would far too complicated to narrow down if something was successful since this could
  * be used for various reasons. Should move to own class if further details are needed, like 
  * which files weren't successful, which files are not apart of the dir etc.
  * @param  Array $files files to be deleted from the directory
  * @param  String $dir   Valid directory
  */
  function unlink_files_from_dir($files, $dir) {
    if (!is_dir($dir)) throw new \Exception("Parameter 2 is expecting a valid directory", 1);
    if (!is_array($files)) throw new \Exception("Parameter 1 is expecting array of filepaths", 1);

    (substr($dir, -1) === "/") ?: $dir.="/";

    foreach ($files as $key => $value) {
      (substr($value, 0, 1) !== "/") ?: $value = substr($value,1);
      if (is_file($dir.$value)) @unlink($dir.$value); #if it's not there we don't care
    }
  }
 /**
  * Deletes an entire directory, recursively, including it's contents.
  * This works for files that normally aren't considered valid file type/extension.
  * @param String $dir Valid directory
  */
  function unlink_dir($dir) { 
    if (is_dir($dir)) { 
      $objects = scandir($dir); 
      foreach ($objects as $object) { 
        if ($object != "." && $object != "..") { 
          if (is_dir($dir."/".$object))
            unlink_dir($dir."/".$object);
          else
            unlink($dir."/".$object); 
        } 
      }
      rmdir($dir); 
    } 
  }
 /**
  * Prettifies an array to human readable parsing. This takes up a lot of vertical space when nested arrays are present, so use wisely.
  * This is not in-depth replacement of var_dump, only makes it easier to read. Only thing that is included with output is datatype and the key/value (KV) values.
  * The count of each nested array is included in brackets [<count>] next to the key value
  *
  * This works with Objects...for the most part
  *
  * NOTE: THIS IS FOR DEBUG PURPOSES ONLY, DO NOT USE THIS IN ANY PRODUCTION READY CODE FOR
  * MANY REASONS, BUT THE MOST OBVIOUS, debug_backtrace() AND PERFORMANCE
  *
  * You should only pass an array (first argument), the other 2 parameters are for recursion purposes only
  *
  * @param  [Array]  &$arr         Array to prettify, passed as reference. This is the only parameter that should be used outside the scope of this function
  * @param  integer $offset      [offset from left in number of spaces, this should not be used outside the scope of this function]
  * @param  boolean $isRecursive [identifies if the current call is a recursive iteration, this should not be used outside the scope of this function]
  * @return [String]               prettified string in HTML format
  */
  function array_prettify(&$arr, $offset = 2, $isRecursive = false) {
      if (!is_array($arr)) throw new \Exception("Error Processing Request. Expected array to be passed for first parameter");

      $bt = debug_backtrace();
      $_arr = array_shift($bt);

      $varname = "unknown_identifier"; $result = "";
      //get the name of the array passed
      foreach ($GLOBALS as $name => $val) {
        if ($val === $arr) {
          $varname = $name;
          break;
        }
      }
      //only output the variable name if it's the first run
      (!$isRecursive) ? $result .= "$" . $varname . " [" . count($arr) . "] => (" . gettype($arr) . ") | Caller => " . $_arr["file"] . " | Line# => " . $_arr["line"]  : "";
      $_cursor = 2 + $offset;
      $result .= html_newline() . html_nbsp($_cursor) . "[" . html_newline();

      foreach ($arr as $key => $value) {
        //check if value is another array, if so continue with recursion and offset based on current cursor point
        if (is_array($value)) {
          $keyIdentifier = $key . " [" . count($value) . "] => (" . gettype($value) . ")";
          $result .= html_nbsp($_cursor + 2) . $keyIdentifier . array_prettify($value, ceil((strlen($keyIdentifier) + $_cursor)/1.15), true);
        } elseif (is_object($value)) {
          $keyIdentifier = $key . " [" . @count($value) . "] => (" . gettype($value) . ")";
          $result .= html_nbsp($_cursor + 2) . $keyIdentifier . @array_prettify(json_decode(json_encode($value),true), ceil((strlen($keyIdentifier) + $_cursor)/1.15), true);
        } else {
          $result .= html_nbsp($_cursor + 2) . $key . " => (" . gettype($value) . ") " . $value;
          if ($value !== end($arr)) $result .= ",";
          $result .= html_newline();
        }
      }

      $result .= html_nbsp(2 + $offset) . "]" . html_newline();
      return $result;
  }

 /**
  * Console.logs the array as a traversable object.
  * @param  [array()] $arr array to log as object. This is not passed as a reference
  */
  function array_consoleify($arr) {
    if (!is_array($arr)) throw new \Exception("Error Processing Request. Expected array to be passed for first parameter", 1);

    return console_log(json_encode($arr));
  }
 /**
  * Console.logs to browser. This does not return
  * @param  Any $val value to be logged
  */
  function console_log($val) {
    echo "<script>console.log(" . $val . ");</script>";
  }

 /**
 * Send a POST requst using cURL
 * @param string $url to request
 * @param array $post values to send
 * @param array $options for cURL
 * @return string
 */
 function curl_post($url, array $post = NULL, array $options = array()) {
    $defaults = array(
        CURLOPT_POST => 1,
        CURLOPT_HEADER => 0,
        CURLOPT_URL => $url,
        CURLOPT_FRESH_CONNECT => 1,
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_FORBID_REUSE => 1,
        CURLOPT_TIMEOUT => 60,
        CURLOPT_POSTFIELDS => http_build_query($post)
    );

    $ch = curl_init();
    curl_setopt_array($ch, ($options + $defaults));
    if( ! $result = curl_exec($ch))
    {
        trigger_error(curl_error($ch));
    }
    curl_close($ch);
    return $result;
 }

  /**
   * Send a GET requst using cURL
   * @param string $url to request
   * @param array $get values to send
   * @param array $options for cURL
   * @return string
   */
  function curl_get($url, array $get = NULL, array $options = array()) {
      $defaults = array(
          CURLOPT_URL => $url. (strpos($url, '?') === FALSE ? '?' : ''). http_build_query($get),
          CURLOPT_HEADER => 0,
          CURLOPT_RETURNTRANSFER => TRUE,
          CURLOPT_TIMEOUT => 60
      );

      $ch = curl_init();
      curl_setopt_array($ch, ($options + $defaults));
      if( ! $result = curl_exec($ch))
      {
          trigger_error(curl_error($ch));
      }
      curl_close($ch);
      return $result;
  }
  
  /**
   * Returns if an HTTP_CODE is within a success range
   * @param $code HTTP_CODE
   */
  function http_response_isOk($code) {
    return ($code >= 200 && $code < 300);
  }
 ?>
