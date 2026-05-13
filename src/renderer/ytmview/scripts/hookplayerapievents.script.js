(function() {
  const ytmStore = window.__YTMD_HOOK__.ytmStore;

  function sendStoreState() {
    // We don't want to see everything in the store as there can be some sensitive data so we only send what's necessary to operate
    let state = ytmStore.getState();

    const videoId = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.getPlayerResponse()?.videoDetails?.videoId;
    const likeButtonData = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").querySelector("ytmusic-like-button-renderer").data;
    const defaultLikeStatus = likeButtonData?.likeStatus ?? "UNKNOWN";
    const storeLikeStatus = state.likeStatus.videos[videoId];
    
    const likeStatus = storeLikeStatus ? state.likeStatus.videos[videoId] : defaultLikeStatus;
    const volume = state.player.volume;
    const adPlaying = state.player.adPlaying;
    const muted = state.player.muted;

    window.ytmd.sendStoreUpdate(state.queue, likeStatus, volume, muted, adPlaying);
  }

  document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.addEventListener("onVideoProgress", progress => {
    window.ytmd.sendVideoProgress(progress);
  });
  document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.addEventListener("onStateChange", state => {
    window.ytmd.sendVideoState(state);
  });
  document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.addEventListener("onVideoDataChange", event => {
    if (event.playertype === 1 && (event.type === "dataloaded" || event.type === "dataupdated")) {
      let videoDetails = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.getPlayerResponse().videoDetails;
      let playlistId = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").playerApi.getPlaylistId();
      let album = null;
      let hasFullMetadata = false;

      // If playing from online sources this usually is filled out with the first dataupdated which is followed after dataloaded. While offline this is always filled
      let currentItem = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").currentItem;
      if (currentItem !== null && currentItem !== undefined) {
        hasFullMetadata = true;

        // Fill out video details with better information
        videoDetails.title = currentItem.title.runs.map(v => v.text).join(""); // Can contain featuring text which isn't in player response
        videoDetails.thumbnail = currentItem.thumbnail; // Can contain more thumbnails than player response

        for (let i = 0; i < currentItem.longBylineText.runs.length; i++) {
          const item = currentItem.longBylineText.runs[i];
          if (item.navigationEndpoint) {
            if (item.navigationEndpoint.browseEndpoint.browseEndpointContextSupportedConfigs.browseEndpointContextMusicConfig.pageType === "MUSIC_PAGE_TYPE_ALBUM") {
              album = {
                id: item.navigationEndpoint.browseEndpoint.browseId,
                text: item.text
              }
            }
          }
        }
      }

      let state = ytmStore.getState();
      const likeButtonData = document.querySelector("ytmusic-app-layout>ytmusic-player-bar").querySelector("ytmusic-like-button-renderer").data;
      const defaultLikeStatus = likeButtonData?.likeStatus ?? "UNKNOWN";
      const storeLikeStatus = state.likeStatus.videos[videoDetails.videoId];
      
      const likeStatus = storeLikeStatus ? state.likeStatus.videos[videoDetails.videoId] : defaultLikeStatus;

      window.ytmd.sendVideoData(videoDetails, playlistId, album, likeStatus, hasFullMetadata);
    }
  });
  ytmStore.subscribe(() => {
    sendStoreState();
  });
  window.addEventListener("yt-action", e => {
    if (e.detail.actionName === "yt-service-request") {
      if (e.detail.args[1].createPlaylistServiceEndpoint) {
        let title = e.detail.args[2].create_playlist_title;
        let returnValue = e.detail.returnValue;
        returnValue[0].ajaxPromise.then(response => {
          let id = response.data.playlistId;
          window.ytmd.sendCreatePlaylistObservation({
            title,
            id
          });
        });
      }
    } else if (e.detail.actionName === "yt-handle-playlist-deletion-command") {
      let playlistId = e.detail.args[0].handlePlaylistDeletionCommand.playlistId;
      window.ytmd.sendDeletePlaylistObservation(playlistId);
    }
  });

  // Audio Processing (Visualizer, EQ, Normalization)
  (function initAudio() {
    const video = document.querySelector('video');
    if (!video) {
      setTimeout(initAudio, 1000);
      return;
    }

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(video);
    
    // Equalizer
    const filters = [];
    const frequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    let lastNode = source;

    frequencies.forEach(freq => {
      const filter = audioCtx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = freq;
      filter.Q.value = 1;
      filter.gain.value = 0;
      lastNode.connect(filter);
      filters.push(filter);
      lastNode = filter;
    });

    // Normalizer (Compressor)
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    const normalizationGain = audioCtx.createGain();
    normalizationGain.gain.value = 1;

    lastNode.connect(compressor);
    compressor.connect(normalizationGain);
    lastNode = normalizationGain;

    // Analyser
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    lastNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    window.__YTMD_AUDIO__ = {
      updateSettings: (settings) => {
        if (settings.eq) {
          settings.eq.forEach((gain, index) => {
            if (filters[index]) filters[index].gain.value = gain;
          });
        }
        if (settings.normalization !== undefined) {
          normalizationGain.gain.value = settings.normalization ? 1.5 : 1; // Simple boost for now
        }
        if (settings.outputDeviceId && video.setSinkId) {
          video.setSinkId(settings.outputDeviceId);
        }
        
        // Crossfade
        if (this.crossfadeInterval) clearInterval(this.crossfadeInterval);
        if (settings.crossfade) {
          this.crossfadeInterval = setInterval(() => {
            if (video.paused) return;
            const duration = video.duration;
            const currentTime = video.currentTime;
            const timeLeft = duration - currentTime;
            const fadeTime = settings.crossfadeDuration || 5;

            if (timeLeft < fadeTime) {
              video.volume = Math.max(0, timeLeft / fadeTime);
            } else if (currentTime < fadeTime) {
              video.volume = Math.min(1, currentTime / fadeTime);
            } else {
              video.volume = 1;
            }
          }, 200);
        }
      },
      crossfadeInterval: null
    };

    function sendFrequencyData() {
      analyser.getByteFrequencyData(dataArray);
      window.ytmd.sendAudioData(Array.from(dataArray));
      
      drawVisualizer(dataArray);
      requestAnimationFrame(sendFrequencyData);
    }

    const visualizerCanvas = document.createElement('canvas');
    visualizerCanvas.id = 'ytmd-visualizer';
    visualizerCanvas.style.position = 'absolute';
    visualizerCanvas.style.bottom = '0';
    visualizerCanvas.style.left = '0';
    visualizerCanvas.style.width = '100%';
    visualizerCanvas.style.height = '100%';
    visualizerCanvas.style.pointerEvents = 'none';
    visualizerCanvas.style.zIndex = '0';
    visualizerCanvas.style.opacity = '0.4';

    const playerBar = document.querySelector('ytmusic-player-bar');
    if (playerBar) {
      playerBar.style.position = 'relative';
      playerBar.insertBefore(visualizerCanvas, playerBar.firstChild);
    }

    function drawVisualizer(data) {
      const ctx = visualizerCanvas.getContext('2d');
      const width = visualizerCanvas.width = visualizerCanvas.offsetWidth;
      const height = visualizerCanvas.height = visualizerCanvas.offsetHeight;
      
      ctx.clearRect(0, 0, width, height);
      
      const barWidth = (width / data.length) * 2.5;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * height;
        
        // Use system accent color if available
        const accentColor = getComputedStyle(document.body).getPropertyValue('--system-accent-color') || '#ff0000';
        ctx.fillStyle = accentColor;
        
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    }

    sendFrequencyData();

    // Lyrics Observer
    const lyricsObserver = new MutationObserver(() => {
      const lyricsContainer = document.querySelector('ytmusic-player-page #lyrics');
      if (lyricsContainer) {
        // Here we would handle translation and karaoke
        // For now, we just log to verify it's working
      }
    });

    const checkLyrics = () => {
      const container = document.querySelector('ytmusic-player-page');
      if (container) {
        lyricsObserver.observe(container, { childList: true, subtree: true });
      } else {
        setTimeout(checkLyrics, 2000);
      }
    };
    checkLyrics();

    // Auto-skip Ads
    setInterval(() => {
      const skipButton = document.querySelector('.ytp-ad-skip-button') || document.querySelector('.ytp-skip-ad-button') || document.querySelector('.ytp-ad-skip-button-modern');
      if (skipButton) {
        skipButton.click();
      }
      // If ad is playing but no skip button, fast forward it
      const video = document.querySelector('video');
      const adShowing = document.querySelector('.ad-showing') || document.querySelector('.ad-interrupting');
      if (adShowing && video && video.currentTime > 0 && !video.paused) {
        video.playbackRate = 16; // Fast forward ads
        video.muted = true;
      } else if (video && video.playbackRate === 16) {
        video.playbackRate = 1;
        video.muted = false;
      }
    }, 500);
  })();
})();
