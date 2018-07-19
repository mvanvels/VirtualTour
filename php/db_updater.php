<?php
/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 4/17/2018
  Notes:

  All URL parameters shoudl be sent via form/FormData
  This particular script only proceeds if 'action' parameter is set

  All other circumstances are accordingly handled

  This script returns a $response object identifying any relevant information to the request

  This script only displays as json content type

  Naturally, this relies on a very specific table structure. See DEV SQL.txt for all DESCRIBES and CONSTRAINTS if the included import script fails

  This needs some work. 

  Mainly:

    - transaction control where needed (mostly when image creation and storage is handled. Also where images are deleted from server, maps/pois etc)
    - Make sure $response['error'] is more front-end friendly, that way Front End can just pass this to user for errors
 */ 

  require_once('globals.inc.php');
  header('Content-Type: application/json');

  /**
   * the $response object is the only object that displays at end of script
   * 
   * Some associative keys are not instaniated with this object (ex, $response['recentQueryError']) as
   * they are circumstantial.
   * 
   * IMPORTANT: Add to, but do NOT remove keys from this array as front end methods already rely on them.
   * 
   * See function quit() for full ending results
   * 
   *  $response['ok'] => Returns true/false based on the current scripts http code. Must be in 200 range to be considered 'OK'
   *  $response['status'] => displays the actual http code
   *  $response['isError'] => if there was an error with the script anywhere (not just db related), this is manually set when needed
   *  $response['error'] => a description of the error (not db related, db related errors have their own KVP) for example, wrong parameters/arguments provided
   *  $response['body'] => set according to circumstance. Simply whatever body of text you want to pass to response (for example, an id of a newly inserted map (this prevents falsy truths))
   *      if $response['body'] is not set manually, and there is no errors, then it will by default say 'success'
   *  $response['errno'] => this displays the most recent db errno, the script does not short circuit ALL errors, but most of them.
   *  $response['recentQueryError'] => if there is an error, the most recent db query error will be assigned here. This is handled automatically
   * 
   * Note: some of these KVP's do NOT display when IS_DEBUG mode === false. see function quit() for reference and see config.ini for assignment
   */
  $response = array(
    "ok" => http_response_isOk(http_response_code()),
    "status" => http_response_code(),
    "isError" => false,
    "error" => ''
  );
  
  if (isset($_POST['action'])) {
    define('ACTION', $_POST['action']);

    //NOTE: ACTION parameter values are self documenting. Documentation will only be provided in circumstances that look confusing or are unreadable

    //NOTE: Do not call quit(), unless there is an error and you want to short circuit. Otherwise, quit() will eventually be reached
    if (ACTION === 'add_map') {  
      if (!isset($_POST["user_id"]) || !isset($_POST["map_name"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 2";
        quit();
      }    

      $mapData = Array(
        "USER_ID" => $_POST['user_id'],
        "MAP_NAME" => $_POST['map_name']
      );
      
      if ($id = $db->insert("MAP", $mapData)) $response["body"] = $id;
    }
    if (ACTION === 'remove_map') {
      if (!isset($_POST["map_id"]) || !isset($_POST["user_name"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 2";
        quit();
      }

      $db->where("MAP_ID", (int) $_POST["map_id"]);
      if ($db->delete("MAP")) {
        //remove all poi images and map images
        // TODO: validate dir is valid as this can return falsy truth in production ready environment
        unlink_dir($config['IMAGES_PATH_POI'] . $_POST['user_name'] . '/map_' . (int)$_POST["map_id"]);
        unlink_files_from_dir(array("map{$_POST['map_id']}.png"),$config['IMAGES_PATH_MAP'] . $_POST['user_name']);
      } else {
        $response["error"] = "Error removing map from database";
        quit();
      }
    }
    //update_map is set up in a way that can update many poi's at once, without changing anything, however, this proved to be extremely arduous to control front-end
    //update_map updates a lot (map_desc, map_image, as well as new points of interests and videos/images), but we recommend to only use this for updating points of interest specifically
    // There is room for optimization here as some things have been moved to their own statement cases, like update_map_desc, as this proved difficult pleasing many circumanstances at once.
    //You can leave this as is, simply for potential cases where it will be needed, or review for optimization
    if (ACTION === 'update_map') {
      if (!isset($_POST["user_id"]) || !isset($_POST["user_name"]) || !isset($_POST["map_id"]) || !isset($_POST["map_desc"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 4";
        quit();
      }  

      define("MAP_ID", (int) $_POST["map_id"]);
      define("USER_ID", (int) $_POST["user_id"]);
      define("USER_NAME", $_POST["user_name"]);

      $mapData = Array(
        "USER_ID" => USER_ID,
        "MAP_DESC" => $_POST['map_desc']
      );

      if (isset($_POST['map_image']) && strpos($_POST['map_image'], "base64,") > -1) {

        $filename = $config['IMAGES_PATH_MAP'] . USER_NAME . '/map' . MAP_ID . '.png';

        $data = base64_decode_from_string($_POST['map_image']);

        $mapData['MAP_IMAGE'] = $filename;
      }
      
      $db->where("MAP_ID", MAP_ID);
      $db->where("USER_ID", USER_ID);
      if ($db->update("MAP", $mapData) === false) quit();

      //NOTE: If you have not seen the Elvis Operator (?:), I recommend reading up on it to ensure you understand how it performs for PHP respectively, as it's different
      // than a null coalescing operator and some other languages elvis operator
      (file_exists($config['IMAGES_PATH_MAP'] . USER_NAME)) ?: mkdir($config['IMAGES_PATH_MAP'] . USER_NAME . "/", 700, (boolean) $config['MAKEDIR_RECURSIVE']);
      if (isset($data)) file_put_contents($filename, $data);
                
      parse_str($_POST["areas"], $areas);      
      if (empty($areas)) quit(); #if there are no areas to update then there is no reason to continue with the rest of the condition

      $images = array();
      $videos = array();
      $no_videos = array();
      // mysql query that will insert pois, can do multiple rows at once. This will also update if a duplicate key is found
      // This should reduce server calls.
      // However, the downside to this, is, you will have to seperately delete rows that no longer exist. And also, this will not return an error. This will also obfuscate the autoincrememnt number as updating a row with this query technically counts as 2 inserts
      //NOTE: be careful about editing this query. ON DUPLICATE KEY UPDATE only updates the names, regardless of what other fields are set
      $query = "INSERT INTO poi (POI_ID, MAP_ID, POI_NAME, POI_COORDS)
                VALUES ";

      //loop through all the areas passed and add them to the query for mass update
      foreach ($areas as $key => $value) {
        $query .= "(" . $value["poi_id"] . ", " . MAP_ID . ", ";
        $query .= "\"" . $value["poi_name"] . "\", \"\")";

        if (array_key_exists("poi_images", $value)) {
          array_push($images, array( "poi_id" => $value["poi_id"], "poi_images" => $value["poi_images"]));
        }
        if (array_key_exists("poi_videos", $value)) {
          array_push($videos, array( "poi_id" => $value["poi_id"], "poi_videos" => $value["poi_videos"]));
        } else {
          array_push($no_videos, $value["poi_id"]);
        }
        if ($value !== end($areas)) $query .= ",";
      }
      $query.= " ON DUPLICATE KEY UPDATE
         POI_NAME = VALUES(POI_NAME);";

      if ($db->rawQuery($query) === false) quit(); #update insert into POI / update if exists / quit if error

      // TODO: add image alt to database
      (file_exists($config['IMAGES_PATH_POI'] . USER_NAME . "/MAP_" . MAP_ID)) ?: mkdir($config['IMAGES_PATH_POI'] . USER_NAME . "/MAP_" . MAP_ID . "/", 700, (boolean) $config['MAKEDIR_RECURSIVE']);
      $imgsCount = 0;
      // TODO: transaction 
      $images_query = "INSERT INTO POI_IMAGE (POI_ID, POI_IMAGE) VALUES ";
      foreach ($images as $key => $value) {
        foreach ($value["poi_images"] as $key => $image) {
          if (strpos($image["src"], "base64,") > -1) {
            $imagename = $config['IMAGES_PATH_POI'] . USER_NAME . "/MAP_" . MAP_ID . "/poi" . (int) $value["poi_id"] . "_" . ++$key . '.png';
            $imgsCount++;
            $images_query .= "(" . $value["poi_id"] . ", '" . $imagename . "'), ";
          }
        }
      }
      //build the query first, then check here if there are more than 0 images to be updated/uploaded to server/db. 
      if ($imgsCount > 0) {
        if ($db->rawQuery(substr($images_query,0,strlen($images_query) - 2)) === false) quit();
        //db request successful, add images to server file system
        //TODO: decide how to notify user of fails. For example, more than 1 image could fail on file_put_contents
        foreach ($images as $key => $value) {
          // We only care about base64 images (meaning, the other images will already have a server location and can be skipped)
          foreach ($value["poi_images"] as $key => $image) {
            if (strpos($image["src"], "base64,") > -1) {
              $imagename = $config['IMAGES_PATH_POI'] . USER_NAME . "/MAP_" . MAP_ID . "/poi" . (int) $value["poi_id"] . "_" . ++$key . '.png';
              $data = base64_decode_from_string($image["src"]);

              file_put_contents($imagename, $data);
            }
          }
        }
      }
      //now add point of interest videos
      // this is limited to 1, but the script is set up in a way that can easily be configured in the future to allow for many videos already
      
      // FIXME: throwing Undefined offset: 1 for INSERTING / ON DUPLICATE process ( i think it's because POI_VIDEO table is not auto_increment. Need to check docs on what qualifies);
      // NOTE : THIS IS A BUG WITH MYSQLIDB.php library. It falsely sanitizes '?' thinking it's asking for a parameter to bind (with youtube links this is fatal as there is one in the youtube link). I did a quick fix on it. See mysqlidb.class.php:1743 Although, it was just to get the job done and should be revisited for a proper solution
      if (count($videos) > 0) {
        $videos_query = "INSERT INTO POI_VIDEO (POI_ID, POI_VIDEO) VALUES ";
        foreach ($videos as $key => $value) {
          foreach ($value["poi_videos"] as $key => $video) {
            $videos_query .= "(" . $value["poi_id"] . ", '" . $video . "'), ";
          }
        }
        $videos_query = substr($videos_query,0,strlen($videos_query) - 2);
        $videos_query.= " ON DUPLICATE KEY UPDATE POI_VIDEO.POI_VIDEO = VALUES(POI_VIDEO);";
        if ($db->rawQuery($videos_query) === false) quit(); 
      }
      
      if(count($no_videos) > 0) {
        $no_videos_query = "DELETE FROM POI_VIDEO WHERE POI_ID IN (" . implode(",", $no_videos) . ");";
        if ($db->rawQuery($no_videos_query) === false) quit();
      }
    }
    if (ACTION === 'update_map_description') {
      if (!isset($_POST["map_id"]) || !isset($_POST["map_desc"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 2";
        quit();
      }  
      $data = array(
        "MAP_DESC" => $_POST["map_desc"]
      );
      $db->where("map_id", $_POST["map_id"]);
      if (!$db->update("MAP", $data)) $response["errror"] = "Error updating map description"; quit(); 
    }
    if (ACTION === 'toggle_publish_state') {
      if (!isset($_POST["map_id"]) || !isset($_POST["publish_state"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 2";
        quit();
      }      
      $data = array(
        "MAP_ISPUBLISHED" => $_POST["publish_state"]
      );
      $db->where("map_id", (int) $_POST["map_id"]);
      if (!$db->update("MAP", $data)) $response["errror"] = "Error updating map description"; quit(); 
    }
    if (ACTION === 'add_poi') {
      if (!isset($_POST["map_id"]) || !isset($_POST["poi_name"]) || !isset($_POST["poi_coords"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 3";
        quit();
      }    

      parse_str($_POST["poi_coords"], $coords);
      $poi_coords = "";
      foreach ($coords as $key => $val) {
        $poi_coords .= $val["x"] . " " . $val["y"] . ", ";
      }
      $poi_coords = substr($poi_coords, 0, -2) . "";

      $poiData = Array(
        "MAP_ID" => $_POST["map_id"],
        "POI_NAME" => $_POST['poi_name'],
        "POI_COORDS" => $poi_coords
      );
      
      if ($id = $db->insert("POI", $poiData)) $response["body"] = $id;
    }
    if (ACTION === 'remove_poi') {
      if (!isset($_POST["poi_id"]) || !isset($_POST["user_name"]) || !isset($_POST["map_id"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 3";
        quit();
      }    
      $mapid = (int)$_POST["map_id"];
      $poi_id = (int)$_POST["poi_id"];
      
      $db->where("POI_ID", $poi_id);
      if ($db->delete("poi")) {
        $path = $config['IMAGES_PATH_POI'] . $_POST['user_name'] . '/map_' . $mapid;
        //remove all poi images with the poi_id suffix, in given dir if any
        if (file_exists($path)) {
          $files = scandir($path);

          foreach ($files as $key => $value) {
            if (strpos($value, "poi" . $poi_id) > -1) {
              @unlink($path . "/" . $value);
            }
          }
        }
      } 
    }
    if (ACTION === 'remove_all_poi') {
      if (!isset($_POST["user_name"]) || !isset($_POST["map_id"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 2";
        quit();
      }    

      $db->where("MAP_ID", (int)$_POST["map_id"]);
      if ($db->delete("poi")) {        
        // TODO: validate dir is valid as this can return falsy truth in production ready environment
        // remove all files from poi images dir that contain poi_id
        unlink_dir($config['IMAGES_PATH_POI'] . $_POST['user_name'] . '/map_' . (int)$_POST["map_id"]);
      }
    }
    if (ACTION === 'remove_poi_image') {
      if (!isset($_POST["user_name"]) || !isset($_POST["map_id"]) || !isset($_POST["poi_image"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 3";
        quit();
      }  

      $image = $_POST["poi_image"];
        // TODO: validate dir is valid as this can return falsy truth in production ready environment
      $dir = $config["IMAGES_PATH_POI"] . $_POST["user_name"] . "/map_" . $_POST["map_id"];
      $loc = substr($image, strpos($image, $config["IMAGES_PATH_POI"]));
      
      $db->startTransaction();
      $db->where("POI_IMAGE", $loc);
      if ($db->delete("POI_IMAGE") === false) quit();

      unlink_files_from_dir(array(basename($loc)), $dir);
      $response["body"] = $loc;
      if (is_file($loc)) {
        $response["error"] = "Error removing file from directory. File is still valid";
        $db->rollback();
      } else {
        $db->commit();
      }
    }
    if (ACTION === 'add_poi_connection') {
      if (!isset($_POST["map_id"]) || !isset($_POST["to"]) || !isset($_POST["from"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 3";
        quit();
      }    

      $toConn = (int) $_POST["to"];
      $fromConn = (int) $_POST["from"];
      $mapid = (int) $_POST["map_id"];

      if ($toConn === $fromConn) {
        $response["error"] = "You can not add a connection to itself";
        quit();
      }

      $query = "INSERT INTO POI_CONNECTION (MAP_ID, POI_CONN_TO, POI_CONN_FROM)
                SELECT {$mapid}, {$toConn}, {$fromConn} FROM DUAL
                WHERE NOT EXISTS (
                  SELECT * FROM POI_CONNECTION
                  WHERE MAP_ID={$mapid} AND (POI_CONN_TO = {$toConn} AND POI_CONN_FROM = {$fromConn}) OR (POI_CONN_TO = {$fromConn} AND POI_CONN_FROM = {$toConn})
                )";
      if ($db->rawQuery($query) === false) quit();
    }
    if (ACTION === 'remove_poi_connection') {
      if (!isset($_POST["map_id"]) || !isset($_POST["to"]) || !isset($_POST["from"]) || !isset($_POST["user_name"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 4";
        quit();
      }    

      $toConn = (int) $_POST["to"];
      $fromConn = (int) $_POST["from"];
      $mapid = (int) $_POST["map_id"];

      $db->where("MAP_ID", $mapid)->where("POI_CONN_TO", $toConn)->where("POI_CONN_FROM", $fromConn);
      if ($db->delete("POI_CONNECTION") === false) quit();
    }
    //update/insert/delete poi_connection_video all happens under same request
    if (ACTION === 'update_poi_connection_video') {
      if (!isset($_POST["map_id"]) || !isset($_POST["to_poi_video"]) || !isset($_POST["from_poi_video"]) || !isset($_POST["to_poi_id"]) || !isset($_POST["from_poi_id"])) {
        $response["error"] = "Unexpected number of parameters. Expecting 5";
        quit();
      } 

      $mapid = (int) $_POST["map_id"];
      $toPoiID = (int) $_POST["to_poi_id"];
      $fromPoiID = (int) $_POST["from_poi_id"];

      $to_video = $_POST["to_poi_video"];
      $from_video = $_POST["from_poi_video"];
      
      /* the following if statements are tricky, and probably due to poorly named columns
         the 'to_video' is based on the original POI_CONN_ID's FROM/TO value.
          For example, a connection will have a FROM and a TO, but a connection_video references one POI_CONN_ID. 
          The 'TO_VIDEO' is described as coming from the 'to' destination providing a tour to the 'from' poi (which is the original FROM in POI_CONNECTION table)
            With that said, and WITH 'TO_VIDEO', all the values in the POI_CONNECTION_VIDEO table are reversed to support this, which can cause confusion admittedly
            So when updating the POI_CONNECTION_VIDEO table, 'TO_VIDEO' query will be backwards:
              
              WHERE POI_CONN_TO = FROM POI_ID AND POI_CONN_FROM = TO POI_ID

              In other words, because the tour is coming from the 'TO POI' and going to the 'FROM' poi, if that makes sense. 
              This is make sure the POI_CONN_ID is indexed and can cascade easily and at the same time, prevents duplicates

          The 'FROM_VIDEO' is described as coming from the 'from' poi to the 'to' poi, which is originally set in the POI_CONNECTION table
            This query remains readable. Meaning, POI_CONN_FROM = FROM POI_ID && POI_CONN_TO = TO POI_ID
      */
      if (empty($to_video)) {
        // we assume users want to delete a video, even if there has never been one. 
        // This does not throw an error but does waste a http request
        $db->where("POI_CONN_TO", $fromPoiID)->where("POI_CONN_FROM", $toPoiID);
        $db->delete("POI_CONNECTION_VIDEO");
      } else {
        $query = "SELECT * FROM POI_CONNECTION_VIDEO
                  WHERE MAP_ID={$mapid} AND POI_CONN_FROM={$toPoiID} AND POI_CONN_TO={$fromPoiID}";
        $results = $db->rawQuery($query);

        if (count($results) === 0) {
          // the 'route' has not been added to the table
          $query = "INSERT INTO POI_CONNECTION_VIDEO (MAP_ID, POI_CONN_ID, POI_CONN_FROM, POI_CONN_TO, POI_CONN_VIDEO) VALUES ({$mapid}, (SELECT POI_CONN_ID FROM POI_CONNECTION WHERE (POI_CONN_TO = {$toPoiID} AND POI_CONN_FROM = {$fromPoiID}) OR (POI_CONN_TO = {$fromPoiID} AND POI_CONN_FROM = {$toPoiID})), {$toPoiID}, {$fromPoiID}, '{$to_video}')";
          $db->rawQuery($query);
        } else if (count($results) === 1) {
          // the 'route' has been added previously and should simply be updated
          $data = array(
            "POI_CONN_VIDEO" => $to_video
          );
          $db->where("POI_CONN_FROM", $toPoiID)->where("POI_CONN_TO", $fromPoiID)->where("MAP_ID", $mapid);
          $db->update("POI_CONNECTION_VIDEO", $data);
        }
      }
      if (empty($from_video)) {
        // we assume users want to delete a video, even if there has never been one. 
        // This does not throw an error but does waste a http request
        $db->where("POI_CONN_TO", $toPoiID)->where("POI_CONN_FROM", $fromPoiID);
        $db->delete("POI_CONNECTION_VIDEO");
      } else {
        $query = "SELECT * FROM POI_CONNECTION_VIDEO
                  WHERE MAP_ID={$mapid} AND POI_CONN_FROM={$fromPoiID} AND POI_CONN_TO={$toPoiID}";
        $results = $db->rawQuery($query);

        if (count($results) === 0) {
          // the 'route' has not been added to the table
          $query = "INSERT INTO POI_CONNECTION_VIDEO (MAP_ID, POI_CONN_ID, POI_CONN_FROM, POI_CONN_TO, POI_CONN_VIDEO) VALUES ({$mapid}, (SELECT POI_CONN_ID FROM POI_CONNECTION WHERE (POI_CONN_TO = {$toPoiID} AND POI_CONN_FROM = {$fromPoiID}) OR (POI_CONN_TO = {$fromPoiID} AND POI_CONN_FROM = {$toPoiID})), {$fromPoiID}, {$toPoiID}, '{$from_video}')";
          $db->rawQuery($query);
        } else if (count($results) === 1) {
          // the 'route' has been added previously and should simply be updated
          $data = array(
            "POI_CONN_VIDEO" => $from_video
          );
          $db->where("POI_CONN_FROM", $fromPoiID)->where("POI_CONN_TO", $toPoiID)->where("MAP_ID", $mapid);
          $db->update("POI_CONNECTION_VIDEO", $data);
        }
      }
    }
  }

  quit();
  /**
   * Script closure. This is always the ending point of the script, and should maintain as such as 
   * Front End methods already HEAVILY rely on it
   * 
   */
  function quit() {
    $db = $GLOBALS["db"];
    $out = $GLOBALS["response"];
    $isDebug = ((boolean)$GLOBALS["config"]["IS_DEBUG"] === true) ?: 0;
    
    if ($isDebug === true) {
      if ($db->getLastErrno() !== 0) {
        $out["errno"] = $db->getLastErrno();
        if ($out["errno"] !== null) $out["recentQueryError"] = $db->getLastError();
      }
      $out["recentQuery"] = $db->getLastQuery();
    }

    if (!empty($out["error"])) $out["isError"] = true;
    if (!array_key_exists("body", $out) && $out["isError"] === false) $out["body"] = "success";

    $db->disconnect();
    die(json_encode($out));
  }

  /**
   * decodes a base64 string of data
   */
  function base64_decode_from_string($string) {
    if (strpos($string, "base64,") < 0) throw new \Exception("First parameter is expecting a base64 string");
    $result = substr($string, strpos($string, "base64,") + 7);
    $result = str_replace(' ', '+', $result); #sanitize spaces
    return base64_decode($result);
  }
 ?>
