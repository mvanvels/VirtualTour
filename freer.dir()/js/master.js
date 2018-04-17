/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 2/10/2018
*/
import { SimpleModal } from '/js/simple-modal.js';
import { FRegex } from '/js/frequent.js';
/**
 * jQuery specific function extensions
 * Extends a toggle display to any element based on css property display
 * Extends a toggle disabled to tagName button
 */
jQuery.fn.extend({
  toggleDisplay: function(isDisplayed) {
    //isDisplayed is an optional paramter. recommend validating against typeofs with booleans
    return this.each(function() {
      if ((typeof isDisplayed !== "undefined") && isDisplayed === true) {
        $(this).show();
        return;
      }
      if ((typeof isDisplayed !== "undefined") && isDisplayed === false) {
        $(this).hide();
        return;
      }
      // NOTE: not the same as jQuery's .is(:visible)
      if ( $(this).css("display") === "none") {
         $(this).show();
      } else {
         $(this).hide();
      }
    });
  },
  toggleDisabled: function(isDisabled) {
    return this.each(function() {
      //isDisabled is optional parameter. recommend validating against typeofs with booleans
        // this works with arrays or single elements
        // example usage: $("selector1, selector2, selector3").toggleDisabled()
        //  or $("#id").toggleDisabled(true)
      if (this.tagName === "BUTTON")
        $(this).prop('disabled', (typeof isDisabled === 'undefined') ? !$(this).prop('disabled') : isDisabled);
      // TODO: add other DOM tags
    });
  }
});

$(document).ready(function(e) {
  //global object of DOM elements with id's here to prevent link rot and multiples of branches
  const elems = {
    buttons : {
      addArea : {
        menu : $("#btn_addAreasMenu"),
        area : $("#btn_addArea"),
        connection : $("#btn_addConnection"),
        confirmations : $("#map-wrapper .topbar button:not(:last)")
      },
      clearAllAreas : $("#btn_clearAllAreas"),
      showhideAllAreas : $("#btn_showhideAllAreas"),
      publish : $("#btn_publish"),
      addMap : $("#btn_addMap"),
      changeMap : $("#btn_changeMap"),
      changeMapImage : $("#btn_changeMapImage"),
      uploadMapImageTrigger :  $("#btn_uploadMapTrigger")
    },
    map : {
      wrapper : $("#map-wrapper"),
      image : $("#map-image"),
      container : $("#map-container"),
      poiWrapper : $("#poi-wrapper"),
      map : $("#map"),
      canvas : $("#canvas")
    },
    tables : {
      poi : $("#tbl_poi")
    },
    lists : {
      mapsList : $("#list_maps")
    },
    modals : {
      poi : $("#poiModal")
    }
  }
  /**
   * All things that relate to the map environment are explicitly altered here
   * @type {Object}
   */
  let mapEditor = {
    isEditing : false,
    mapCount : 0,
    set isEditingMap(_bool) {
      this.isEditing = _bool;
      //do things when map edit mode changes. this is called automatically
      refreshButtonStates();
    },
    get isEditingMap() { return this.isEditing },
    coords : [],
    areas : [],
    reset : function() {
      this.coords = [];
      this.areas = [];
      canvas.clear();
      refreshMapAreas();
      this.isEditingMap = false;
    }
  }

  let canvas = new SimpleCanvas(elems.map.canvas[0]); //0 index is required for jQuery selector
  let modal = new SimpleModal();
  //set placeholder text if no image is found
  //  this is arbitrary, probably won't stay in after tutorial is complete
  canvas.ctx.font="1.2rem Roboto, Open Sans";
  canvas.ctx.fillStyle = "lightgrey";
  canvas.ctx.textAlign = "center";
  canvas.ctx.fillText("1000 x 500", 496, 305);

  //preset all buttons on load to disabled
  $("#map-wrapper .topbar button, #map-wrapper .sidebar button, #btn_publish").toggleDisabled(true);
  //priming isEditingMap, this is necessary to call related functions nested in the setter
  mapEditor.isEditingMap = false;

  /**
   * EVENT LISTENER REGION: Register all webpage event listeners here.
   * Also ensures the priming value of mapEditor.isEditing = false
   */
  //completion of file upload dialog. this assumes browser support of FileReader
  elems.buttons.uploadMapImageTrigger.on("change", ()=> {
    uploadImageDialog((result)=> {
      if (result) {
        let img = new Image();
        img.src = result.reader;
        img.onload = function() {
          let isSupportedExtn = FRegex.containsMatch(result.file.type,/^image\/png$|^image\/jpg$|^image\/jpeg$/);
          if (this.height !== 500 || this.width !== 1000 || !isSupportedExtn) {
            modal.display("The image size is invalid. Please use an image size of 1000 x 500\n\nSupported file types are .jpeg, .jpg, .png");
            img = null;
          } else {
            elems.map.image.attr('src', result.reader);
            elems.map.image.attr('alt', result.file.name);

            mapEditor.reset();
            refreshMapAreas();
            img = null;
          }
        }
        img.onerror = ()=> {
          img = null;
        };
      }
    })
  });
  //add map button in the select maps drop down
  elems.buttons.addMap.on("click", ()=> {
    modal.inputDialog("Please enter a title for the Map", modal.INPUT_TYPE.STRING, true)
      .then( result => {
        if (result.MODAL_RESULT === modal.MODAL_RESULT.OK) {
          if (mapEditor.mapCount > 0) {
            if (mapEditor.mapCount === 1) $('<li role="separator" class="divider"></li>').insertBefore($("#list_maps li:last-of-type"));
            $('<li><a href="#">' + elems.buttons.changeMap.val() + '</a></li>').insertBefore("#list_maps .divider");
          }

          elems.buttons.changeMap.html(result.input + ' <span class="caret">');
          elems.buttons.changeMap.val(result.input);
          mapEditor.mapCount++;
          refreshButtonStates();
        }
      });
  });
  //change map image button to upload new image file
  elems.buttons.changeMapImage.on("click", ()=> {
    elems.buttons.uploadMapImageTrigger.trigger("click");
  })
  //add new area button selected
  elems.buttons.addArea.area.on("click", ()=> {
    mapEditor.isEditingMap = true;
    // NOTE: canvas isn't supported in <= IE8

    //change canvas dimensions to image dimensions
    // TODO: If canvas altering occurs more than this place, move stylng to mapEditor.isEditing setter
    canvas.height = elems.map.image.height();
    canvas.width = elems.map.image.width();
    canvas.cursor = "crosshair";
    canvas.rezero();

    canvas.setStrokeStyle("defaults");

    elems.map.canvas[0].onclick = function(e) {
      if (mapEditor.isEditingMap) {
        let point = getCursorPosition(this, e)
        mapEditor.coords.push(point);

        if (mapEditor.coords.length > 1) canvas.drawLine(mapEditor.coords[mapEditor.coords.length - 2], point);
      }
    }

  })
  // cancel area creation
  $("#btn_areaCancel").on("click", ()=> {
      mapEditor.coords = [];

      refreshMapAreas();
      mapEditor.isEditingMap = false;

      //clear the canvas
      canvas.clear();
      canvas.cursor = "default";
  });
  // done area creation
  $("#btn_areaComplete").on("click", ()=> {
      //check for at least one pair of coords
      if (mapEditor.coords.length > 2) {
        //repeat 1st xy coord to close the polygon
        mapEditor.coords.push(mapEditor.coords[0]);
        elems.modals.poi.addClass("poi-show-modal");
      }
  });
  // // NOTE: ENDED HERE
  $("#btn_poiModalSave").on("click", ()=> {
    let poiInput = $("#poiModal input")[0];

    let canAddArea = true;
    if (poiInput.value && poiInput.value.trim().length > 0 && FRegex.isRegexMatch(poiInput.value.trim(), FRegex.REGEX_TYPE.ALPHANUMERIC)) {

      for (let area of mapEditor.areas) {
        if (area.name.trim().toLowerCase() == poiInput.value.trim().toLowerCase()) {
          canAddArea = false;
          break;
        }
      }

      if (!canAddArea) {
        modal.display("You can not add more than 1 area sharing the same name as another").then(()=>{poiInput.focus();});
      } else {
        mapEditor.areas.push( { name : poiInput.value.trim(), coords : mapEditor.coords } )
        canvas.cursor = "default";
        console.table(mapEditor.areas); // DEBUG: dev only
        //clear the canvas and reset states regardless of coords length
        canvas.clear();
        mapEditor.coords = [];

        mapEditor.isEditingMap = false;

        resetPOIModal();
        refreshMapAreas();
      }
    } else {
      modal.display("The title is a required field and must be alphanumeric only").then(() => {poiInput.focus();} );
    }
  });
  $("#btn_poiModalClose").on("click", resetPOIModal);
  $("#poiModal .poi-images img").on("click", (e)=> {
    if(!e.nextSibling) {
      console.log("last sibling");
      if ($("#poiModal .poi-images img").length < 5) {
        let clone = $(e.target).clone();
        clone.insertBefore(e.target);
      }
    }
  });
  function resetPOIModal() {
    elems.modals.poi.removeClass("poi-show-modal");
    elems.modals.poi.attr("data-poi-is-set", "false");
    $("#poiModal input")[0].value = "";
    // TODO: cleanse images and media
    $("#poiModal img").src = "";
  }
  // show hide all created areas
  elems.buttons.showhideAllAreas.on("click", ()=> {
    switch (elems.buttons.showhideAllAreas.val()) {
      case "show":
        const gradient=canvas.ctx.createLinearGradient(0,0,170,0);
        gradient.addColorStop("0","blue");
        gradient.addColorStop("1.0","cornflowerblue");

        canvas.setStrokeStyle({ lineColor : gradient, fillColor : 'rgba(0,0,255,0.2)' });

        for (let area of mapEditor.areas) {
          canvas.drawPath(area.coords, true);
        }

        elems.buttons.showhideAllAreas.val("hide");
        elems.buttons.showhideAllAreas.prop("title", "Hide All Areas");
        elems.buttons.showhideAllAreas.html('<i class="far fa-eye-slash"></i>');
        break;
      case "hide":
        canvas.clear();
        elems.buttons.showhideAllAreas.val("show");
        elems.buttons.showhideAllAreas.prop("title", "Show All Areas");
        elems.buttons.showhideAllAreas.html('<i class="fas fa-eye"></i>');
        break;
      default:
    }
  });
  // clear all areas from drawing and mapEditor.areas array
  elems.buttons.clearAllAreas.on("click", ()=> {
    modal.display("Clear all map data?")
      .then( result => {
        if (result === modal.MODAL_RESULT.OK)
          mapEditor.reset();
      });
  })
  /*%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  **------- END OF EVENT LISTENER REGION -----
  %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%*/

  /**
   * Refreshes all the button states respective of the current environment flow
   */
  function refreshButtonStates() {

    // this section occurs regardless of editing state
    elems.buttons.showhideAllAreas.val("show");
    elems.buttons.showhideAllAreas.prop("title", "Show All Areas");
    elems.buttons.showhideAllAreas.html('<i class="fas fa-eye"></i>');

    //handle states for when user is editing map (adding areas, connections). short circuits here if so
    if (mapEditor.isEditingMap) {
      elems.buttons.changeMapImage.toggleDisabled(true);
      elems.buttons.addArea.menu.toggleDisabled(true);

      elems.buttons.showhideAllAreas.toggleDisabled(true);

      elems.buttons.clearAllAreas.toggleDisabled(true);
      elems.buttons.addArea.confirmations.toggleDisabled(false);
      elems.buttons.publish.toggleDisabled(true);

      elems.buttons.addArea.confirmations.toggleDisplay(true);

      return;
    }

    elems.buttons.addArea.menu.toggleDisabled(true);
    elems.buttons.addArea.confirmations.toggleDisabled(true);
    elems.buttons.addArea.confirmations.toggleDisplay(false);
    elems.buttons.publish.toggleDisabled(true);

    //if number of maps in users #list_maps dropdown
    if (mapEditor.mapCount > 0) {
      elems.buttons.changeMapImage.toggleDisabled(false);
    } else {
      elems.buttons.changeMapImage.toggleDisabled(true);
    }

    //if an image is in the <img> tag of #map-wrapper
    if (elems.map.image.attr("src")) {
      elems.buttons.addArea.menu.toggleDisabled(false);
      elems.buttons.showhideAllAreas.toggleDisabled(true);
      elems.buttons.clearAllAreas.toggleDisabled(true);

      if (mapEditor.areas.length > 0) {
        elems.buttons.publish.toggleDisabled(false);
        elems.buttons.showhideAllAreas.toggleDisabled(false);
        elems.buttons.clearAllAreas.toggleDisabled(false);

        if (mapEditor.areas.length > 1) {
          elems.buttons.addArea.connection.parent().removeClass("disabled");
        } else {
          elems.buttons.addArea.connection.parent().addClass("disabled");
        }
      }
    }
  }
  /**
   * Updates map areas. This function is mostly used to update table references
   * This function handles the points of interest table event listeners per requirements
   */
  function refreshMapAreas() {
    elems.map.map.empty();
    elems.tables.poi.empty();

    let i = 0;
    for (let area of mapEditor.areas) {
      let tblRow =
          '<tr>' +
            '<td>' + (++i) + '</td>' +
            '<td>' + area.name + '</td>' +
            '<td><button typed="button" name="button" class="btn btn-secondary"><i class="far fa-edit"></i></button></td>' +
          '</tr>';
      elems.tables.poi.append(tblRow);
    }
    $("#tbl_poi tr").on("mouseenter", function() {
      let row = $(this).closest('tr').index();
      if (!mapEditor.isEditingMap) {
        // TODO: Maybe create an icon to hover over centroid instead
        const gradient=canvas.ctx.createLinearGradient(0,0,170,0);
        gradient.addColorStop("0","tomato");
        gradient.addColorStop("1.0","red");
        canvas.setStrokeStyle( { lineColor : gradient, fillColor : "rgba(255,0,0,0.4)" } );
        canvas.drawPath(mapEditor.areas[row].coords, true);
      }
    })

    $("#tbl_poi tr").on("mouseout", () => {
      // NOTE: need testers. We have the option to save & restore states.
      if (!mapEditor.isEditingMap) canvas.clear();
    })
  }
  /**
   * Upload Image Dialog; as of now, this queries all selectors with input type due to only
   * having one in DOM
   * @param  {Function} callback callback function to be executed after completion
   * @return {Object}            undefined if no file found, otherwise returns { reader: result only, file: file }
   */
  function uploadImageDialog(callback) {
    let file    = document.querySelector('input[type=file]').files[0];
    let reader  = new FileReader();

    reader.addEventListener("load", () => {
      callback( { reader : reader.result, file : file } );
    }, false);

    if (file) {
      reader.readAsDataURL(file);
    } else {
      callback(undefined);
    }
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
    return {x: mx, y: my};
  }
});
