<?php
/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 4/17/2018
  Notes:
   This needs a lot of work and QA
   
   Mainly: 
    - try/catches
    - db errors and exceptions
    - SQL optimization
    - performance optimization 
    - response returns need to be more clear/concise & usable (right now it only returns true/false/results if any)

  All URL parameters shoudl be sent via form/FormData
  This particular script only proceeds if 'Query' parameter is set and a valid user_id is passed
 */ 
  require_once('globals.inc.php');

  if (isset($_GET["Query"])) {
    define("QUERY", $_GET["Query"]);

    if (!isset($_GET["user_id"])) die(false);

    /**
     * Get a users entire map catalog
     */
    if (QUERY === "maps") {
      $query = "SELECT M.USER_ID, M.MAP_ID, M.MAP_NAME, M.MAP_DESC, M.MAP_IMAGE, M.MAP_ISPUBLISHED, P.POI_ID, P.POI_NAME, P.POI_COORDS
      FROM map AS M
      LEFT OUTER JOIN poi AS P ON P.MAP_ID = M.MAP_ID
      WHERE M.USER_ID = '{$_GET["user_id"]}'
      ORDER BY M.MAP_ID, P.POI_NAME";

      $json = $db->JsonBuilder()->rawQuery($query);
      if ($db->getLastErrno() == 0) die($json);

      die(false);
    }

    /**
     * Get a users entire map catalog metadata (connections, points of intererst, videos, images etc)
     */
    if (QUERY === "metadata") {

      // Start by getting all map id's with all pois for each map.
      // order by makes it easier on front end sorting

      //This first query gets images
      $query = "SELECT M.MAP_ID, PII.POI_ID, PII.POI_IMAGE
      FROM poi P, map M, poi_image PII
      WHERE M.USER_ID = '{$_GET["user_id"]}' AND P.MAP_ID = M.MAP_ID AND P.POI_ID = PII.POI_ID
      ORDER BY M.MAP_ID, PII.POI_ID";

      $images = $db->rawQuery($query);

      if ($db->getLastErrno() === 0) {
        // Now get all points of interest videos
        $query = "SELECT M.MAP_ID, PV.POI_ID, PV.POI_VIDEO
        FROM poi P, map M, poi_video PV
        WHERE M.USER_ID = '{$_GET["user_id"]}' AND P.MAP_ID = M.MAP_ID AND P.POI_ID = PV.POI_ID
        ORDER BY M.MAP_ID, PV.POI_ID";

        $videos = $db->rawQuery($query);

        if ($db->getLastErrno() === 0) {

          //now get all connections (for all maps of user)
          $query = "SELECT PC.MAP_ID, PC.POI_CONN_TO, PC.POI_CONN_FROM
          FROM POI_CONNECTION PC, map M
          WHERE M.USER_ID = '{$_GET["user_id"]}' AND M.MAP_ID = PC.MAP_ID
          ORDER BY PC.MAP_ID, PC.POI_CONN_FROM";
          $connections = $db->rawQuery($query);
          if ($db->getLastErrno() ===0) {
            
            //as long as all the previous requests go through w/o interruption
            // we combine the images and videos metadata here since they share the same columns (or at minimum the ones we need. Notice there is no SELECT * FROM statements to limit future errors)
            $metadata = arrays_combine_metadata([$videos, $images]);

            //adding connections to the previously made metadata array. 
            // this needs to come after due to metadata being passed by reference
            addConnectionsToMetadata($connections,$metadata);
            
            // finally get all the connection videos
            $query="SELECT M.MAP_ID, PCV.POI_CONN_FROM, PCV.POI_CONN_TO, PCV.POI_CONN_VIDEO
                    FROM map M, poi_connection_video PCV
                    WHERE M.USER_ID = '{$_GET["user_id"]}' AND M.MAP_ID = PCV.MAP_ID
                    ORDER BY M.MAP_ID, PCV.POI_CONN_FROM";
            $conn_videos = $db->rawQuery($query);

            if ($db->getLastErrno() === 0) {
              // add the vidoes to the connections
              addConnVideosToConnections($conn_videos, $metadata);

              //display entire metadata results in json format
              //TODO : this is horrible structure. This only executes as long as ALL other queries don't fail. 
              // Of course we want results in one block, but this doesn't identify where what went wrong if so.
              die(json_encode($metadata));
            }
          }
        }
      }

      #if the first query or subsequent ones fail we end up here
      die(false);
    }
  } else {
    #query URL parameter not set
    die(false);
  }

  /**
   * Combines metadata object with new connections. This filters and sorts by matching map_id's and 
   * aggregates any relevant information to respective maps
   * 
   * @param Array $connections
   * @param Array &$metadata
   */
  function addConnectionsToMetadata($connections, &$metadata) {
    foreach ($connections as $key => $conn) {
      if (array_search($conn["MAP_ID"], array_column($metadata, 'MAP_ID')) === false) {
        array_push($metadata, Array(
          "MAP_ID" => $conn["MAP_ID"]
          )
        );
      }
      $indx = array_search($conn["MAP_ID"], array_column($metadata, 'MAP_ID'));
      $metadata[$indx]["POI_CONNECTIONS"][] = array("TO" => $conn["POI_CONN_TO"], "FROM" => $conn["POI_CONN_FROM"]);
    }
  }
  /**
   * This adds videos to already defined connections. 
   * This sorts by connection KVP and adds respective video info
   * 
   * @param Array $videos
   * @param Array &$metadata
   */
  function addConnVideosToConnections($videos, &$metadata) {
    foreach ($videos as $video_key => $video) {
      foreach ($metadata as $data_key => $data) {
        foreach ($data["POI_CONNECTIONS"] as $conn_key => $conn) {
          if (($video["POI_CONN_FROM"] === $conn["FROM"] && $video["POI_CONN_TO"] === $conn["TO"]) ||
              ($video["POI_CONN_FROM"] === $conn["TO"] && $video["POI_CONN_TO"] === $conn["FROM"])) {
              
              if ($video["POI_CONN_FROM"] === $conn["FROM"] && $video["POI_CONN_TO"] === $conn["TO"]) {
                $metadata[$data_key]["POI_CONNECTIONS"][$conn_key]["FROM_VIDEO"] = $video["POI_CONN_VIDEO"];
              }
              if ($video["POI_CONN_FROM"] === $conn["TO"] && $video["POI_CONN_TO"] === $conn["FROM"]) {
                $metadata[$data_key]["POI_CONNECTIONS"][$conn_key]["TO_VIDEO"] = $video["POI_CONN_VIDEO"];
              }
          }
        }
      }
    }   
  }
  /**
   * This combines all the arrays KVP into one single array.
   * Loops through all arrays passed in the argument and combines them into a single map dataset
   *
   * @param  Array $arrays List of arrays to loop through and combine into one map dataset
   * @return Array         Single array with unique map datasets
   */
  function arrays_combine_metadata($arrays) {
    $metadata = Array();
    $map_index; #simple counter to easily identify what the index of the loop is in. This assumes your MySQL query orders ASC

    foreach ($arrays as $key => $value) {
      foreach ($value as $key2 => $value2) {
        $map_id = $value2["MAP_ID"];
        $poi_id = $value2["POI_ID"];
        #First checks if the map id of $value2 is already in the $metadata array, if not, it pushes it
        if(array_search($map_id, array_column($metadata, 'MAP_ID')) === false) {
          array_push($metadata, Array(
            "MAP_ID" => $map_id,
            "POI" => Array( 0 => Array("POI_ID" => $poi_id, "POI_IMAGES" => Array(), "POI_VIDEOS" => Array() ) )
            )
          );
          (isset($map_index)) ? $map_index++ : $map_index = 0;
        }
        #add POI to the POI array in the current map. This checks if the POI is in the array first, if not, it pushes
        $poi_index = array_search($poi_id, array_column($metadata[$map_index]["POI"], "POI_ID")); #this is used twice, the second time is the actual index, first time is simply to validate. Dont cast to int until validation occurs, to prevent false positives (0 = false, 1 = true)
        if ($poi_index === false) {
          array_push($metadata[$map_index]["POI"], Array("POI_ID" => $poi_id, "POI_IMAGES" => Array(), "POI_VIDEOS" => Array()));
          $poi_index = count($metadata[$map_index]["POI"]) -1;
        } else {
          $poi_index = (int) $poi_index;
        }
        #finally check which type of metadata is being returned and push to their respective arrays
        $keys;
        if (array_key_exists("POI_VIDEO", $value2)) $keys = Array("META" => "POI_VIDEOS", "VALUE2" => "POI_VIDEO");
        if (array_key_exists("POI_IMAGE", $value2)) $keys = Array("META" => "POI_IMAGES", "VALUE2" => "POI_IMAGE");
        #isset check just in case SQL query results change in the future without control
        if (isset($keys)) array_push($metadata[$map_index]["POI"][$poi_index][$keys["META"]], $value2[$keys["VALUE2"]]);
      }
    }

    return $metadata;

  }

 ?>
