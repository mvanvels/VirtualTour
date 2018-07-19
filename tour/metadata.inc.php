<?php 
    //video srcs
    $db->join("POI P", "M.MAP_ID = P.MAP_ID", "LEFT")->join("POI_VIDEO PV", "P.POI_ID = PV.POI_ID", "LEFT");
    $db->where("M.USER_ID", USER_ID)->where("M.MAP_ISPUBLISHED", true)->where("PV.POI_VIDEO", null, "IS NOT");
    $db->orderBy("M.MAP_ID","asc")->orderBy("P.POI_ID","asc");
    $videos = $db->get("MAP M", null, "P.POI_ID, P.MAP_ID, PV.POI_VIDEO");
  ?>
  <!-- load videos into javascript object -->
  <script>let videos = <?php echo json_encode($videos); ?></script>
  <?php 
    //image srcs
    $db->join("POI P", "M.MAP_ID = P.MAP_ID", "LEFT")->join("POI_IMAGE PI", "P.POI_ID = PI.POI_ID", "LEFT");
    $db->where("M.USER_ID", USER_ID)->where("M.MAP_ISPUBLISHED", true)->where("PI.POI_IMAGE", null, "IS NOT");
    $db->orderBy("M.MAP_ID","asc")->orderBy("P.POI_ID","asc");
    $images = $db->get("MAP M", null, "P.POI_ID, P.MAP_ID, PI.POI_IMAGE");
  ?>
  <!-- load images into javascript object -->
  <script>let images = <?php echo json_encode($images); ?></script>
  <?php 
    //connections srcs
    $db->join("POI_CONNECTION PC", "M.MAP_ID = PC.MAP_ID", "LEFT");
    $db->where("M.USER_ID", USER_ID)->where("M.MAP_ISPUBLISHED", true)->where("PC.POI_CONN_ID", null, "IS NOT");
    $db->orderBy("M.MAP_ID","asc")->orderBy("PC.POI_CONN_FROM", "asc");
    $connections = $db->get("MAP M", null, "PC.POI_CONN_ID, PC.MAP_ID, PC.POI_CONN_FROM, PC.POI_CONN_TO");
  ?>
  <!-- load connections into javascript object -->
  <script>let connections = <?php echo json_encode($connections); ?></script>
  <?php 
    //connection video srcs
    $db->join("POI_CONNECTION_VIDEO PCV", "M.MAP_ID = PCV.MAP_ID", "LEFT");
    $db->where("M.USER_ID", USER_ID)->where("M.MAP_ISPUBLISHED", true)->where("PCV.POI_CONN_ID", null, "IS NOT");
    $db->orderBy("M.MAP_ID","asc")->orderBy("PCV.POI_CONN_FROM", "asc");
    $connection_videos = $db->get("MAP M", null, "PCV.POI_CONN_ID, PCV.MAP_ID, PCV.POI_CONN_FROM, PCV.POI_CONN_TO, PCV.POI_CONN_VIDEO");
  ?>
  <!-- load connection videos into javascript object -->
  <script>let connection_videos = <?php echo json_encode($connection_videos); ?></script>