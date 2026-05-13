<script setup lang="ts">
import { ref, watch, onBeforeMount, computed } from "vue";
import { useI18n } from "vue-i18n";
import KeybindInput from "../../components/KeybindInput.vue";
import YTMDSetting from "../../components/YTMDSetting.vue";
import { TrayIconStyle, type AdblockerEngine } from "~shared/store/schema";
import { AuthToken } from "~shared/integrations/companion-server/types";
import logo from "~assets/icons/ytmd.png";

declare const YTMD_GIT_COMMIT_HASH: string;
declare const YTMD_GIT_BRANCH: string;

const { locale, t } = useI18n();

const isDarwin = window.ytmd.isDarwin;
const isLinux = window.ytmd.isLinux;
const isWindows = window.ytmd.isWindows;

const currentTab = ref(1);
const requiresRestart = ref(false);
const checkingForUpdate = ref(false);
const updateNotAvailable = ref(false);

const store = window.ytmd.store;
const memoryStore = window.ytmd.memoryStore;
const safeStorage = window.ytmd.safeStorage;

const language = ref("auto");
const disableHardwareAcceleration = ref(false);
const hideToTrayOnClose = ref(false);
const showNotificationOnSongChange = ref(false);
const startOnBoot = ref(false);
const startMinimized = ref(false);

const ytmdVersion = ref("");
const ytmdCommitHash = ref("");
const ytmdBranch = ref("");
const updateAvailable = ref(false);
const updateDownloaded = ref(false);
const safeStorageAvailable = ref(false);

const alwaysShowVolumeSlider = ref(false);
const customCSSEnabled = ref(false);
const customCSSPath = ref("");
const zoom = ref(100);
const trayIconStyle = ref(0);

const continueWhereYouLeftOff = ref(false);
const continueWhereYouLeftOffPaused = ref(false);
const enableSpeakerFill = ref(false);
const progressInTaskbar = ref(false);
const ratioVolume = ref(false);
const normalizationEnabled = ref(false);
const eqGains = ref([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
const audioOutputDeviceId = ref("default");
const audioDevices = ref<{ [key: string]: string }>({});

const languageSelectMap = computed(() => ({
  auto: t("lang_auto"),
  en: t("english"),
  vi: t("vietnamese")
}));

const trayIconStyleSelectMap = computed(() => ({
  [TrayIconStyle.Auto]: t("tray_auto"),
  [TrayIconStyle.White]: t("tray_white"),
  [TrayIconStyle.Black]: t("tray_black")
}));

const audioOutputDeviceMap = computed(() => ({
  default: t("default_audio_device"),
  ...audioDevices.value
}));

function normalizeAdblockerEngine(value: unknown): AdblockerEngine {
  if (value === "ghostery_ads" || value === "ghostery_full" || value === "ghostery_ads_privacy") {
    return value;
  }
  return "ghostery_ads_privacy";
}

const adblockerEngineSelectMap = computed(() => ({
  ghostery_ads: t("adblocker_engine_ghostery_ads"),
  ghostery_ads_privacy: t("adblocker_engine_ghostery_ads_privacy"),
  ghostery_full: t("adblocker_engine_ghostery_full")
}));
const crossfadeEnabled = ref(false);
const crossfadeDuration = ref(5);

const companionServerEnabled = ref(false);
const companionServerAuthTokens = ref<AuthToken[]>([]);
const companionServerCORSWildcardEnabled = ref(false);
const discordPresenceEnabled = ref(false);
const lastFMEnabled = ref(false);
const adblockerEnabled = ref(true);
const adblockerEngine = ref<AdblockerEngine>("ghostery_ads_privacy");
const youtubeNonStopEnabled = ref(true);
const sponsorBlockEnabled = ref(true);
const lyricsTranslationEnabled = ref(false);
const karaokeEnabled = ref(false);

const enableDevTools = ref(false);
const autoRebuildWindowsExe = ref(false);
const isPackagedApp = ref(true);

const discordPresenceConnectionFailed = ref(false);
const shortcutsPlayPauseRegisterFailed = ref(false);
const shortcutsNextRegisterFailed = ref(false);
const shortcutsPreviousRegisterFailed = ref(false);
const shortcutsThumbsUpRegisterFailed = ref(false);
const shortcutsThumbsDownRegisterFailed = ref(false);
const shortcutsVolumeUpRegisterFailed = ref(false);
const shortcutsVolumeDownRegisterFailed = ref(false);
const companionServerAuthWindowEnabled = ref(false);
const autoUpdaterDisabled = ref(false);

const shortcutPlayPause = ref("");
const shortcutNext = ref("");
const shortcutPrevious = ref("");
const shortcutThumbsUp = ref("");
const shortcutThumbsDown = ref("");
const shortcutVolumeUp = ref("");
const shortcutVolumeDown = ref("");

const lastFMSessionKey = ref("");
const scrobblePercent = ref(50);

const eqFrequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

const loading = ref(true);
const error = ref<string | null>(null);

onBeforeMount(async () => {
  try {
    const [
      version,
      appUpdateAvailable,
      appUpdateDownloaded,
      safeAvailable,
      generalStore,
      appearanceStore,
      playbackStore,
      integrationsStore,
      shortcutsStore,
      lastfmStore,
      developerStore,
      discordFailed,
      ppFailed,
      nextFailed,
      prevFailed,
      tuFailed,
      tdFailed,
      vuFailed,
      vdFailed,
      authWindowEnabled,
      updaterDisabled,
      devices
    ] = await Promise.all([
      window.ytmd.getAppVersion(),
      window.ytmd.isAppUpdateAvailable(),
      window.ytmd.isAppUpdateDownloaded(),
      memoryStore.get("safeStorageAvailable"),
      store.get("general"),
      store.get("appearance"),
      store.get("playback"),
      store.get("integrations"),
      store.get("shortcuts"),
      store.get("lastfm"),
      store.get("developer"),
      memoryStore.get("discordPresenceConnectionFailed"),
      memoryStore.get("shortcutsPlayPauseRegisterFailed"),
      memoryStore.get("shortcutsNextRegisterFailed"),
      memoryStore.get("shortcutsPreviousRegisterFailed"),
      memoryStore.get("shortcutsThumbsUpRegisterFailed"),
      memoryStore.get("shortcutsThumbsDownRegisterFailed"),
      memoryStore.get("shortcutsVolumeUpRegisterFailed"),
      memoryStore.get("shortcutsVolumeDownRegisterFailed"),
      memoryStore.get("companionServerAuthWindowEnabled"),
      memoryStore.get("autoUpdaterDisabled"),
      navigator.mediaDevices.enumerateDevices()
    ]);

    ytmdVersion.value = version;
    ytmdCommitHash.value = (YTMD_GIT_COMMIT_HASH || "").substring(0, 7);
    ytmdBranch.value = YTMD_GIT_BRANCH || "";
    updateAvailable.value = appUpdateAvailable;
    updateDownloaded.value = appUpdateDownloaded;
    safeStorageAvailable.value = !!safeAvailable;

    language.value = generalStore?.language || "auto";
    disableHardwareAcceleration.value = !!generalStore?.disableHardwareAcceleration;
    hideToTrayOnClose.value = !!generalStore?.hideToTrayOnClose;
    showNotificationOnSongChange.value = !!generalStore?.showNotificationOnSongChange;
    startOnBoot.value = !!generalStore?.startOnBoot;
    startMinimized.value = !!generalStore?.startMinimized;

    alwaysShowVolumeSlider.value = !!appearanceStore?.alwaysShowVolumeSlider;
    customCSSEnabled.value = !!appearanceStore?.customCSSEnabled;
    customCSSPath.value = appearanceStore?.customCSSPath || "";
    zoom.value = appearanceStore?.zoom || 100;
    trayIconStyle.value = appearanceStore?.trayIconStyle || 0;

    continueWhereYouLeftOff.value = !!playbackStore?.continueWhereYouLeftOff;
    continueWhereYouLeftOffPaused.value = !!playbackStore?.continueWhereYouLeftOffPaused;
    enableSpeakerFill.value = !!playbackStore?.enableSpeakerFill;
    progressInTaskbar.value = !!playbackStore?.progressInTaskbar;
    ratioVolume.value = !!playbackStore?.ratioVolume;
    normalizationEnabled.value = !!playbackStore?.normalizationEnabled;
    eqGains.value = playbackStore?.eqGains || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    audioOutputDeviceId.value = playbackStore?.audioOutputDeviceId || "default";
    crossfadeEnabled.value = !!playbackStore?.crossfadeEnabled;
    crossfadeDuration.value = playbackStore?.crossfadeDuration || 5;

    companionServerEnabled.value = !!integrationsStore?.companionServerEnabled;
    companionServerCORSWildcardEnabled.value = !!integrationsStore?.companionServerCORSWildcardEnabled;
    discordPresenceEnabled.value = !!integrationsStore?.discordPresenceEnabled;
    lastFMEnabled.value = !!integrationsStore?.lastFMEnabled;
    adblockerEnabled.value = integrationsStore?.adblockerEnabled !== false;
    adblockerEngine.value = normalizeAdblockerEngine(integrationsStore?.adblockerEngine);
    youtubeNonStopEnabled.value = integrationsStore?.youtubeNonStopEnabled !== false;
    sponsorBlockEnabled.value = integrationsStore?.sponsorBlockEnabled !== false;
    lyricsTranslationEnabled.value = !!integrationsStore?.lyricsTranslationEnabled;
    karaokeEnabled.value = !!integrationsStore?.karaokeEnabled;

    enableDevTools.value = !!developerStore?.enableDevTools;
    autoRebuildWindowsExe.value = !!developerStore?.autoRebuildWindowsExe;
    isPackagedApp.value = (await window.ytmd.isPackaged?.()) ?? true;

    if (safeStorageAvailable.value && integrationsStore?.companionServerAuthTokens) {
      try {
        const decrypted = await safeStorage.decryptString(integrationsStore.companionServerAuthTokens);
        companionServerAuthTokens.value = JSON.parse(decrypted) || [];
      } catch (e) {
        console.error("Failed to decrypt tokens:", e);
      }
    }

    discordPresenceConnectionFailed.value = !!discordFailed;
    shortcutsPlayPauseRegisterFailed.value = !!ppFailed;
    shortcutsNextRegisterFailed.value = !!nextFailed;
    shortcutsPreviousRegisterFailed.value = !!prevFailed;
    shortcutsThumbsUpRegisterFailed.value = !!tuFailed;
    shortcutsThumbsDownRegisterFailed.value = !!tdFailed;
    shortcutsVolumeUpRegisterFailed.value = !!vuFailed;
    shortcutsVolumeDownRegisterFailed.value = !!vdFailed;
    companionServerAuthWindowEnabled.value = !!authWindowEnabled;
    autoUpdaterDisabled.value = !!updaterDisabled;

    shortcutPlayPause.value = shortcutsStore?.playPause || "";
    shortcutNext.value = shortcutsStore?.next || "";
    shortcutPrevious.value = shortcutsStore?.previous || "";
    shortcutThumbsUp.value = shortcutsStore?.thumbsUp || "";
    shortcutThumbsDown.value = shortcutsStore?.thumbsDown || "";
    shortcutVolumeUp.value = shortcutsStore?.volumeUp || "";
    shortcutVolumeDown.value = shortcutsStore?.volumeDown || "";

    lastFMSessionKey.value = lastfmStore?.sessionKey || "";
    scrobblePercent.value = lastfmStore?.scrobblePercent || 50;

    audioDevices.value = {};
    devices
      .filter(d => d.kind === "audiooutput")
      .forEach(d => {
        audioDevices.value[d.deviceId] = d.label || d.deviceId;
      });

    if (language.value === "auto") {
      locale.value = navigator.language.startsWith("vi") ? "vi" : "en";
    } else {
      locale.value = language.value;
    }

    store.onDidAnyChange(async newState => {
      disableHardwareAcceleration.value = !!newState.general.disableHardwareAcceleration;
      hideToTrayOnClose.value = !!newState.general.hideToTrayOnClose;
      showNotificationOnSongChange.value = !!newState.general.showNotificationOnSongChange;
      startOnBoot.value = !!newState.general.startOnBoot;
      startMinimized.value = !!newState.general.startMinimized;
      language.value = newState.general.language || "auto";

      alwaysShowVolumeSlider.value = !!newState.appearance.alwaysShowVolumeSlider;
      customCSSEnabled.value = !!newState.appearance.customCSSEnabled;
      customCSSPath.value = newState.appearance.customCSSPath;
      zoom.value = newState.appearance.zoom;
      trayIconStyle.value = newState.appearance.trayIconStyle;

      continueWhereYouLeftOff.value = !!newState.playback.continueWhereYouLeftOff;
      continueWhereYouLeftOffPaused.value = !!newState.playback.continueWhereYouLeftOffPaused;
      enableSpeakerFill.value = !!newState.playback.enableSpeakerFill;
      progressInTaskbar.value = !!newState.playback.progressInTaskbar;
      ratioVolume.value = !!newState.playback.ratioVolume;
      normalizationEnabled.value = !!newState.playback.normalizationEnabled;
      eqGains.value = newState.playback.eqGains || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      audioOutputDeviceId.value = newState.playback.audioOutputDeviceId || "default";
      crossfadeEnabled.value = !!newState.playback.crossfadeEnabled;
      crossfadeDuration.value = newState.playback.crossfadeDuration || 5;

      companionServerEnabled.value = !!newState.integrations.companionServerEnabled;
      companionServerCORSWildcardEnabled.value = !!newState.integrations.companionServerCORSWildcardEnabled;
      discordPresenceEnabled.value = !!newState.integrations.discordPresenceEnabled;
      lastFMEnabled.value = !!newState.integrations.lastFMEnabled;
      adblockerEnabled.value = newState.integrations.adblockerEnabled !== false;
      adblockerEngine.value = normalizeAdblockerEngine(newState.integrations.adblockerEngine);
      youtubeNonStopEnabled.value = newState.integrations.youtubeNonStopEnabled !== false;
      sponsorBlockEnabled.value = newState.integrations.sponsorBlockEnabled !== false;
      lyricsTranslationEnabled.value = !!newState.integrations.lyricsTranslationEnabled;
      karaokeEnabled.value = !!newState.integrations.karaokeEnabled;

      if (safeStorageAvailable.value && newState.integrations.companionServerAuthTokens) {
        try {
          const decrypted = await safeStorage.decryptString(newState.integrations.companionServerAuthTokens);
          companionServerAuthTokens.value = JSON.parse(decrypted) || [];
        } catch (err) {
          console.error("Failed to decrypt tokens on store change:", err);
        }
      }

      shortcutPlayPause.value = newState.shortcuts.playPause;
      shortcutNext.value = newState.shortcuts.next;
      shortcutPrevious.value = newState.shortcuts.previous;
      shortcutThumbsUp.value = newState.shortcuts.thumbsUp;
      shortcutThumbsDown.value = newState.shortcuts.thumbsDown;
      shortcutVolumeUp.value = newState.shortcuts.volumeUp;
      shortcutVolumeDown.value = newState.shortcuts.volumeDown;

      lastFMSessionKey.value = newState.lastfm.sessionKey;
      scrobblePercent.value = newState.lastfm.scrobblePercent;

      enableDevTools.value = !!newState.developer.enableDevTools;
      autoRebuildWindowsExe.value = !!newState.developer.autoRebuildWindowsExe;
    });

    loading.value = false;
  } catch (e) {
    console.error("Critical error loading settings:", e);
    error.value = e instanceof Error ? e.message : String(e);
    loading.value = false;
  }
});

watch(language, newLang => {
  if (newLang === "auto") {
    locale.value = navigator.language.startsWith("vi") ? "vi" : "en";
  } else {
    locale.value = newLang;
  }
});

memoryStore.onStateChanged(newState => {
  discordPresenceConnectionFailed.value = newState.discordPresenceConnectionFailed;

  shortcutsPlayPauseRegisterFailed.value = newState.shortcutsPlayPauseRegisterFailed;
  shortcutsNextRegisterFailed.value = newState.shortcutsNextRegisterFailed;
  shortcutsPreviousRegisterFailed.value = newState.shortcutsPreviousRegisterFailed;
  shortcutsThumbsUpRegisterFailed.value = newState.shortcutsThumbsUpRegisterFailed;
  shortcutsThumbsDownRegisterFailed.value = newState.shortcutsThumbsDownRegisterFailed;
  shortcutsVolumeUpRegisterFailed.value = newState.shortcutsVolumeUpRegisterFailed;
  shortcutsVolumeDownRegisterFailed.value = newState.shortcutsVolumeDownRegisterFailed;

  companionServerAuthWindowEnabled.value = newState.companionServerAuthWindowEnabled;

  safeStorageAvailable.value = newState.safeStorageAvailable;

  autoUpdaterDisabled.value = newState.autoUpdaterDisabled;
});

async function memorySettingsChanged() {
  memoryStore.set("companionServerAuthWindowEnabled", companionServerAuthWindowEnabled.value);
}

async function settingsChanged() {
  store.set("general.hideToTrayOnClose", hideToTrayOnClose.value);
  store.set("general.showNotificationOnSongChange", showNotificationOnSongChange.value);
  store.set("general.startOnBoot", startOnBoot.value);
  store.set("general.startMinimized", startMinimized.value);
  store.set("general.language", language.value);
  store.set("general.disableHardwareAcceleration", disableHardwareAcceleration.value);

  store.set("appearance.alwaysShowVolumeSlider", alwaysShowVolumeSlider.value);
  store.set("appearance.customCSSEnabled", customCSSEnabled.value);
  store.set("appearance.zoom", zoom.value);
  store.set("appearance.trayIconStyle", trayIconStyle.value);

  store.set("playback.continueWhereYouLeftOff", continueWhereYouLeftOff.value);
  store.set("playback.continueWhereYouLeftOffPaused", continueWhereYouLeftOffPaused.value);
  store.set("playback.progressInTaskbar", progressInTaskbar.value);
  store.set("playback.enableSpeakerFill", enableSpeakerFill.value);
  store.set("playback.ratioVolume", ratioVolume.value);
  store.set("playback.normalizationEnabled", normalizationEnabled.value);
  store.set("playback.eqGains", JSON.parse(JSON.stringify(eqGains.value)));
  store.set("playback.audioOutputDeviceId", audioOutputDeviceId.value);
  store.set("playback.crossfadeEnabled", crossfadeEnabled.value);
  store.set("playback.crossfadeDuration", crossfadeDuration.value);

  store.set("integrations.companionServerEnabled", companionServerEnabled.value);
  store.set("integrations.companionServerCORSWildcardEnabled", companionServerCORSWildcardEnabled.value);
  store.set("integrations.discordPresenceEnabled", discordPresenceEnabled.value);
  store.set("integrations.lastFMEnabled", lastFMEnabled.value);
  store.set("integrations.adblockerEnabled", adblockerEnabled.value);
  store.set("integrations.adblockerEngine", adblockerEngine.value);
  store.set("integrations.youtubeNonStopEnabled", youtubeNonStopEnabled.value);
  store.set("integrations.sponsorBlockEnabled", sponsorBlockEnabled.value);
  store.set("integrations.lyricsTranslationEnabled", lyricsTranslationEnabled.value);
  store.set("integrations.karaokeEnabled", karaokeEnabled.value);
  store.set("lastfm.scrobblePercent", scrobblePercent.value);

  store.set("shortcuts.playPause", shortcutPlayPause.value);
  store.set("shortcuts.next", shortcutNext.value);
  store.set("shortcuts.previous", shortcutPrevious.value);
  store.set("shortcuts.thumbsUp", shortcutThumbsUp.value);
  store.set("shortcuts.thumbsDown", shortcutThumbsDown.value);
  store.set("shortcuts.volumeUp", shortcutVolumeUp.value);
  store.set("shortcuts.volumeDown", shortcutVolumeDown.value);

  store.set("developer.enableDevTools", enableDevTools.value);
  store.set("developer.autoRebuildWindowsExe", autoRebuildWindowsExe.value);
}

async function settingChangedRequiresRestart() {
  requiresRestart.value = true;
  settingsChanged();
}

async function settingChangedFile(event: Event) {
  const target = event.target as HTMLInputElement;

  const setting = target.dataset.setting;
  if (!setting) {
    throw new Error("No setting specified in File Input");
  }

  store.set(setting, target.files.length > 0 ? window.ytmd.getTrueFilePath(target.files[0]) : null);

  target.value = null;
}

async function restartDiscordPresence() {
  discordPresenceEnabled.value = false;
  await settingsChanged();
  discordPresenceEnabled.value = true;
  await settingsChanged();
}

async function deleteCompanionAuthToken(appId: string) {
  const index = companionServerAuthTokens.value.findIndex(token => token.appId === appId);
  if (index > -1) {
    companionServerAuthTokens.value.splice(index, 1);
  }

  if (safeStorageAvailable.value)
    store.set("integrations.companionServerAuthTokens", await safeStorage.encryptString(JSON.stringify(companionServerAuthTokens.value)));
}

function removeCustomCSSPath() {
  store.set("appearance.customCSSPath", null);
}

function changeTab(newTab: number) {
  currentTab.value = newTab;
}

function restartApplication() {
  window.ytmd.restartApplication();
}

function restartApplicationForUpdate() {
  window.ytmd.restartApplicationForUpdate();
}

function checkForUpdates() {
  window.ytmd.checkForUpdates();
  checkingForUpdate.value = true;
}

async function logoutLastFM() {
  store.set("lastfm.sessionKey", null);
  lastFMEnabled.value = false;
  lastFMSessionKey.value = null;
  await settingsChanged();
}

window.ytmd.handleCheckingForUpdate(() => {
  checkingForUpdate.value = true;
});

window.ytmd.handleUpdateAvailable(() => {
  checkingForUpdate.value = false;
  updateAvailable.value = true;
  updateNotAvailable.value = false;
});

window.ytmd.handleUpdateNotAvailable(() => {
  checkingForUpdate.value = false;
  updateNotAvailable.value = true;
  updateAvailable.value = false;
});

window.ytmd.handleUpdateDownloaded(() => {
  checkingForUpdate.value = false;
  updateNotAvailable.value = false;
  updateAvailable.value = false;
  updateDownloaded.value = true;
});

async function clearCache() {
  await window.ytmd.clearCache();
  alert(t("cache_cleared"));
}
</script>

<template>
  <div class="settings-container">
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>{{ $t("loading_settings") }}</p>
    </div>
    <div v-else-if="error" class="error-overlay">
      <span class="material-symbols-outlined">error</span>
      <p>{{ $t("error_prefix") }}: {{ error }}</p>
      <button @click="restartApplication">{{ $t("restart_application_btn") }}</button>
    </div>
    <div v-else class="content-container">
      <ul class="sidebar">
        <li :class="{ active: currentTab === 1 }" @click="changeTab(1)">
          <span class="material-symbols-outlined">settings_applications</span>{{ $t("general") }}
        </li>
        <li :class="{ active: currentTab === 2 }" @click="changeTab(2)"><span class="material-symbols-outlined">brush</span>{{ $t("appearance") }}</li>
        <li :class="{ active: currentTab === 3 }" @click="changeTab(3)"><span class="material-symbols-outlined">music_note</span>{{ $t("playback") }}</li>
        <li :class="{ active: currentTab === 4 }" @click="changeTab(4)">
          <span class="material-symbols-outlined">wifi_tethering</span>{{ $t("integrations") }}
        </li>
        <li :class="{ active: currentTab === 5 }" @click="changeTab(5)"><span class="material-symbols-outlined">keyboard</span>{{ $t("shortcuts") }}</li>
        <span class="push"></span>
        <li :class="{ active: currentTab === 6 }" @click="changeTab(6)"><span class="material-symbols-outlined">code</span>{{ $t("developer") }}</li>
        <li :class="{ active: currentTab === 99 }" @click="changeTab(99)"><span class="material-symbols-outlined">info</span>{{ $t("about") }}</li>
      </ul>
      <div class="content">
        <div v-if="requiresRestart" class="restart-banner">
          <p class="message"><span class="material-symbols-outlined">autorenew</span> {{ $t("restart_required") }}</p>
          <button class="restart-button" @click="restartApplication">{{ $t("restart") }}</button>
        </div>
        <div v-if="currentTab === 1" class="general-tab">
          <YTMDSetting v-model="language" :options-map="languageSelectMap" type="select" :name="$t('language')" @change="settingsChanged" />
          <YTMDSetting v-if="!isDarwin" v-model="hideToTrayOnClose" type="checkbox" :name="$t('hide_to_tray')" @change="settingsChanged" />
          <YTMDSetting v-model="showNotificationOnSongChange" type="checkbox" :name="$t('show_notifications')" @change="settingsChanged" />
          <YTMDSetting v-model="startOnBoot" type="checkbox" :name="$t('start_on_boot')" @change="settingsChanged" />
          <YTMDSetting
            v-model="disableHardwareAcceleration"
            type="checkbox"
            restart-required
            :name="$t('disable_hardware_acceleration')"
            @change="settingChangedRequiresRestart"
          />
          <div class="setting indented">
            <p class="name">{{ $t("application_cache") }}</p>
            <button @click="clearCache">{{ $t("clear_cache") }}</button>
          </div>
        </div>

        <div v-if="currentTab === 2" class="appearance-tab">
          <YTMDSetting v-model="alwaysShowVolumeSlider" type="checkbox" :name="$t('always_show_volume')" @change="settingsChanged" />
          <YTMDSetting v-model="customCSSEnabled" type="checkbox" :name="$t('custom_css')" @change="settingsChanged" />
          <YTMDSetting
            v-if="customCSSEnabled"
            v-model="customCSSPath"
            type="file"
            indented
            bind-setting="appearance.customCSSPath"
            :name="$t('custom_css_path')"
            @file-change="settingChangedFile"
            @clear="removeCustomCSSPath"
          />
          <YTMDSetting v-model="zoom" type="range" max="300" min="30" step="10" :name="$t('zoom')" @change="settingsChanged" />
          <YTMDSetting
            v-if="isLinux"
            v-model="trayIconStyle"
            :options-map="trayIconStyleSelectMap"
            type="select"
            :name="$t('tray_icon_style')"
            @change="settingsChanged"
          />
        </div>

        <div v-if="currentTab === 3" class="playback-tab">
          <YTMDSetting v-model="continueWhereYouLeftOff" :name="$t('continue_where_left_off')" type="checkbox" @change="settingsChanged" />
          <YTMDSetting
            v-if="continueWhereYouLeftOff"
            v-model="continueWhereYouLeftOffPaused"
            type="checkbox"
            indented
            :name="$t('pause_on_launch')"
            @change="settingsChanged"
          />
          <YTMDSetting v-model="progressInTaskbar" type="checkbox" :name="$t('show_track_progress')" @change="settingsChanged" />
          <YTMDSetting v-model="enableSpeakerFill" type="checkbox" restart-required :name="$t('enable_speaker_fill')" @change="settingChangedRequiresRestart" />
          <YTMDSetting v-model="ratioVolume" type="checkbox" :name="$t('ratio_volume')" @change="settingsChanged" />
          <YTMDSetting
            v-model="audioOutputDeviceId"
            :options-map="audioOutputDeviceMap"
            type="select"
            :name="$t('audio_output_device')"
            @change="settingsChanged"
          />
          <YTMDSetting v-model="crossfadeEnabled" type="checkbox" :name="$t('crossfade_title')" :description="$t('crossfade_desc')" @change="settingsChanged" />
          <YTMDSetting
            v-if="crossfadeEnabled"
            v-model="crossfadeDuration"
            type="range"
            max="15"
            min="1"
            step="1"
            indented
            :name="$t('transition_duration')"
            @change="settingsChanged"
          />
          <YTMDSetting
            v-model="normalizationEnabled"
            type="checkbox"
            :name="$t('audio_normalization')"
            :description="$t('audio_normalization_desc')"
            @change="settingsChanged"
          />

          <div class="setting flex-column">
            <p class="name">{{ $t("builtin_eq") }}</p>
            <div class="eq-container">
              <div v-for="(freq, index) in eqFrequencies" :key="freq" class="eq-band">
                <input v-model.number="eqGains[index]" type="range" orient="vertical" min="-12" max="12" step="1" @input="settingsChanged" />
                <span class="eq-label">{{ freq >= 1000 ? freq / 1000 + "k" : freq }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="currentTab === 4" class="integrations-tab">
          <YTMDSetting v-model="adblockerEnabled" type="checkbox" :name="$t('adblocker')" @change="settingsChanged" />
          <YTMDSetting
            v-model="adblockerEngine"
            type="select"
            indented
            :options-map="adblockerEngineSelectMap"
            :name="$t('adblocker_engine')"
            :description="$t('adblocker_engine_desc')"
            @change="settingsChanged"
          />
          <YTMDSetting
            v-model="youtubeNonStopEnabled"
            type="checkbox"
            :name="$t('youtube_nonstop')"
            :description="$t('youtube_nonstop_desc')"
            @change="settingsChanged"
          />
          <YTMDSetting
            v-model="sponsorBlockEnabled"
            type="checkbox"
            :name="$t('sponsorblock')"
            :description="$t('sponsorblock_desc')"
            @change="settingsChanged"
          />
          <YTMDSetting
            v-model="lyricsTranslationEnabled"
            type="checkbox"
            :name="$t('lyrics_translation')"
            :description="$t('lyrics_translation_desc')"
            @change="settingsChanged"
          />
          <YTMDSetting v-model="karaokeEnabled" type="checkbox" :name="$t('karaoke')" :description="$t('karaoke_desc')" @change="settingsChanged" />
          <YTMDSetting
            v-model="companionServerEnabled"
            type="checkbox"
            :name="$t('companion_server')"
            :disabled="!safeStorageAvailable"
            :disabled-message="$t('companion_disabled_safe')"
            @change="settingsChanged"
          />
          <YTMDSetting
            v-if="companionServerEnabled && safeStorageAvailable"
            v-model="companionServerCORSWildcardEnabled"
            type="checkbox"
            indented
            :name="$t('allow_browser_comm')"
            :description="$t('allow_browser_comm_desc')"
            @change="settingsChanged"
          />
          <YTMDSetting
            v-if="companionServerEnabled && safeStorageAvailable"
            v-model="companionServerAuthWindowEnabled"
            type="checkbox"
            indented
            :name="$t('companion_auth')"
            :description="$t('companion_auth_desc')"
            @change="memorySettingsChanged"
          />
          <YTMDSetting
            v-if="companionServerEnabled && safeStorageAvailable"
            type="custom"
            flex-column
            indented
            :name="$t('authorized_companions')"
            :description="$t('authorized_companions_desc')"
            @change="settingsChanged"
          >
            <table class="authorized-companions-table">
              <thead>
                <tr>
                  <th class="companion">{{ $t("col_companion") }}</th>
                  <th class="version">{{ $t("col_version") }}</th>
                  <th class="controls">{{ $t("col_controls") }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="authToken in companionServerAuthTokens" :key="authToken.appId">
                  <td class="companion">
                    <span class="name">{{ authToken.appName }}</span
                    ><br />
                    <span class="id">{{ authToken.appId }}</span>
                  </td>
                  <td class="version">{{ authToken.appVersion }}</td>
                  <td class="controls">
                    <button @click="deleteCompanionAuthToken(authToken.appId)"><span class="material-symbols-outlined">delete</span></button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="companionServerAuthTokens.length === 0" class="no-authorized-companions">
              {{ $t("no_authorized_companions") }}
            </div>
          </YTMDSetting>
          <YTMDSetting v-model="discordPresenceEnabled" type="checkbox" :name="$t('discord_presence')" @change="settingsChanged" />
          <div v-if="discordPresenceEnabled && discordPresenceConnectionFailed" class="setting indented">
            <p class="discord-failure">{{ $t("discord_connection_failed") }}</p>
            <button @click="restartDiscordPresence">{{ $t("retry") }}</button>
          </div>
          <YTMDSetting
            v-model="lastFMEnabled"
            type="checkbox"
            :name="$t('lastfm_scrobbling')"
            :disabled="!safeStorageAvailable"
            :disabled-message="$t('companion_disabled_safe')"
            @change="settingsChanged"
          />
          <div v-if="lastFMEnabled" class="setting indented">
            <div class="name-with-description">
              <p class="description">
                {{ $t("lastfm_user_authenticated") }}
                <span v-if="lastFMSessionKey" style="color: #4caf50">{{ $t("yes") }}</span>
                <span v-else style="color: #ff1100">{{ $t("no") }}</span>
              </p>
            </div>
            <button v-if="lastFMSessionKey" @click="logoutLastFM">{{ $t("logout") }}</button>
          </div>
          <YTMDSetting
            v-if="lastFMEnabled"
            v-model="scrobblePercent"
            class="settings indented"
            type="range"
            :name="$t('scrobble_percent')"
            :description="$t('scrobble_percent_desc')"
            min="50"
            max="95"
            step="5"
            @change="settingsChanged"
          />
        </div>

        <div v-if="currentTab === 5" class="shortcuts-tab">
          <div class="setting">
            <p class="shortcut-title">
              {{ $t("shortcut_play_pause")
              }}<span v-if="shortcutsPlayPauseRegisterFailed" class="material-symbols-outlined register-error" :title="$t('keybind_register_failed')"
                >error</span
              >
            </p>
            <KeybindInput v-model="shortcutPlayPause" @change="settingsChanged" />
          </div>
          <div class="setting">
            <p class="shortcut-title">
              {{ $t("shortcut_next")
              }}<span v-if="shortcutsNextRegisterFailed" class="material-symbols-outlined register-error" :title="$t('keybind_register_failed')">error</span>
            </p>
            <KeybindInput v-model="shortcutNext" @change="settingsChanged" />
          </div>
          <div class="setting">
            <p class="shortcut-title">
              {{ $t("shortcut_previous")
              }}<span v-if="shortcutsPreviousRegisterFailed" class="material-symbols-outlined register-error" :title="$t('keybind_register_failed')"
                >error</span
              >
            </p>
            <KeybindInput v-model="shortcutPrevious" @change="settingsChanged" />
          </div>
          <div class="setting">
            <p class="shortcut-title">
              {{ $t("shortcut_thumbs_up")
              }}<span v-if="shortcutsThumbsUpRegisterFailed" class="material-symbols-outlined register-error" :title="$t('keybind_register_failed')"
                >error</span
              >
            </p>
            <KeybindInput v-model="shortcutThumbsUp" @change="settingsChanged" />
          </div>
          <div class="setting">
            <p class="shortcut-title">
              {{ $t("shortcut_thumbs_down")
              }}<span v-if="shortcutsThumbsDownRegisterFailed" class="material-symbols-outlined register-error" :title="$t('keybind_register_failed')"
                >error</span
              >
            </p>
            <KeybindInput v-model="shortcutThumbsDown" @change="settingsChanged" />
          </div>
          <div class="setting">
            <p class="shortcut-title">
              {{ $t("shortcut_vol_up")
              }}<span v-if="shortcutsVolumeUpRegisterFailed" class="material-symbols-outlined register-error" :title="$t('keybind_register_failed')"
                >error</span
              >
            </p>
            <KeybindInput v-model="shortcutVolumeUp" @change="settingsChanged" />
          </div>
          <div class="setting">
            <p class="shortcut-title">
              {{ $t("shortcut_vol_down")
              }}<span v-if="shortcutsVolumeDownRegisterFailed" class="material-symbols-outlined register-error" :title="$t('keybind_register_failed')"
                >error</span
              >
            </p>
            <KeybindInput v-model="shortcutVolumeDown" @change="settingsChanged" />
          </div>
        </div>

        <div v-if="currentTab === 6" class="developer-tab">
          <p v-if="isPackagedApp" class="developer-packaged-hint">{{ $t("developer_packaged_hint") }}</p>
          <YTMDSetting v-model="enableDevTools" type="checkbox" restart-required :name="$t('developer_tools')" @change="settingChangedRequiresRestart" />
          <YTMDSetting
            v-model="autoRebuildWindowsExe"
            type="checkbox"
            :disabled="isPackagedApp || !isWindows"
            :name="$t('auto_rebuild_windows_exe')"
            :description="$t('auto_rebuild_windows_exe_desc')"
            @change="settingsChanged"
          />
        </div>

        <div v-if="currentTab === 99" class="about-tab">
          <img class="icon" :src="logo" />
          <h2 class="app-name">{{ $t("about_app_title") }}</h2>
          <p class="made-by">{{ $t("made_by") }}</p>
          <p class="forked-by">{{ $t("forked_by") }}</p>
          <template v-if="!autoUpdaterDisabled">
            <button
              v-if="!updateDownloaded"
              :disabled="!(!checkingForUpdate && !updateAvailable && !updateDownloaded)"
              class="update-check-button"
              @click="checkForUpdates"
            >
              <span class="material-symbols-outlined">update</span>{{ $t("check_updates") }}
            </button>
            <button v-if="updateDownloaded" class="update-button" @click="restartApplicationForUpdate">
              <span class="material-symbols-outlined">upgrade</span>{{ $t("restart_to_update") }}
            </button>
            <p v-if="checkingForUpdate && !updateAvailable && !updateDownloaded" class="updating">
              <span class="material-symbols-outlined">progress_activity</span>{{ $t("checking_updates") }}
            </p>
            <p v-if="updateAvailable && !updateDownloaded" class="updating">
              <span class="material-symbols-outlined">progress_activity</span>{{ $t("downloading_update") }}
            </p>
            <p v-if="updateNotAvailable" class="no-update">{{ $t("update_not_available") }}</p>
          </template>
          <template v-if="autoUpdaterDisabled">
            <button disabled class="update-check-button"><span class="material-symbols-outlined">update</span>{{ $t("check_updates") }}</button>
            <p class="no-auto-updater">{{ $t("auto_updater_disabled") }}</p>
          </template>
          <span class="version-info">
            <p class="version">{{ $t("version_label") }}: {{ ytmdVersion }}</p>
            <p class="branch">{{ $t("branch_label") }}: {{ ytmdBranch }}</p>
            <p class="commit">{{ $t("commit_label") }}: {{ ytmdCommitHash }}</p>
          </span>
          <div class="links">
            <a href="https://github.com/ytmdesktop/ytmdesktop" target="_blank">{{ $t("about_github") }}</a>
            <a href="https://ytmdesktop.github.io/" target="_blank">{{ $t("about_website") }}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  user-select: none;
  height: 100%;
  width: 100%;
  min-height: 0;
  background-color: #000000;
  display: flex;
  flex-direction: column;
}

.content-container {
  display: flex;
  flex: 1;
  min-height: 0;
}

.content {
  overflow: auto;
  flex: 1;
  min-height: 0;
  padding: 4px 16px;
}

.content::-webkit-scrollbar {
  width: 12px;
}

.content::-webkit-scrollbar-track {
  background: #212121;
}

.content::-webkit-scrollbar-thumb {
  background-color: #414141;
}

.sidebar {
  width: 25%;
  min-width: 25%;
  list-style-type: none;
  margin: unset;
  padding: unset;
  min-height: 0;
  overflow-y: auto;
  border-right: 1px solid #212121;
  display: flex;
  flex-direction: column;
}

.sidebar li {
  display: flex;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  color: #bbbbbb;
}

.sidebar li .material-symbols-outlined {
  font-size: 28px;
  font-variation-settings:
    "FILL" 0,
    "wght" 100,
    "GRAD" 0,
    "opsz" 28;
}

.sidebar li:hover {
  background-color: #111111;
}

.sidebar li.active {
  background-color: #212121;
  color: #eeeeee;
}

.sidebar li .material-symbols-outlined {
  margin-right: 8px;
}

.sidebar .push {
  flex-grow: 1;
}

.setting {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.eq-container {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 10px 0;
}

.eq-band {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.eq-band input[type="range"] {
  writing-mode: bt-lr; /* IE */
  appearance: slider-vertical;
  width: 8px;
  height: 100px;
  margin-bottom: 8px;
}

.eq-label {
  font-size: 10px;
  color: #888;
}

.setting.indented {
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid #212121;
}

.name-with-description .name {
  margin-bottom: unset;
}

.name-with-description .description {
  margin-top: 4px;
  color: #969696;
}

.about-tab {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  height: 100%;
}

.icon {
  width: 128px;
  height: 128px;
  margin-bottom: 16px;
}

.app-name {
  margin: 0;
}

.version-info .version,
.version-info .branch,
.version-info .commit {
  margin: 4px 0;
  color: #bbbbbb;
}

.made-by {
  margin: 16px 0;
}

.links {
  margin-top: 32px;
  width: 100%;
  display: flex;
  justify-content: space-evenly;
}

.links a {
  color: #bbbbbb;
}

.restart-banner {
  background-color: #f44336;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.restart-banner .message {
  display: flex;
  align-items: center;
}

.restart-banner .message .material-symbols-outlined {
  margin: 0 8px;
}

.restart-banner .restart-button {
  margin: 0 8px;
  background-color: transparent;
  border: 1px solid #ffffff;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
}

.update-check-button {
  display: flex;
  align-items: center;
  background-color: transparent;
  border: 1px solid #ffffff;
  border-radius: 4px;
  padding: 4px 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.update-check-button:disabled {
  border: 1px solid #888888;
  cursor: not-allowed;
}

.updating,
.no-update {
  display: flex;
  align-items: center;
  color: #888888;
  margin: 0 0 8px 0;
}

.no-auto-updater {
  display: flex;
  align-items: center;
  color: #888888;
  margin: 0 0 8px 0;
}

.updating .material-symbols-outlined {
  animation: rotation 1s infinite linear;
}

@keyframes rotation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(359deg);
  }
}

.update-button {
  display: flex;
  align-items: center;
  background-color: #f44336;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  margin-bottom: 8px;
  cursor: pointer;
}

.update-check-button .material-symbols-outlined,
.updating .material-symbols-outlined,
.update-button .material-symbols-outlined {
  margin-right: 4px;
}

.version-info {
  user-select: text;
}

.setting.disabled {
  color: #c6c6c6;
}

.authorized-companions-table {
  width: 100%;
  table-layout: fixed;
}

.authorized-companions-table tr .companion {
  width: 70%;
  word-wrap: break-word;
}

.authorized-companions-table tr .companion .id {
  color: #969696;
  font-size: 14px;
}

.authorized-companions-table tbody tr .version {
  word-wrap: break-word;
}

.authorized-companions-table tr th,
.authorized-companions-table tr td {
  padding: 4px;
}

.authorized-companions-table th {
  text-align: left;
}

.authorized-companions-table thead tr th {
  border-bottom: 1px solid #212121;
}
.authorized-companions-table thead tr .controls {
  width: 48px;
}

.authorized-companions-table tbody button {
  border-radius: 4px;
  padding: 4px;
  display: flex;
  align-items: center;
  background-color: #212121;
  cursor: pointer;
  border: none;
}

.no-authorized-companions {
  color: #bbbbbb;
  padding: 4px;
}

.discord-failure {
  margin: 0;
  color: #969696;
}

button {
  margin: 3px 3px 3px 4px;
  border-radius: 4px;
  padding: 8px;
  display: flex;
  align-items: center;
  background-color: #212121;
  cursor: pointer;
  border: none;
}

.shortcuts-tab .shortcut-title {
  display: flex;
  justify-content: center;
  align-items: center;
}

.shortcuts-tab .shortcut-title .register-error {
  margin-left: 4px;
  color: #f44336;
}

.developer-packaged-hint {
  margin: 0 0 12px 0;
  padding: 12px;
  border-radius: 4px;
  background-color: #212121;
  color: #bbbbbb;
  line-height: 1.4;
}

.loading-overlay,
.error-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  width: 100%;
  gap: 16px;
  color: #ffffff;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: #ff0000;
  border-radius: 50%;
  animation: rotation 1s infinite linear;
}

.error-overlay .material-symbols-outlined {
  font-size: 48px;
  color: #f44336;
}
</style>
