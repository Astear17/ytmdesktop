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

  // Audio Processing (EQ, Normalization)
  (function initAudio() {
    if (window.__YTMD_AUDIO__) return;

    const video = document.querySelector('video');
    if (!video) {
      setTimeout(initAudio, 1000);
      return;
    }

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    let source;
    try {
      source = audioCtx.createMediaElementSource(video);
    } catch (err) {
      console.warn("YTMD audio processing unavailable", err);
      return;
    }
    
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

    // Normalizer (Compressor). Keep a dry path so enabling normalization never forces volume to max.
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    
    const dryGain = audioCtx.createGain();
    dryGain.gain.value = 1;

    const normalizationGain = audioCtx.createGain();
    normalizationGain.gain.value = 0;

    const fadeGain = audioCtx.createGain();
    fadeGain.gain.value = 1;

    lastNode.connect(dryGain);
    lastNode.connect(compressor);
    compressor.connect(normalizationGain);
    dryGain.connect(fadeGain);
    normalizationGain.connect(fadeGain);
    lastNode = fadeGain;

    // Analyser
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    lastNode.connect(analyser);
    analyser.connect(audioCtx.destination);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const translationCache = new Map();
    let lyricsTranslationEnabled = false;
    let lyricsTranslationLanguage = "en";
    let lyricsTranslationTimeout = null;

    function getTranslationTargetLanguage(language) {
      if (!language || language === "auto") {
        return (navigator.language || "en").split("-")[0] || "en";
      }
      return language.split("-")[0] || "en";
    }

    function getLyricsTextElements() {
      const lyricsContainer = document.querySelector('ytmusic-player-page #lyrics') || document.querySelector('[page-type="MUSIC_PAGE_TYPE_TRACK_LYRICS"]');
      if (!lyricsContainer) return [];

      return Array.from(lyricsContainer.querySelectorAll("yt-formatted-string, span, p, div")).filter(element => {
        const text = element.innerText?.trim();
        if (!text || text.length < 2) return false;
        if (element.children.length > 0 && Array.from(element.children).some(child => child.innerText?.trim())) return false;
        return true;
      });
    }

    async function translateText(text, targetLanguage) {
      const cacheKey = `${targetLanguage}:${text}`;
      if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);

      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(targetLanguage)}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Translate request failed: ${response.status}`);
      const data = await response.json();
      const translated = Array.isArray(data?.[0]) ? data[0].map(part => part?.[0] || "").join("") : "";
      const result = translated.trim() || text;
      translationCache.set(cacheKey, result);
      return result;
    }

    function restoreLyrics() {
      for (const element of getLyricsTextElements()) {
        if (element.dataset.ytmdOriginalText) {
          element.innerText = element.dataset.ytmdOriginalText;
          delete element.dataset.ytmdOriginalText;
          delete element.dataset.ytmdTranslatedLanguage;
        }
      }
    }

    function scheduleLyricsTranslation() {
      if (lyricsTranslationTimeout) clearTimeout(lyricsTranslationTimeout);
      lyricsTranslationTimeout = setTimeout(() => {
        void translateLyrics();
      }, 400);
    }

    async function translateLyrics() {
      if (!lyricsTranslationEnabled) {
        restoreLyrics();
        return;
      }

      const targetLanguage = lyricsTranslationLanguage;
      if (!targetLanguage) return;

      for (const element of getLyricsTextElements()) {
        const originalText = element.dataset.ytmdOriginalText || element.innerText?.trim();
        if (!originalText || element.dataset.ytmdTranslatedLanguage === targetLanguage) continue;

        element.dataset.ytmdOriginalText = originalText;
        try {
          const translated = await translateText(originalText, targetLanguage);
          if (lyricsTranslationEnabled && translated) {
            element.innerText = translated;
            element.dataset.ytmdTranslatedLanguage = targetLanguage;
          }
        } catch (err) {
          console.warn("YTMD lyrics translation failed", err);
          break;
        }
      }
    }

    window.__YTMD_AUDIO__ = {
      updateSettings: (settings) => {
        if (settings.eq) {
          settings.eq.forEach((gain, index) => {
            if (filters[index]) filters[index].gain.value = settings.eqEnabled ? gain : 0;
          });
        }
        if (settings.normalization !== undefined) {
          dryGain.gain.value = settings.normalization ? 0 : 1;
          normalizationGain.gain.value = settings.normalization ? 1 : 0;
        }
        // Crossfade
        if (window.__YTMD_AUDIO__.crossfadeInterval) clearInterval(window.__YTMD_AUDIO__.crossfadeInterval);
        fadeGain.gain.value = 1;
        if (settings.crossfade) {
          window.__YTMD_AUDIO__.crossfadeInterval = setInterval(() => {
            if (video.paused) return;
            const duration = video.duration;
            const currentTime = video.currentTime;
            if (!Number.isFinite(duration) || !Number.isFinite(currentTime)) return;
            const timeLeft = duration - currentTime;
            const fadeTime = settings.crossfadeDuration || 5;

            if (timeLeft < fadeTime) {
              fadeGain.gain.value = Math.max(0, timeLeft / fadeTime);
            } else if (currentTime < fadeTime) {
              fadeGain.gain.value = Math.min(1, currentTime / fadeTime);
            } else {
              fadeGain.gain.value = 1;
            }
          }, 200);
        } else {
          window.__YTMD_AUDIO__.crossfadeInterval = null;
        }

        if (settings.lyricsTranslation !== undefined) {
          lyricsTranslationEnabled = !!settings.lyricsTranslation;
          lyricsTranslationLanguage = getTranslationTargetLanguage(settings.language);
          scheduleLyricsTranslation();
        }
      },
      crossfadeInterval: null
    };

    let lastAudioDataSent = 0;
    function sendFrequencyData() {
      analyser.getByteFrequencyData(dataArray);
      const now = performance.now();
      if (now - lastAudioDataSent > 250) {
        lastAudioDataSent = now;
        window.ytmd.sendAudioData(Array.from(dataArray));
      }
      requestAnimationFrame(sendFrequencyData);
    }

    sendFrequencyData();

    // Lyrics Observer
    const lyricsObserver = new MutationObserver(() => {
      scheduleLyricsTranslation();
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
      }
    }, 500);
  })();
})();
