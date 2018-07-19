/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 2/10/2018

  This is called as a module script. Therefor this should be tested on a live server/local server. Loading from Windows File System will not work

  There is some work to be done

  Mainly:
    - Image 404's (also add .onerror/.onload)
    _ try/catches
    - remove data attribute dependencies (except <area> tags)
*/
import { SimpleModal } from '../js/simple-modal.js';

$(document).ready(function(){
  if (typeof maps === 'undefined') throw new Error('Maps is undefined');
  
  let modal = new SimpleModal();
  //aggregate all maps info and metadata into similar objects/arrays
  maps.map(k => {    
    k.AREAS = pois.filter(f => k.MAP_ID === f.MAP_ID);
    k.AREAS.map(av => {
      av.POI_IMAGES = images.filter(f => av.POI_ID === f.POI_ID).map(m => m.POI_IMAGE);
      av.POI_VIDEOS = videos.filter(f => av.POI_ID === f.POI_ID).map(m => m.POI_VIDEO);
    });
    k.POI_CONNECTIONS = connection_videos.filter(f => k.MAP_ID === f.MAP_ID);
  });

  let activeMapID = maps[0].MAP_ID;
  let activeDestination = null;

  loadMapDataForMap(activeMapID);

  //event handler for changing maps
  $("#sidebar__mapsList li").on("click", (e) => {
    let map = maps.find(f => f.MAP_NAME.trim().toLowerCase() === $(e.target).text().trim().toLowerCase());

    if (map && map.MAP_ID !== activeMapID) loadMapDataForMap(map.MAP_ID);
  });
  //handle click event for when user selects a point of interest from the map
  $(document).on('click', "map[name='img-wrapper__img__map-image'] area", function(e) {
    let poi = maps.find(f => f.MAP_ID === activeMapID).AREAS.find(f => f.POI_ID === $(e.target).data("poi-id"));

    activeDestination = poi;
    showActiveDestination();
  });
  //event handler for hovering over an area on map
  $(document).on('mousemove', "map[name='img-wrapper__img__map-image'] area", (e) => {
    let pos = getCursorPosition(document.body, e);
    let css = {
      display: "block",
      top: pos.y + 20,
      left: pos.x
    }
    $("#img-wrapper__hoverdesc").css(css);
    $("#img-wrapper__hoverdesc").html($(e.target).data("poi-name"));
  });
  //event handler for hovering out a recently hovered area on map
  $(document).on('mouseleave', "map[name='img-wrapper__img__map-image'] area", () => {
    $("#img-wrapper__hoverdesc").css("display", "none");
  });
  //handles when an image is clicked when viewing a poi
  $("#modal__viewPOI").on("click", '.poi-modal-images img', (e) => {
      $("#modal__POIImage").modal('toggle');

      $("#modal__POIImage .modal-body img")[0].src = e.target.src;
  });
  // handle closing point of interest modal
  $("#modal__viewPOI__btn__closeModal").on("click", ()=>{
    $("#modal__viewPOI").removeClass("poi-show-modal");
    $(".poi-modal-videos").html("");
    $(".poi-modal-images").html("");
    $(".poi-modal-connections").html("");
  });
  // handle when the poi <select> tag changes
  $("#mapInfo__select__pois").change(() => {
    let map = maps.find(f => f.MAP_ID === activeMapID);
    let opt = $('#mapInfo__select__pois option:selected');
    activeDestination = map.AREAS.find(f => f.POI_NAME.trim().toLowerCase() === opt.val().trim().toLowerCase());

    showActiveDestination();
  });
  //referenced from ytplayer.js:49
  //video has finished playing and automatically goes to destination point of interest modal and closes tour modal
  document.addEventListener("ytplayerevent", function (e) {
    if (e.detail == YT.PlayerState.ENDED) {
      $("#modal__tourVideo").css("display", "none");
      showActiveDestination();
    }
  });
  //event handler for tour control skip
  $("#ytplayer__tour__controls__skip").on("click", () => {
    $("#modal__tourVideo").css("display", "none");
    ytPlayer.stopVideo();
    showActiveDestination();
  });
  //event handler for tour control report
  $("#ytplayer__tour__controls__report").on('click', () => {
    modal.display("You have reported this video");
    ytPlayer.stopVideo();
    $("#modal__tourVideo").css("display", "none");
  });
  /**
   * This shows a modal with all a POI's metadata, connection names
   * @param {Object} poi point of interest relative to maps.AREAS[]
   * @param {Array} poiConns array of connections related to poi
   */
  function showPOIModalForPOI(poi, poiConns) {
    $("#modal__viewPOI").addClass("poi-show-modal");  
    $(".poi-modal-header").html(poi.POI_NAME);

    //check for images of current point of interest
    if (poi.POI_IMAGES.length > 0) {
      let imagesDiv = $(".poi-modal-images");
      imagesDiv.append("<h4>Images</h4>");
      $.each(poi.POI_IMAGES, function(k,v) {
        imagesDiv.append(`<img src="${v}" alt=""/>`);
      });
    }
    //check for videos of current point of interest
    if (poi.POI_VIDEOS.length > 0) {
      if (poi.POI_IMAGES.length > 0) $(".poi-modal-images").append("<hr>");

      let videosDiv = $(".poi-modal-videos");
      videosDiv.append("<h4>Videos</h4>");
      $.each(poi.POI_VIDEOS, function(k,v) {
        //we just want the id of the link. It's easier to ask users for the full link, so we take care of the rest here
        let ytID = v.replace("https://www.youtube.com/watch?v=", "");
        videosDiv.append(`<iframe src="https://www.youtube.com/embed/${ytID}?autoplay=0&origin=http://tourbytouch.com&playsinline=1" frameborder="1" allowfullscreen></iframe>`);
      });
    }
    //check for connections from current point of interst to other ones and populate in <select> tag
    if (poiConns.length > 0) {
      //if it has connections, check to see if there are videos and images of current point of interest first, if so, add a <hr> 
      // We only want connections with 'tours' or videos to them
      if (poi.POI_VIDEOS.length > 0) {
        $(".poi-modal-videos").append("<hr>");
      } else {
        if (poi.POI_IMAGES.length > 0) $(".poi-modal-images").append("<hr>");
      }

      //add connections to current point of interest
      let connsDiv = $(".poi-modal-connections");
      connsDiv.append("<h4>Connections</h4><br>Get a tour to:  ");
      connsDiv.append("<select id='modal__viewPOI__select__connections'></select>");
      let _map = maps.find(f => f.MAP_ID === activeMapID);
      $.each(poiConns, function(k,v){ 
        let conn = _map.AREAS.find(q => q.POI_ID === v.POI_CONN_TO);

        $("#modal__viewPOI__select__connections").append('<option value=' + k + '\'>' + conn.POI_NAME + '</option>');
      });
      connsDiv.append("<button id='modal__viewPOI__btn__watchTour'>Go</button>");
      //event handler for clicking 'GO' button to watch tour
      $("#modal__viewPOI__btn__watchTour").on("click", ()=>{
        let opt = parseInt($('#modal__viewPOI__select__connections option:selected').val());
        let ytID = poiConns[opt].POI_CONN_VIDEO.replace("https://www.youtube.com/watch?v=","");

        ytPlayer.loadVideoById(ytID, 0, 'large');
        activeDestination = maps.find(f => f.MAP_ID === activeMapID).AREAS.find(f => f.POI_ID === poiConns[opt].POI_CONN_TO);
                
        $("#modal__viewPOI__btn__closeModal").click();
        $("#modal__tourVideo").css("display", "block");
      });
    }
  }
  //shortcut to show active destination (used for connection and point of interest click)
  /**
   * Shortcut to show active destination (used for connection and point of interest click)
   */
  function showActiveDestination() {
    if (typeof activeDestination !== 'object') throw "Expecting a valid destination object"; 

    let poiConns = maps.find(f => f.MAP_ID === activeMapID).POI_CONNECTIONS.filter(f => f.POI_CONN_FROM === activeDestination.POI_ID);
  
    showPOIModalForPOI(activeDestination, poiConns);
  }
    /**
   * Loads/resets/changes all User Interfaces, related to the map, to a given maps information
   * @param {Integer} map_id given map_id 
   */
  function loadMapDataForMap(map_id) {
    
    let map = maps.find(f => f.MAP_ID === map_id);

    if (map !== undefined) {
      activeMapID = map_id;
      console.log(`%c LOADING MAP FOR MAP ID: ${map_id}`, 'background: blue; color: white;');
      console.table(map);
      
      $("#mapInfo__desc").html(map.MAP_DESC);
      $("#img-wrapper img")[0].src = map.MAP_IMAGE;
      
      $("#mapInfo__select__pois option:not(:first)").remove();
      $("#mapInfo__select__pois")[0].selectedIndex = 0;
      $("map[name='img-wrapper__img__map-image'] area").remove();
      $.each(map.AREAS, (k,v)=> {
        $("#mapInfo__select__pois").append("<option>" + v.POI_NAME + "</option");
        $("map[name='img-wrapper__img__map-image']").append("<area data-poi-id='" + v.POI_ID + "' shape='poly' href='#' coords='" + v.POI_COORDS + "' data-poi-name='" + v.POI_NAME +"'></area>")
      });

      if ("function" === typeof $("map").first()[0]._resize) {
        //this is a function I personally added to the map-area-resizer.js script to ensure it works dynamically as we are using in our circumstance
        // I couldn't unbind the function or delete it from the object
        // if you are using an outdated, or unedited version of map-area-resizer that does not contain this function you will get fatal errors.
        // I changed the name of the script to reflect that it's not the same, but you can find the original here: https://github.com/davidjbradshaw/image-map-resizer
        $("map").first()[0]._resetAreas(); 
      }
      $("map").imageMapResize(); 
    } else {
      console.warn(`Could not find map using id: ${map_id}`);
      // handle when map doesn't exist and somehow made it to this point
    }
  }
  /**
 * Get's current mouse position, relative to canvas offset, scroll offest and page offset,
 * if browser supports pageX, pageY it uses those values as they work independantly of scrolling
 * @param  {DOM Element} c elem for offset
 * @param  {Event} e mouse click event
 * @return {Object} mouse position { x : value, y: value }
 */
  function getCursorPosition(c, e) {
    var mx, my;
    if (e.pageX || e.pageY) {
      mx = e.pageX;
      my = e.pageY;
    } else {
      // NOTE: difference in clientXY & screenXY
      mx = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      my = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    mx -= c.offsetLeft;
    my -= c.offsetTop;
    return { x: mx, y: my };
  }
});
