// NOTE : See here
  // https://developers.google.com/youtube/player_parameters?playerVersion=HTML5
  // https://developers.google.com/youtube/iframe_api_reference#loadVideoById
    
  // 2. This code loads the IFrame Player API code asynchronously.
let tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// 3. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
let ytPlayer;
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('ytplayer__tour', {
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    },
    playerVars : {
      'autoplay' : true,
      'playsinline' : true,
      'showinfo' : false,
      'modestbranding': true,
      'rel' : false,
      'controls': false
    }
  });
}

function onPlayerReady(e) {
  e.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.

// I added a custom event so we can add an eventlistner across pages
function onPlayerStateChange(e) {
  //STATES https://developers.google.com/youtube/iframe_api_reference#Events
    // -1 unstarted
    // 0 ended
    // 1 playing
    // 2 paused
    // 3 buffering
    // 5 video cued
  document.dispatchEvent(new CustomEvent('ytplayerevent', { detail : e.data}));
}