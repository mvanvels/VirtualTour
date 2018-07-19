<?php 
/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 7/10/2018

  Subject to change.

  Vision here is to minimize db/server requests by aggregating all a queried users maps, pois, and metadata into a javascript object.

  Downside here is it won't be truly 'real time', but I think the trade off is good enough for now until SQL optimization can be reviewed
  */
  require_once("header.inc.php");

  $db->where("USER_ID", USER_ID)->where("MAP_ISPUBLISHED", true);
  $db->orderBy("MAP_ID","asc");
  $maps = $db->get("MAP", null, "MAP_DESC, MAP_ID, MAP_IMAGE, MAP_NAME");
?>
  <!-- BODY CONTENT HERE -->
  <main>
    <?php
      if ($db->count > 0) {
    ?>
        <!-- Navigation side panel (maps, links) -->
        <aside>
          <!-- load maps into javascript object -->
          <script>let maps = <?php echo json_encode($maps); ?></script>
          <h3>Maps</h3>
          <ul id="sidebar__mapsList">
            <?php
              foreach ($maps as $key => $value) {
                echo '<li>' . $value["MAP_NAME"] . '</li>';
              }
            ?>
          </ul>
          <h3>Links</h3>
          <ul>
            <li><a href="#">Website</a></li>
            <li><a href="#">Link 2</a></li>
            <li><a href="#">Link 3</a></li>
            <li><a href="#">Link 4</a></li>
          </ul>
        </aside> <!-- END OF SIDE BAR -->
        <div id="mapInfo">
          <h3 id="mapInfo__desc"><?php echo $maps[0]["MAP_DESC"]; ?></h3>
          <div>
            Points of Interest: 
            <select id="mapInfo__select__pois">
              <option value="0" hidden>SELECT</option>
            </select>
          </div>
          <div id="img-wrapper">
              <div id="img-wrapper__hoverdesc"></div>
              <img src="<?php echo $maps[0]['MAP_IMAGE']; ?>" alt="tour map image" usemap="#img-wrapper__img__map-image">
              <map name="img-wrapper__img__map-image">
                <!-- get all points of interest for user -->
                <?php 
                  $db->join("POI P", "M.MAP_ID = P.MAP_ID", "LEFT");
                  $db->where("M.USER_ID", USER_ID)->where("M.MAP_ISPUBLISHED", true);
                  $db->orderBy("M.MAP_ID","asc")->orderBy("P.POI_ID","asc");
                  $pois = $db->get("MAP M", null, "P.POI_ID, P.MAP_ID, P.POI_NAME, P.POI_COORDS");

                  if ($db->count > 0) {                    
                    foreach ($pois as $key => $value) {
                      if ($value["MAP_ID"] === $maps[0]["MAP_ID"]) {
                        echo "<area data-poi-id='{$value["POI_ID"]}' shape='poly' href='#' coords='{$value['POI_COORDS']}' data-poi-name='{$value['POI_NAME']}'></area>";
                      }
                    }
                    ?>
                    <!-- load pois into javascript object -->
                    <script>let pois = <?php echo json_encode($pois); ?></script>
                    <!-- get metadata for all mpas -->
                    <?php 
                      require_once("metadata.inc.php");
                  } 
                  else {
                    echo "User has no points of interest";
                  }
                  ?>
              </map>
          </div>
        </div>
    <?php
      }
      else {
        //User has no maps
        echo "user has no maps";
      }
    ?>
  </main>
  <!-- END OF MAIN CONTENT -->
  <!-- MODALS -->
  <div class="modal fade" id="modal__POIImage" tabindex="-1" role="dialog" aria-labelledby="imageModalTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body">
          <img src="" alt="">
        </div>
      </div>
    </div>
  </div> <!-- END OF IMAGE MODAL -->
  <div id="modal__viewPOI" class="poi-modal">
    <div class="poi-modal-content">
      <div class="poi-modal-header"></div>
      <div class="poi-modal-body">
        <div class="poi-modal-images">
        </div>
        <div class="poi-modal-videos">
        </div>
        <div class="poi-modal-connections">
        </div>
      </div>
      <div class="poi-modal-footer">
        <button id="modal__viewPOI__btn__closeModal">CLOSE</button>
      </div>
    </div>
  </div> <!-- END OF VIEW POI MODAL -->
  <div id="modal__tourVideo">
      <div id="ytplayer__tour"></div>
      <div id="ytplayer__tour__controls">
        <button id="ytplayer__tour__controls__skip">Skip</button>
        <button id="ytplayer__tour__controls__report">Report</button>
      </div>
  </div> <!-- END OF YOUTUBE PLAYER MODAL -->
  <!-- END OF MODALS --> 
  <?php
  // FOOTER INCLUDE HERE
  // NOTE: footer.inc.php calls dependencies
  require_once("footer.inc.php");