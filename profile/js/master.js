/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 2/10/2018

  This is called as a module script. Therefor this should be tested on a live server/local server. Loading from Windows File System will not work

  Focus for user notifications is placed on errors only. Meaning, I felt it's better user experience to not notify the user of every successful db request/response and only notify them when something goes awry. Although arbitrary, that's why you won't see many successful modal.display()

  There is some work to be done

  Mainly:
    - then().catch() for promises
    - alter how formdata is sent (client side is not optimal for this as users can see in the script which parameters are being passed)
    - mapEditor is the core of this script and deserves its own class. Should put effort into making that a priority to ensure a smooth transition for future alterations.
      - it should be structured in a way that makes more sense and offers more flexability (take for example mapEditor.canAlterMap is vague and limited functionality)
    - add more canvas drawing tools (polygon is good, but rectangles and circles will come in handy as I've already noticed with testing)
    - showImgSizePlaceholder should really be apart of the background image instead of being drawn on canvas circumstancially. Canvas get's cleared way too many times 
*/
import { SimpleModal } from '../../js/simple-modal.js';
import { Frequent, FRegex } from '../../js/frequent.js';

$(document).ready(function (e) {
  //DOM elements called more than once across this file should be cached here
  // for selectors that are used <= 3 or so times, I didn't find a reason to cache them based on their circumstances
  const elems = {
    mapsList : {
      wrapper: $("#action-list__menu__maps"),
      buttons : {
        addMap: $("#action-list__menu__maps li:last-child")
      }
    },
    mapImage : {
      wrapper : $("#img-wrapper"),
      image: $("#img-wrapper__img__map-image"),
      canvas: $("#img-wrapper__canvas")[0],
      trigger: $("#img-wrapper__trigger__selectFile")
    },
    metadata : {
      wrapper : $("#metadata-wrapper"),
      mapInfo : {
        name : $("#metadata-wrapper__map-info__name"),
        desc: $("#metadata-wrapper__map-info__desc")
      },
      buttons : {
        editMapDesc: $("#metadata-wrapper__btn__editMapDesc"),
        editMapImage: $("#metadata-wrapper__btn__changeMapImage"),
        deleteMap: $("#metadata-wrapper__btn__deleteMap"),
        publishMap: $("#metadata-wrapper__btn__publishMap"),
        addPOI: $("#metadata-wrapper__btn__addPOI"),
        addConn: $("#metadata-wrapper__btn__addConn"),
        removeAllPOI: $("#metadata-wrapper__btn__removeAllPOI"),
        showAllPOI : $("#metadata-wrapper__btn__showAllPOI")
      },
      tables : {
        poi : $("#metadata-wrapper__tbl__poi"),
        conn : $("#metadata-wrapper__tbl__conn")
      }
    },
    modals : {
      editPOI: $("#modal__editPOI"),
      editConn: $("#modal__editConn"),
      addConn: $("#modal__addConn"),
      selects : {
        addConn_fromConn: $("#modal__addConn__select__fromConn"),
        addConn_toConn: $("#modal__addConn__select__toConn")
      }
    },
    overlays : {
      addPOIActions: $("#metadata-wrapper__overlay__add-poi-actions")
    }
  }
  /**
   *  REGION => INSTANTIABLES
   */
  /**
   * All things that relate to the map editing environment is explicitly altered here
   *  Things like maps, areas, images, videos, connections are stored in their respective index
   * 
   * Useful getters to validate and useful functions to reset, add new maps, add new areas to limit duplicate code, therefore limiting errors
   * @type {Object}
   */
  let mapEditor = {
    _isEditing: false,
    _mapImageDidLoad : false,
    maxNumOfAreaImages: 5,
    maps: [],
    coords: [],
    get mapImageDidLoad() { return this._mapImageDidLoad},
    set mapImageDidLoad(bool) {
      if (typeof bool !== 'boolean') throw 'Parameter 1 expecting bool';
      this._mapImageDidLoad = bool;
    },
    get isEditing() { return this._isEditing },
    set isEditing(bool) {
      if (typeof bool !== 'boolean') throw 'Parameter 1 expecting bool';
      this._isEditing = bool;
      //do things when map edit mode changes. this is called automatically
    },
    reset: function () {
      this.coords = [];
      this.activeMap.areas = [];
      canvas.clear();
      this.activeConnIndex = undefined;
      this.activePOIIndex = undefined;
      refreshMapAreas();
    },
    get activeMapID() { return this._mapId },
    set activeMapID(val) {
      this._mapId = val;
    },
    get activeMapIndex() {
      return Object.keys(this.maps).find(f => this.maps[f].map_id === this.activeMapID);
    },
    get activeMap() {
      return this.maps.find(f => f.map_id === this.activeMapID);
    },
    newMap : function(mapId, mapName, mapImage, mapDesc, mapIsPublished, mapAreas, mapConns) {
      mapDesc = mapDesc || '';
      mapImage = mapImage || null;
      mapIsPublished = mapIsPublished || false;
      mapAreas = mapAreas || [];
      mapConns = mapConns || [];
      mapEditor.maps.push({ map_id: mapId, map_image: mapImage, map_name: mapName, map_desc: mapDesc, areas: mapAreas, isPublished: mapIsPublished, poi_connections: mapConns });
    },
    newArea : function(mapObj, poiId, poiName, poiCoords, poiVideos, poiImages) {
      poiCoords = poiCoords || [];
      poiVideos = poiVideos || [];
      poiImages = poiImages || [];
      mapObj.areas.push({ poi_id: poiId, poi_name: poiName, poi_coords: poiCoords, poi_videos: poiVideos, poi_images: poiImages });
    },
    get activeConnIndex() { return this._connIndex},
    set activeConnIndex(val) {
      this._connIndex = val;
    },
    get activePOIIndex() { return this._poiIndex},
    set activePOIIndex(val) {
      this._poiIndex = val;
    },
    get canAlterMap() {
      if (isNaN(mapEditor.activeMapID) ||
          mapEditor.maps.length === 0 ||
          mapEditor.mapImageDidLoad === false) {
        return false;
      }

      return true;
    },
    showImgSizePlaceholder : function() {
      //set placeholder text if no image is found
      canvas.clear();
      canvas.ctx.font = "1.2rem Quicksand, 'Trebuchet MS'";
      canvas.ctx.fillStyle = "lightgrey";
      canvas.ctx.textAlign = "center";
      canvas.ctx.fillText("1000 x 500", 496, 305);
    }
  }

  let canvas = new SimpleCanvas(elems.mapImage.canvas);  
  let modal = new SimpleModal();
  
  /**
   * END REGION => INSTANTIABLES
   */

   /**
    * REGION => DEFAULT SETTINGS
    */
   //change this const to reflect where images should load from. Default (empty) is load from cwd
     // this is an additional '../' for where they are stored in config.ini, if one is needed
  const BASE_IMAGE_URI = '';
  
  //psuedo coded to emulate a signed/logged in user
  if (!sessionStorage.getItem("user_id")) sessionStorage.setItem("user_id", 1);
  if (!sessionStorage.getItem("user_name")) sessionStorage.setItem("user_name", "ihcc_ottumwa");
  const USER_ID = sessionStorage.getItem("user_id");
  const USER_NAME = sessionStorage.getItem("user_name");

  /**
   * END REGION => DEFAULT SETTINGS
   */

  /**
   * REGION => ON FIRST LOAD
   */
  (async function () {
    let result = await getMapData("maps");
    //wrapped in an async function to ensure completion before aggregating metadata
    if (!result) return;

    for (let map of result) {
      if (mapEditor.maps.findIndex(key => key.map_id === map.MAP_ID) < 0) {
        $(`<li>${map.MAP_NAME}</li>`).insertBefore(elems.mapsList.buttons.addMap);
        mapEditor.newMap(map.MAP_ID, map.MAP_NAME, map.MAP_IMAGE, map.MAP_DESC, map.MAP_ISPUBLISHED, [], []);
      } 

      if (map.POI_ID) {
        let inCoords = map.POI_COORDS.split(",");
        let outCoords = [];
        for (let coord of inCoords) {
          let pos = coord.trim().split(" ");
          outCoords.push({ x: Number(pos[0]), y: Number(pos[1]) });
        }
        mapEditor.newArea(mapEditor.maps[mapEditor.maps.length - 1], map.POI_ID, map.POI_NAME, outCoords);
      }
    }

    let metadata = await getMapData("metadata");
    if (metadata) {
      for (let data of metadata) {
        let map = mapEditor.maps.find(f => f.map_id === data.MAP_ID);
        
        if (data.POI_CONNECTIONS) map.poi_connections = data.POI_CONNECTIONS;
        
        if (!data.POI) continue;

        for (let poi of data.POI) {
          let mapPOI = map.areas.find(f => f.poi_id === poi.POI_ID);
          for (let img of poi.POI_IMAGES) {
            mapPOI.poi_images.push({ src: img, alt: img });
          }

          mapPOI.poi_videos = poi.POI_VIDEOS;
        }
      }
    }
    console.log(`%c User Maps:`, 'background: orange; color: white;');
    console.table(mapEditor.maps);

    if (mapEditor.maps.length > 0) loadMapDataForMapID(mapEditor.maps[0].map_id);
  })();
  /**
   * END REGION => ON FIRST LOAD
   */
  /**
   * REGION => EVENT HANDLERS
   *  I did my best to organize them top-down respective of their markup position 
   */
  //this event handler controls when a user selects a map from the maps dropdown list
  $(document).on('click', `${elems.mapsList.wrapper.selector} li:not(:last)`, (e) => {
    if (e.target) {

      let map = mapEditor.maps.find(f => f.map_name.trim().toLowerCase() === $(e.target).text().trim().toLowerCase());

      if (map.map_id === mapEditor.activeMapID) return; // if current map is the same as li that was selected

      if (mapEditor.isEditing) {
        canvas.cursor = "default";
        canvas.clear();
        mapEditor.coords = [];
        mapEditor.isEditing = false;
      }

      loadMapDataForMapID(map.map_id);
    }
  });
  //this event handler controls adding a new map (from the maps dropdown list)
  elems.mapsList.buttons.addMap.on('click', ()=> {
    modal.maxLength = 100; //this should reflect the datatype length in db
    modal.inputDialog("Please enter a title for a new map", modal.INPUT_TYPE.STRING, true)
      .then( result => {
        if (result.MODAL_RESULT === modal.MODAL_RESULT.OK) {
          let fdata = new FormData();
          fdata.append("action", "add_map");
          fdata.append("map_name", result.input);
          fdata.append("user_id", USER_ID);
          sendFormData(fdata).then(e => {
            if (e.ok && e.isError === false) {
              //e.body holds the id of newly inserted row of db
              mapEditor.newMap(parseInt(e.body), result.input);
              $(`<li>${result.input}</li>`).insertBefore(elems.mapsList.buttons.addMap);
              loadMapDataForMapID(parseInt(e.body));
            } else {
              modal.display("Error processing your request. Could not add Map at this time, please try again later");
            }
          });
        }
      });
  });
  //this event handler controls changing the map description
  elems.metadata.buttons.editMapDesc.on('click', () => {
    if (isNaN(mapEditor.activeMapID)) return;

    if (mapEditor.maps.length === 0) {
      modal.display("Please create a map first");
      return;
    }

    modal.maxLength = 255; //this should reflect the datatypes length in db
    modal.inputDialog(`Enter a map description`, modal.INPUT_TYPE.STRING, true)
      .then(result => {
        if (result.MODAL_RESULT === modal.MODAL_RESULT.OK) {
          let fdata = new FormData();
          fdata.append("action", "update_map_description");
          fdata.append("map_id", mapEditor.activeMapID);
          fdata.append("map_desc", result.input);
          sendFormData(fdata)
            .then(e => {
              if (!e.ok || e.isError === true) {
                modal.display("Error updating description");
              } else {
                mapEditor.activeMap.map_desc = result.input;
                elems.metadata.mapInfo.desc.html(result.input);
              }
            });
        }
      });
  });
  //this event handler controls changing a maps image button click
  elems.metadata.buttons.editMapImage.on('click', () => {
    if (isNaN(mapEditor.activeMapID)) return;

    if (mapEditor.maps.length === 0) {
      modal.display("Please create a map first");
      return;
    }

    if (elems.mapImage.image.attr("src") === undefined || elems.mapImage.image.attr("src") === "" && mapEditor.activeMap.areas.length === 0) {
      initChangeMapImage(); return;
    };

    modal.display("This will remove all map data, including points of interest, connections, videos, images and can not be undone. Do you want to continue?")
      .then(e => {
        if (e === modal.MODAL_RESULT.OK) {
          initChangeMapImage();
        }
      });
  });
  //this event handler controls deleting a map button click
  elems.metadata.buttons.deleteMap.on('click', () => {
    if (isNaN(mapEditor.activeMapID)) return;

    if (mapEditor.maps.length === 0) {
      modal.display("Please create a map first");
      return;
    }

    modal.display("This will remove the current map with all of it's data and can not be undone. Do you want to continue?")
      .then(e => {
        if (e === modal.MODAL_RESULT.OK) {
          removeMap();
        }
      });
  });
  //this event handler controls publish map button click
  elems.metadata.buttons.publishMap.on('click', () => {
    if (isNaN(mapEditor.activeMapID) || mapEditor.isEditing) return;

    if (mapEditor.maps.length === 0) {
      modal.display("Please create a map first");
      return;
    }

    if (mapEditor.activeMap.areas.length < 2) {
      modal.display("We recommend adding at least 2 points of interest before making a map public");
      return;
    }

    if (mapEditor.activeMap.map_image === null || !mapEditor.mapImageDidLoad) {
      modal.display("We recommend adding a map image before making a map public");
      return;
    }

    let newState = (mapEditor.activeMap.isPublished === false) ? 1 : 0;
    let fdata = new FormData()
    fdata.append("action", "toggle_publish_state");
    fdata.append("map_id", mapEditor.activeMapID);
    fdata.append("publish_state", newState);
    sendFormData(fdata)
      .then(e => {
        if (e.ok && e.isError === false) {
          mapEditor.activeMap.isPublished = newState;
          elems.metadata.buttons.publishMap.text((mapEditor.activeMap.isPublished) ? 'UNPUBLISH' : 'PUBLISH');
        } else {
          modal.display("Error processing your request");
        }
      });
  });
  //this event handler controls adding a point of interest button click (accordion not overlay)
  // this is to begin creating a new poi
  elems.metadata.buttons.addPOI.on('click', ()=> {
    if (!mapEditor.canAlterMap || elems.mapImage.image.width === 0 || !mapEditor.mapImageDidLoad) {
      modal.display("Can not currently add a point of interest. Possible reasons are: 1) There is no active map found. 2) There is no map image 3) Your map image has been moved, deleted or can't be found");
      return;
    }
    toggleAddPOIActionsOverlay();
    mapEditor.isEditing = true;

    //change canvas dimensions to image dimensions
    // NOTE: If canvas altering occurs more than this place, move stylng to mapEditor.isEditing setter
    canvas.height = elems.mapImage.image.height();    
    canvas.width = elems.mapImage.image.width();
    canvas.cursor = "crosshair";
    canvas.rezero();

    canvas.setStrokeStyle("defaults");

    elems.mapImage.canvas.onclick = function (e) {
      if (mapEditor.isEditing) {
        let point = getCursorPosition(this, e)
        mapEditor.coords.push(point);

        if (mapEditor.coords.length > 1) canvas.drawLine(mapEditor.coords[mapEditor.coords.length - 2], point);
      }
    }

  });
  //this event handler controls drawing all pois on canvas button click
  elems.metadata.buttons.showAllPOI.on('click', ()=> {
    if (!mapEditor.canAlterMap || mapEditor.activeMap.areas.length === 0 || mapEditor.isEditing) return;

    const gradient = canvas.ctx.createLinearGradient(0, 0, 170, 0);
    gradient.addColorStop("0", "blue");
    gradient.addColorStop("1.0", "cornflowerblue");

    canvas.setStrokeStyle({ lineColor: gradient, fillColor: 'rgba(0,0,255,0.2)' });

    for (let area of mapEditor.activeMap.areas) {
      canvas.drawPath(area.poi_coords, true);
    }
  });
  //this event handler controls removing all pois button click
  elems.metadata.buttons.removeAllPOI.on('click', ()=> {
    if (isNaN(mapEditor.activeMapID) || mapEditor.activeMap.areas.length === 0 || mapEditor.isEditing) return;

    if (mapEditor.maps.length === 0) {
      modal.display("Please create a map first");
      return;
    }
    
    modal.display("Clear all map points of interests? This can not be undone")
      .then(result => {
        if (result === modal.MODAL_RESULT.OK) {
          removeAllPOI(function (e) {
            if (e.ok && e.isError === false) {
              mapEditor.reset();
            } else {
              modal.display("Error processing request");
            }
          });
        }
      });
  });
  //this event handler controls when a poi table row is clicked
  $(document).on('click', `${elems.metadata.tables.poi.selector} tr`, function () {
    let row = $(this).closest('tr').index();
    mapEditor.activePOIIndex = row;
    showPOIModalForPOI(mapEditor.activeMap.areas[row]);
  });
  //this event handler controls when a poi table row is moused over to draw the poi on canvas
  $(document).on('mouseover', `${elems.metadata.tables.poi.selector} tr`, function () {
    let row = $(this).closest('tr').index();
    if (!mapEditor.isEditing) {
      // TODO: Maybe create an icon to hover over centroid instead
      const gradient = canvas.ctx.createLinearGradient(0, 0, 170, 0);
      gradient.addColorStop("0", "tomato");
      gradient.addColorStop("1.0", "red");
      canvas.setStrokeStyle({ lineColor: gradient, fillColor: "rgba(255,0,0,0.4)" });
      canvas.drawPath(mapEditor.activeMap.areas[row].poi_coords, true);
    }
  });
  //this event handler controls when a poi table row is moused out to clear drawn poi on canvas
  $(document).on('mouseout', `${elems.metadata.tables.poi.selector} tr`, () => {
    if (!mapEditor.isEditing) canvas.clear();
  });
  //this event handler controls the add poi button click (overlay not accordion)
  $("#metadata-wrapper__btn__addNewPOI").on('click', () => {
    //check for at least one pair of coords
    if (mapEditor.coords.length > 2) {
      //repeat 1st xy coord to close the polygon
      mapEditor.coords.push(mapEditor.coords[0]);

      modal.maxLength = 50; //this number should reflect the datatype length in db
      modal.inputDialog("Please enter a title for the area", modal.INPUT_TYPE.STRING, true)
        .then(result => {
          if (result.MODAL_RESULT === modal.MODAL_RESULT.OK) {
            let canAddArea = true;
            let p = result.input.toLowerCase();

            //check if the area shares the same name with an existing one
            for (let area of mapEditor.activeMap.areas) {
              let n = area.poi_name.trim().toLowerCase();
              if (n === p) {
                canAddArea = false;
                break;
              }
            }
            if (!canAddArea) {
              modal.display("You can not add more than 1 area sharing the same name as another");
            } else {
              let urlify = Object.assign({}, mapEditor.coords);
              let fdata = new FormData();
              fdata.append("action", "add_poi");
              fdata.append("poi_name", result.input);
              fdata.append("poi_coords", $.param(urlify));
              fdata.append("map_id", mapEditor.activeMapID);
              sendFormData(fdata).then(e => {
                if (e.ok && e.isError === false) {
                  mapEditor.newArea(mapEditor.activeMap, parseInt(e.body), result.input, mapEditor.coords, [], []);
                  toggleAddPOIActionsOverlay();
                  showPOIModalForPOI(mapEditor.activeMap.areas[mapEditor.activeMap.areas.length - 1]);

                  canvas.cursor = "default";
                  //clear the canvas and reset states regardless of coords length
                  canvas.clear();
                  mapEditor.coords = [];
                  mapEditor.isEditing = false;

                  refreshMapAreas();
                } else {
                  modal.display("Error processing your request. Could not add area at this time, please try again later");
                }
              });
            }
          }
        });
    }
  });
  //this event handler controls when cancel poi button click (overlay not accordion)
  $("#metadata-wrapper__btn__cancelNewPOI").on('click', () => {
    mapEditor.coords = [];

    refreshMapAreas();
    mapEditor.isEditing = false;

    //clear the canvas
    canvas.clear();
    canvas.cursor = "default";
    toggleAddPOIActionsOverlay();
  });
  //this event handler controls when a user wants to add an image to a poi, via modal__editPOI
  $(document).on('click', `${elems.modals.editPOI.selector} .poi-images img[data-poi-image-is-set="false"]`, function (e) {
    if (e.target.tagName === "IMG") {
      pickImageDialog((result) => {
        if (result) {
          let img = new Image();
          img.src = result.reader;
          img.onload = () => {
            img.setAttribute("alt", result.file.name);
            img.dataset.poiImageIsSet = "true";
            let isSupportedExtn = FRegex.containsMatch(result.file.type, /^image\/gif$|^image\/png$|^image\/jpg$|^image\/jpeg$/); //this input is shared across the page, so regex is necessary here
            if (!isSupportedExtn) {
              modal.display("Invalid image type. The current supported extensions are : gif, png, jpg, jpeg");
              return;
            }

            if (!e.target.nextElementSibling && $(`${elems.modals.editPOI.selector} .poi-images img`).length < mapEditor.maxNumOfAreaImages) {
              $('<div>' + img.outerHTML + '</div>').insertBefore($(e.target));
            } else {
              $(e.target).replaceWith('<div>' + img.outerHTML + '</div>');
            }
            updatePoiImageCount();
          };
          img.onerror = () => {
            img = null;
          };
        }
      });
    }
  });
  //this event handler controls when a user wants to delete a poi image, this means that the image has been uploaded to server and db has been notified of location
  $(document).on('click', `${elems.modals.editPOI.selector} .poi-images > div > button`, function () {
    if (!$(this).prev() || $(this).prev()[0].tagName !== 'IMG') return;

    let img = $(this).prev()[0];
    let poiImages = mapEditor.activeMap.areas[mapEditor.activePOIIndex].poi_images;
    let imgKey = poiImages.findIndex(f => img.src.endsWith(f.src.replace(BASE_IMAGE_URI + '../', '')));

    if (imgKey < 0) return; //this ensures that there is an image as part of the current poi images list, if -1 (for out of index) return

    let divIndx = $(this).closest('div').index(); //preps to remove the div entirely by getting its index of it's position relative to other images

    let fdata = new FormData();
    fdata.append("action", "remove_poi_image");
    fdata.append("user_name", USER_NAME);
    fdata.append("map_id", mapEditor.activeMapID);
    fdata.append("poi_image", poiImages[imgKey].src);

    sendFormData(fdata).then(e => {
      if (e.ok && e.isError === false) {
        mapEditor.activeMap.areas[mapEditor.activePOIIndex].poi_images.splice(imgKey, 1);
        $(`${elems.modals.editPOI.selector} .poi-images > div`)[divIndx].remove();
        updatePoiImageCount();

        if ($(`${elems.modals.editPOI.selector} .poi-images img[data-poi-image-is-set="true"]`).length === mapEditor.maxNumOfAreaImages - 1) {
          //if there are now 1 image less than max add the placeholder back to upload a new one
          let img = new Image();
          img.src = "../images/icons/media-upload.png";
          img.dataset.poiImageIsSet = "false";
          $(`${elems.modals.editPOI.selector} .poi-images`).append(img);
        }
      } else {
        modal.display("Error processing your request");
      }
    }).catch(e => {
      console.log(e.responseText);
    });
  });
  //this event handler controls when a user wants to delete a POI, via modal__editPOI
  $("#modal__editPOI__btn__deletePOI").on('click', () => {
    removePOIWithIndex(mapEditor.activePOIIndex);
  });
  //this event handler controls when a user closes the editPOI modal
  $("#modal__editPOI__btn__close").on('click', resetPOIModal);
  //this event handler controls when a user wants to 'update' the poi, via modal__editPOI
  $("#modal__editPOI__btn__update").on('click', () => {
    let poiInput = $(`${elems.modals.editPOI.selector} input`)[0];
    let poiVideoURL = $(`${elems.modals.editPOI.selector} input`)[1];

    if (poiVideoURL.value && !FRegex.containsMatch(poiVideoURL.value.trim(), /^https:\/\/www\.youtube\.com\/watch\?v=/)) {
      modal.display("The video URL must be a valid YouTube link\n\nExample: https://www.youtube.com/watch?v=VIDEO_ID");
      return;
    }

    let canAddArea = true;
    let p = poiInput.value.trim().toLowerCase();
    let dpn = (mapEditor.activeMap.areas[mapEditor.activePOIIndex].poi_name) ? mapEditor.activeMap.areas[mapEditor.activePOIIndex].poi_name.toLowerCase() : null;

    if (p.length > 0 && p.length < 51 && FRegex.isRegexMatch(p, FRegex.REGEX_TYPE.STRING)) {
      for (let area of mapEditor.activeMap.areas) {
        let n = area.poi_name.trim().toLowerCase();
        if ((n !== dpn) && (n === p)) {
          canAddArea = false;
          break;
        }
      }
      if (!canAddArea) {
        modal.display("You can not add more than 1 area sharing the same name as another").then(() => { poiInput.focus(); });
      } else {
        let images = [];
        $.each($(`${elems.modals.editPOI.selector} .poi-images img[data-poi-image-is-set="true"]`), function (k, v) {
          images.push({ src: v.src, alt: v.alt });
        });
        let videos = [];
        $.each($(`${elems.modals.editPOI.selector} .poi-videos input`), function (k, v) {
          if (v.value && v.value.trim().length > 0) videos.push(v.value);
        });

        // don't mutate original object unless we know it was successfully updated in backend.
        // create a copy here
        let _areas = mapEditor.activeMap.areas;
        _areas[mapEditor.activePOIIndex].poi_name = poiInput.value.trim();
        _areas[mapEditor.activePOIIndex].poi_images = images;
        _areas[mapEditor.activePOIIndex].poi_videos = videos;

        updateMap(function (e) {
          if (e.ok && e.isError === false) {
            mapEditor.activeMap.areas = _areas;

            canvas.cursor = "default";
            //clear the canvas and reset states regardless of coords length
            canvas.clear();
            mapEditor.coords = [];

            mapEditor.isEditing = false;

            resetPOIModal();
            refreshMapAreas();
          } else {
            _areas = [];
            modal.display("Error processing request");
          }
        });
      }
    } else {
      modal.display("The title is a required field and max of 50 characters").then(() => { poiInput.focus(); });
    }
  });
  //this event handler controls when a user wants to create a new connection
  elems.metadata.buttons.addConn.on('click', ()=> {
    if (mapEditor.maps.length === 0 || !mapEditor.activeMap) return;

    $.each(mapEditor.activeMap.areas.map(m => [m.poi_id, m.poi_name]), function (k, v) {
      elems.modals.selects.addConn_fromConn.append('<option value=' + k + '>' + v[1].toUpperCase() + '</option>');
    });
    elems.modals.addConn.addClass("poi-show-modal");   
  });
  //this event handler controls when a user hovers a connections table row
  $(document).on('click', `${elems.metadata.tables.conn.selector} tr`, function () {
    let row = $(this).closest('tr').index();
    mapEditor.activeConnIndex = row;

    let conn = mapEditor.activeMap.poi_connections[row];
    let toPoi = mapEditor.activeMap.areas.find(f => (f.poi_id === conn.TO));
    let fromPoi = mapEditor.activeMap.areas.find(f => (f.poi_id === conn.FROM));

    if (conn.TO_VIDEO) {
      $("#modal__editConn__input__toVideo").val(conn.TO_VIDEO);
    }
    if (conn.FROM_VIDEO) {
      $("#modal__editConn__input__fromVideo").val(conn.FROM_VIDEO);
    }

    $("#modal__editConn__header").html(fromPoi.poi_name + ' <span style="font-size: 1.75rem; transform: rotate(-90deg); font-weight: 400;">&imof;</span> ' + toPoi.poi_name);
    $("#modal__editConn__fromDesc").html(`From ${Frequent.titleCase(fromPoi.poi_name)} To ${Frequent.titleCase(toPoi.poi_name)} Video:`);
    $("#modal__editConn__toDesc").html(`From ${Frequent.titleCase(toPoi.poi_name)} To ${Frequent.titleCase(fromPoi.poi_name)} Video:`);
    elems.modals.editConn.addClass("poi-show-modal");
  });
  //this event handler controls when the select option of modal__addConn is changed
  elems.modals.selects.addConn_fromConn.change(function () {
    $(`${elems.modals.selects.addConn_toConn.selector} option:not(:first)`).remove();
    elems.modals.selects.addConn_toConn[0].selectedIndex = 0;
    let opt = $(`${elems.modals.selects.addConn_fromConn.selector} option:selected`);

    let poi = mapEditor.activeMap.areas.find(f => f.poi_name.trim().toLowerCase() === opt.text().trim().toLowerCase());

    //denied is a list of pois that can not be populated, initialize to never include self
    // reasons include there is already a connection with current poi in fromConn, remove duplicates and self
    let denied = [poi.poi_id]; 
    $.each(mapEditor.activeMap.poi_connections, function (k, v) {
      if (v.TO === poi.poi_id || v.FROM === poi.poi_id) denied.push(v.TO, v.FROM);
    });

    //remove denied and populate allowed pois
    $.each(mapEditor.activeMap.areas, function (k, v) {
      if ($.unique(denied).indexOf(v.poi_id) < 0) {
        elems.modals.selects.addConn_toConn.append('<option value="' + k + '">' + v.poi_name.toUpperCase() + '</option>');
      }
    });
  });
  //this event handler controls when a user wants to cancel creating a connection
  $("#modal__addConn__btn__cancel").on('click', resetAddConnModal);
  //this event handler controls when create a connection button clicked
  $("#modal__addConn__btn__done").on('click', ()=> {
    let fromOpt = $(`${elems.modals.selects.addConn_fromConn.selector} option:selected`);
    let toOpt = $(`${elems.modals.selects.addConn_toConn.selector} option:selected`);

    //make sure both have an option selected that isn't placeholder
    if (fromOpt.index() === 0 || toOpt.index() === 0) {
      $("#modal__addConn__error").html("You must select a 'Starting' and 'Ending' location");
      return;
    }

    let fromPOI = mapEditor.activeMap.areas.find(f => f.poi_name.trim().toLowerCase() === fromOpt.text().trim().toLowerCase());
    let toPOI = mapEditor.activeMap.areas.find(f => f.poi_name.trim().toLowerCase() === toOpt.text().trim().toLowerCase());

    let fdata = new FormData();
    fdata.append("action", "add_poi_connection");
    fdata.append("to", toPOI.poi_id);
    fdata.append("from", fromPOI.poi_id);
    fdata.append("map_id", mapEditor.activeMapID);
    sendFormData(fdata).then(e => {
      if (e.ok && e.isError === false) {
        mapEditor.activeMap.poi_connections.push({ TO: toPOI.poi_id, FROM: fromPOI.poi_id });
        elems.modals.addConn.removeClass("poi-show-modal");
        resetAddConnModal();
        refreshMapAreas();
      } else {
        $("#modal__addConn__error").html(e.error);
      }
    });
  });
  //this event handler controls when a user wants to delete a connection ,via modal__editConn
  $("#modal__editConn__btn__deleteConn").on('click', () => {
    if (!mapEditor.canAlterMap) return;

    removePOIConnWithIndex(mapEditor.activeConnIndex);
  });
  //this event handler controls when a user wants to cancel the modal__editConn
  $("#modal__editConn__btn__cancel").on('click', resetEditConnModal);
  //this event handler controls when a user wants to update an existing connection on 'update' button click
  $("#modal__editConn__btn__update").on('click', () => {
    if (isNaN(mapEditor.activeMapID)) return;

    if (mapEditor.maps.length === 0) {
      modal.display("Please create a map first");
      return;
    }

    let to_video = $("#modal__editConn__input__toVideo");
    let from_video = $("#modal__editConn__input__fromVideo");
    let youtubeRegex = /^https:\/\/www\.youtube\.com\/watch\?v=/;
    if ((to_video.val() && !FRegex.containsMatch(to_video.val().trim(), youtubeRegex)) || (from_video.val() && !FRegex.containsMatch(from_video.val().trim(), youtubeRegex))) {
      modal.display("Video URLs must be a valid YouTube link\n\nExample: https://www.youtube.com/watch?v=VIDEO_ID");
      return;
    }

    let conn = mapEditor.activeMap.poi_connections[mapEditor.activeConnIndex];

    let fdata = new FormData();
    fdata.append("action", "update_poi_connection_video");
    fdata.append("to_poi_video", to_video.val().trim());
    fdata.append("to_poi_id", conn.TO);
    fdata.append("from_poi_video", from_video.val().trim());
    fdata.append("from_poi_id", conn.FROM);
    fdata.append("map_id", mapEditor.activeMapID);
    sendFormData(fdata)
      .then(e => {
        if (e.ok && e.isError === false) {
          if (to_video.val()) {
            mapEditor.activeMap.poi_connections[mapEditor.activeConnIndex].TO_VIDEO = to_video.val().trim();
          } else {
            mapEditor.activeMap.poi_connections[mapEditor.activeConnIndex].TO_VIDEO = "";
          }
          if (from_video.val()) {
            mapEditor.activeMap.poi_connections[mapEditor.activeConnIndex].FROM_VIDEO = from_video.val().trim();
          } else {
            mapEditor.activeMap.poi_connections[mapEditor.activeConnIndex].FROM_VIDEO = "";
          }

          resetEditConnModal();
          refreshMapAreas();
        } else {
          modal.display("Error " + e.error);
        }
      });
  });
  //this event handler controls when a youtube button is clicked
  // this is global. Any button next to an <input> element with a data tag of data-isYTLink="true" will open it's link
  $(document).on('click', 'button[data-isYTLink="true"]', function(e) {
    if ($(this).prev() && $(this).prev().attr('data-isYTLink') === 'true' && $(this).prev().val() !== '') {
      e.preventDefault();
      let win = window.open($(this).prev().val(), '_blank');
      if (win) win.focus();
    }
  });
  /**
   * END REGION => BUTTON EVENT HANDLERS
   */

  /**
   * REGION => USER DEFINED FUNCTIONS
   */
  /**
   * This toggles the #modal__addPOI overlay from no display to display.
   * 
   * This modal allows the user to confirm they want to add a newly plotted (drawn) area on the canvas, or cancel it
   * 
   * This modal can is draggable. See index.html:134
   */
  function toggleAddPOIActionsOverlay() {
    if (elems.overlays.addPOIActions.css('display') === 'none') {
      elems.overlays.addPOIActions.css('display', 'flex');
    } else {
      elems.overlays.addPOIActions.css('display', 'none');
      mapEditor.coords = [];
      mapEditor.isEditing = false;
      canvas.clear();
    }
    elems.overlays.addPOIActions.offset({top: 125, left: 900});
  }
  /**
   * This resets #modal__addConn and any of its children accordingly
   */
  function resetAddConnModal() {
    elems.modals.addConn.removeClass("poi-show-modal");
    $("#modal__addConn__error").html('');
    $(`${elems.modals.selects.addConn_fromConn.selector} option:not(:first), ${elems.modals.selects.addConn_toConn.selector} option:not(:first)`).remove();
    elems.modals.selects.addConn_fromConn[0].selectedIndex = 0;
    elems.modals.selects.addConn_toConn[0].selectedIndex = 0;
  }
  /**
   * This resets #modal__editConn and any of its children accordingly
   */
  function resetEditConnModal() {
    $("#modal__editConn__input__toVideo").val("");
    $("#modal__editConn__input__fromVideo").val("");
    $("#modal__editConn__header").html('');
    $("#modal__editConn__toDesc").html('');
    $("#modal__editConn__fromDesc").html('');
    elems.modals.editConn.removeClass("poi-show-modal");
    mapEditor.activeConnIndex = undefined;
  }
  /**
   * This shows a modal with all the POI metadata (images, videos), minus connections
   * @param {Object} area passed as the map area of choice
   */
  function showPOIModalForPOI(area) {
    $(`${elems.modals.editPOI.selector} input`)[0].value = area.poi_name;
    if (area.poi_videos.length > 0) $(`${elems.modals.editPOI.selector} input`)[1].value = area.poi_videos[0];
    $.each(area.poi_images, function (k, v) {
      //add images
      let img = new Image();
      img.src = ((v.src.indexOf("data:image/") > -1 || v.src.indexOf("http") > -1) ? "" : BASE_IMAGE_URI) + v.src;
      img.dataset.poiImageIsSet = "true";
      img.setAttribute("alt", v.alt);
      //TODO: add img.onerror for 404 
      img.onload = () => {
        //this will add images once they load, which can cause them to seem 'out of order'
        let div = '<div>' + img.outerHTML + '<button style="background-color: white;">delete</button></div>';
        $(`${elems.modals.editPOI.selector} .poi-images`).prepend(div);
        updatePoiImageCount();
      };
    });

    if (area.poi_images.length < mapEditor.maxNumOfAreaImages) {
      //after all images are loaded and there is room for more uploads add the placeholder
      $(`${elems.modals.editPOI.selector} .poi-images`).append('<img src="../images/icons/media-upload.png" data-poi-image-is-set="false"></img >');
    }
    elems.modals.editPOI.addClass("poi-show-modal");
  }
  /**
   * Resets #modal_editPOI and all necessary children
   */
  function resetPOIModal() {
    elems.modals.editPOI.removeClass("poi-show-modal");
    $(`${elems.modals.editPOI.selector} input`).val("");
    $(`${elems.modals.editPOI.selector} .poi-images`).empty();
    mapEditor.activePOIIndex = undefined;
    updatePoiImageCount();
  }
  /**
   * Updates the POI image count for #modal__editPOI
   */
  function updatePoiImageCount() {
    let span = document.querySelector(`${elems.modals.editPOI.selector} .media-count:first-of-type`);
    span.innerHTML = $(`${elems.modals.editPOI.selector} .poi-images img[data-poi-image-is-set="true"]`).length + "/5";
  }
  /**
   * Removes a POI, and subsequently images/metadata from server/db, from the map, mapEditor object, server
   * Requires a valid signed/logged in user
   * 
   * @param {Integer} poiIndex the index of the poi relative to mapEditor.maps.areas to be removed 
   */
  function removePOIWithIndex(poiIndex) {
    let poi = mapEditor.activeMap.areas[poiIndex];

    let fdata = new FormData();
    fdata.append("action", "remove_poi");
    fdata.append("user_name", USER_NAME);
    fdata.append("map_id", mapEditor.activeMapID);
    fdata.append("poi_id", poi.poi_id);

    sendFormData(fdata).then(e => {
      if (e.ok && e.isError === false) {
        mapEditor.activeMap.areas.splice(poiIndex, 1); //avoid delete keyword here to maintain array index
        mapEditor.activeMap.poi_connections = mapEditor.activeMap.poi_connections.filter(f => (f.TO !== poi.poi_id && f.FROM !== poi.poi_id));
        if (!mapEditor.isEditing) canvas.clear();

        resetPOIModal();
        refreshMapAreas();
      } else {
        modal.display("Error processing your request");
      }
    });
  }
  /**
   * Remove all POI's for activeMap, and subsequently images/metadata from server/db, from the server and mapEditor object
   * Requires a valid signed/logged in user
   * 
   * This is maintained as an async/await solution to ensure we get the response first before proceeding. No if's and's or butts
   * @param {Function} callback 
   */
  async function removeAllPOI(callback) {
    let fdata = new FormData();
    fdata.append("action", "remove_all_poi");
    fdata.append("user_name", USER_NAME);
    fdata.append("map_id", mapEditor.activeMapID);

    let result = await sendFormData(fdata);

    if (callback && Frequent.isFunction(callback)) callback(result);
  }
  /**
   * This removes a connection, and subsequently video links from server/db, from the server and mapEditor object
   * Requires a valid signed/logged in user
   * 
   * @param {Integer} connIndex the index of the connection relative to mapEditormaps.poi_connections
   */
  function removePOIConnWithIndex(connIndex) {
    let prev = mapEditor.activeMap.poi_connections;
    let conn = mapEditor.activeMap.poi_connections[connIndex];

    let fdata = new FormData();
    fdata.append("action", "remove_poi_connection");
    fdata.append("map_id", mapEditor.activeMapID);
    fdata.append("to", conn.TO);
    fdata.append("from", conn.FROM);
    fdata.append("user_name", USER_NAME);

    sendFormData(fdata).then(e => {
      if (e.ok && e.isError === false) {
        mapEditor.activeMap.poi_connections.splice(connIndex, 1);

        if (!mapEditor.isEditing) canvas.clear();

        refreshMapAreas();
        resetEditConnModal();
      } else {
        modal.display("Error processing your request");
      }
    });
  }
  /**
   * This removes the activeMap ONLY and then attempts to load next map possible
   * Requires a valid signed/logged in user
   */
  function removeMap() {
    let fdata = new FormData();
    fdata.append("action", "remove_map");
    fdata.append("user_name", USER_NAME);
    fdata.append("map_id", mapEditor.activeMapID);
    sendFormData(fdata).then(e => {
      if (e.ok && e.isError === false) {
        modal.display("Successfully removed map. It can no longer be searched publically");

        $(`${elems.mapsList.wrapper.selector} li`)[mapEditor.activeMapIndex].remove();
        mapEditor.maps.splice(mapEditor.activeMapIndex, 1);
        let newId = (mapEditor.maps.length > 0) ? mapEditor.maps[0].map_id : undefined;
        loadMapDataForMapID(newId);
      } else {
        modal.display(e.error);
      }
    });
  }
  /**
   * This will update a map, the map info, and any areas passed with it. (For now this is simply used to update POI's as all other map info is resepctively handled)
   * Requires a valid signed/logged in user
   * 
   * This is maintained as an async/await solution to ensure we get the response first before proceeding. No if's and's or butts
   * @param {Function} callback 
   */
  async function updateMap(callback) {
    if (mapEditor.maps.length > 0) {

      let urlify = Object.assign({}, mapEditor.activeMap.areas);
      let fdata = new FormData();
      fdata.append("action", "update_map");
      fdata.append("map_id", mapEditor.activeMapID);
      fdata.append("map_desc", elems.metadata.mapInfo.desc.text());
      fdata.append("user_name", USER_NAME);
      fdata.append("user_id", USER_ID);
      if (elems.mapImage.image.attr("src")) fdata.append("map_image", elems.mapImage.image.attr("src"));
      fdata.append("areas", $.param(urlify));

      let result = await sendFormData(fdata);

      if (callback && Frequent.isFunction(callback)) callback(result);
    }
  }
  /**
   * This initiates the process to change a maps image. Users can cancel here from FileReader as well.
   * Requires a valid signed/logged in user
   * 
   * This removes all points of interests from the map, as the idea of changing an image, means the coordinates won't match, in most cases, unless the user is just 
   * uploading a higher resolution of the same image, which is possible, but surely not going to happen more than the opposite
   */
  function initChangeMapImage() {
    pickImageDialog((result) => {
      if (result) {
        let img = new Image();
        img.src = result.reader;
        img.onload = function () {
          let isSupportedExtn = FRegex.containsMatch(result.file.type, /^image\/png$|^image\/jpg$|^image\/jpeg$/); //this input is shared across the page, so regex is necessary here
          if (this.naturalHeight !== 500 || this.naturalWidth !== 1000 || !isSupportedExtn) {
            modal.display("The image is invalid. Please use an image size of 1000 x 500\n\nSupported file types are .jpeg, .jpg, .png");
            img = null;
          } else {
            let mapIndx = mapEditor.activeMapIndex;
            let fdata = new FormData();
            fdata.append("action", "update_map");
            fdata.append("map_id", mapEditor.maps[mapIndx].map_id);
            fdata.append("map_desc", mapEditor.maps[mapIndx].map_desc);
            fdata.append("user_name", USER_NAME);
            fdata.append("user_id", USER_ID);
            fdata.append("map_image", result.reader);
            fdata.append("areas", {});
            sendFormData(fdata)
              .then(e => {
                if (e.ok && e.isError === false) {
                  elems.mapImage.image.error(() => mapEditor.mapImageDidLoad = false);
                  elems.mapImage.image.load(() => {
                    mapEditor.mapImageDidLoad = true;
                    mapEditor.maps[mapIndx].map_image = result.reader;
                  });
                  elems.mapImage.image.attr('src', result.reader);
                  elems.mapImage.image.attr('alt', result.file.name);
                  if (mapEditor.activeMap.areas.length > 0) {
                    removeAllPOI(function (e) {
                      if (e.ok && e.isError === false) {
                        mapEditor.reset();
                      }
                    });
                  }
                } else {
                  modal.display("Error processing your request");
                }
              });
          }
        }
        img.onerror = () => {
          img = null;
        };
      }
    });
  }

  /**
   * Self explanatory 
   * Wrapped in promise to ensure async/await flexability
   * 
   * NOTE: this probably shouldn't be client side. individuals can see parameters appended in script
   * @param {FormData} fdata a FormData object to be sent with request
   * @param {String} [url] url for FormData to be sent, optional
   */
  function sendFormData(fdata, url) {
    modal.displayLoadingHUD();
    return new Promise(function (resolve, reject) {
      $.ajax({
        type: 'POST',
        url: url || '../php/db_updater.php',
        data: fdata,
        processData: false,
        contentType: false,
        timeout: 15000,
        success: function (response, status, jqXHR) {
          resolve(response);
          modal.hideModal();
        },
        error: function (jqXHR, status, e) {
          reject(jqXHR, status, e);
          modal.hideModal();
        }
      });
    });
  }

  /**
   * Requests mapdata for all maps depending on query value (needs)
   * Requires a valid signed/logged in user
   * 
   * Recommended to not call this dynamically, only on first load
   * 
   * @param {String} query value of Query parameter to get map results for.
   */
  function getMapData(query) {
    modal.displayLoadingHUD();
    return new Promise(function (resolve, reject) {
      $.ajax({
        type: 'GET',
        url: '../php/db_query.php?Query=' + query.toLowerCase() + "&user_id=" + USER_ID,
        dataType: 'json',
        timeout: 15000,
        success: function (json) {
          resolve(json);
          modal.hideModal();
        },
        error: function (jqXHR, status, e) {
          reject(jqXHR, status, e);
          modal.hideModal();
        }
      });
    });
  }
  /**
   * Loads/resets/changes all User Interfaces, related to the map, to a given maps information
   * @param {Integer} map_id given map_id 
   */
  function loadMapDataForMapID(map_id) {    
    let map = mapEditor.maps.find(f => f.map_id === map_id);
    if (map !== undefined) {   
      mapEditor.activeMapID = map_id;
      console.log(`%c LOADING MAP FOR MAP ID: ${map_id}`, 'background: blue; color: white;');
      console.table(map);
      // old =>
      // if (map.map_image !== null && FRegex.containsMatch(map.map_image, /\.png$/)) {
        // removing this will cause problems with BASE_IMAGE_URL prepending the map_image value (say if the value is still base64 form, it will prepend with '../tmp' or whatever it is causing an erroneous error, only if something is in BASE_IMAGE_URI) see showPOIModalForPOI for a workaround if values will be entered in BASE_IMAGE_URI
      if (map.map_image !== null) {
        elems.mapImage.image.error(() => {
          mapEditor.mapImageDidLoad = false;
          elems.mapImage.image.attr('src', '');
          mapEditor.showImgSizePlaceholder();
        });
        elems.mapImage.image.load(() => mapEditor.mapImageDidLoad = true);
        elems.mapImage.image.attr('src', BASE_IMAGE_URI + map.map_image);
        canvas.clear();
      } else {
        elems.mapImage.image.attr('src', "");
        elems.mapImage.image.attr('alt', "");
        mapEditor.mapImageDidLoad = false;
        mapEditor.showImgSizePlaceholder();
      }
      elems.metadata.mapInfo.desc.html(map.map_desc);
      elems.metadata.mapInfo.name.html(map.map_name);
      elems.metadata.buttons.publishMap.text((mapEditor.activeMap.isPublished) ? 'UNPUBLISH' : 'PUBLISH');
      refreshMapAreas();
    } else {
      console.warn(`Could not find map using id: ${map_id}`);
      
      elems.mapImage.image.attr('src', '');
      elems.mapImage.image.attr('alt', '');
      mapEditor.mapImageDidLoad = false;
      elems.metadata.mapInfo.desc.html('');
      elems.metadata.mapInfo.name.html('');
      elems.metadata.tables.poi.empty();
      elems.metadata.tables.conn.empty();
      elems.metadata.buttons.publishMap.html('PUBLISH');
      mapEditor.activeMapID = undefined;
      mapEditor.showImgSizePlaceholder();
    }

    mapEditor.showImgSizePlaceholder();
  }
  /**
   * Updates a given maps areas. This function is mostly used to update table references (pois, connections)
   */
  function refreshMapAreas() {
    elems.metadata.tables.poi.empty();
    elems.metadata.tables.conn.empty();
    let i = 0;
    for (let area of mapEditor.activeMap.areas) {
      let tblRow =
        '<tr>' +
        '<td>' + (++i) + '</td>' +
        '<td>' + area.poi_name + '</td>' +
        '</tr>';
      elems.metadata.tables.poi.append(tblRow);
    }
    i = 0;
    for (let conn of mapEditor.activeMap.poi_connections) {
      let toConn = mapEditor.activeMap.areas.find(f => f.poi_id === conn.TO);
      let fromConn = mapEditor.activeMap.areas.find(f => f.poi_id === conn.FROM);
      let tblRow =
        '<tr data-poi-conn-from="' + fromConn.poi_id + '" data-poi-conn-to="' + toConn.poi_id + '">' +
        '<td>' + (++i) + '</td>' +
        '<td>' + fromConn.poi_name + ' <span style="font-size: 1.5rem; line-height: 0.8; transform: rotate(-90deg)">&imof;</span> ' + toConn.poi_name + '</td>' +
        '</tr>';
      elems.metadata.tables.conn.append(tblRow);
    }
  }
  /**
 * Upload Image Dialog; as of now, this queries all selectors with input type due to only
 * having one in DOM
 * @param  {Function} callback callback function to be executed after completion
 * @return {Object}            undefined if no file found, otherwise returns { reader: result only, file: file }
 */
  function pickImageDialog(callback) {
    elems.mapImage.trigger.trigger("click");
    //get a new instance
    let trigger = document.getElementById("img-wrapper__trigger__selectFile");
    trigger.onchange = function () {
      let files = trigger.files;
      if (files && files.length > 0) {
        try {
          const fileReader = new FileReader(); //best not to support blobs at this time as it alienates a lot of users
          fileReader.onload = () => {
            callback({ reader: fileReader.result, file: files[0] });
            document.forms["img-wrapper__form"].reset();
          };
          fileReader.readAsDataURL(files[0]);
        }
        catch (e) {
          console.error(`File Upload not supported: ${e}`);
          callback(undefined);
        }
      }
    };
  }
  /**
 * Get's current mouse position, relative to canvas offset, scroll offest and page offset,
 * if browser supports pageX, pageY it uses those values as they work independantly of scrolling
 * @param  {DOM Element} c canvas for offset
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
  /**
   * END REGION => USER DEFINED FUNCTIONS
   */
});