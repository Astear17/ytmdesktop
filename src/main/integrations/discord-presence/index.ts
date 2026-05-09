import playerStateStore, { PlayerState, Thumbnail, VideoDetails, VideoState } from "../../player-state-store";
import IIntegration from "../integration";
import MemoryStore from "../../memory-store";
import { MemoryStoreSchema } from "~shared/store/schema";
import DiscordClient from "./minimal-discord-client";
import log from "electron-log";
import { DiscordActivityType } from "./minimal-discord-client/types";

const DISCORD_CLIENT_ID = "1143202598460076053";

function getHighestResThumbnail(thumbnails: Thumbnail[]): string {
  return thumbnails.reduce(
    (accumulator, current) => (current.height * current.width <= accumulator.height * accumulator.width ? accumulator : current),
    thumbnails[0]
  ).url;
}

function getSmallImageKey(state: VideoState) {
  // Developer Note:
  // You can add "-invert" to the end of the image key to invert (Black with White Border)
  switch (state) {
    case VideoState.Playing: {
      return "play-border";
    }
    default: {
      return "pause-border";
    }
  }
}

function getSmallImageText(state: VideoState) {
  switch (state) {
    case VideoState.Playing: {
      return "Playing";
    }
    default: {
      return "Paused";
    }
  }
}

function stringLimit(str: string, limit: number, minimum: number) {
  if (str.length > limit) {
    return str.substring(0, limit - 3).trim() + "...";
  }
  if (str.length < minimum) {
    return str.padEnd(minimum, "​"); // There's a zero width space here
  }
  return str;
}

export default class DiscordPresence implements IIntegration {
  private memoryStore: MemoryStore<MemoryStoreSchema>;

  private discordClient: DiscordClient = null;
  private enabled = false;
  private ready = false;
  private activityDebounceTimeout: NodeJS.Timeout | null = null;
  private pauseTimeout: string | number | NodeJS.Timeout = null;
  private connectionRetryTimeout: string | number | NodeJS.Timeout = null;
  private stateCallback: (event: PlayerState) => void = null;

  private videoState: VideoState | null = null;
  private videoDetails: Partial<VideoDetails> | null = null;
  private progress: number | null = null;

  private connectionRetries: number = 0;

  private hasFullMetadata = false;

  private UpdateActivity() {
    if (this.activityDebounceTimeout) return;
    this.activityDebounceTimeout = setTimeout(() => {
      if (!this.videoDetails) {
        this.discordClient.clearActivity();
        return;
      }

      // Safe extraction with fallbacks for partial metadata
      const title = (this.videoDetails.title || "Unknown Track") as string;
      const author = (this.videoDetails.author || "Unknown Artist") as string;
      const album = this.videoDetails.album as string | undefined;
      const id = this.videoDetails.id as string | undefined;
      const thumbnails = (this.videoDetails.thumbnails || []) as Thumbnail[];
      const durationSeconds = Number(this.videoDetails.durationSeconds) || undefined;
      const channelId = this.videoDetails.channelId as string | undefined;
      const albumId = this.videoDetails.albumId as string | undefined;

      const thumbnail = thumbnails.length > 0 ? getHighestResThumbnail(thumbnails) : undefined;

      const timestamps: { start?: number; end?: number } = {};
      if (this.videoState === VideoState.Playing && typeof durationSeconds === "number" && typeof this.progress === "number") {
        timestamps.start = Date.now() - this.progress * 1000;
        timestamps.end = Date.now() + (durationSeconds - this.progress) * 1000;
      }

      const activity: any = {
        type: DiscordActivityType.Listening,
        status_display_type: 1,
        details: stringLimit(title, 128, 2),
        state: stringLimit(author, 128, 2),
        assets: {
          large_image: thumbnail && thumbnail.length <= 256 ? thumbnail : "ytmd-logo",
          large_text: album ? stringLimit(album, 128, 2) : undefined,
          small_image: getSmallImageKey(this.videoState),
          small_text: getSmallImageText(this.videoState)
        },
        instance: false
      };

      // Only include URLs and timestamps when we have full metadata
      if (this.hasFullMetadata && id) {
        activity.details_url = `https://music.youtube.com/watch?v=${id}`;
      }
      if (this.hasFullMetadata && channelId) {
        activity.state_url = `https://music.youtube.com/channel/${channelId}`;
      }
      if (this.hasFullMetadata && albumId) {
        activity.assets.large_url = `https://music.youtube.com/browse/${albumId}`;
      }
      if (Object.keys(timestamps).length > 0) {
        activity.timestamps = timestamps;
      }

      if (id) {
        activity.buttons = [
          {
            label: "Play on YTMDesktop",
            url: `ytmd://play/${id}`
          }
        ];
      }

      log.debug("discord-presence: send activity (fallback=" + !this.hasFullMetadata + ")", activity);
      this.discordClient.setActivity(activity);

      this.activityDebounceTimeout = null;
    }, 1000);
  }

  private playerStateChanged(state: PlayerState) {
    if (!this.ready) return;

    const { videoDetails, videoProgress, trackState, hasFullMetadata } = state;
    // store hasFullMetadata so UpdateActivity can choose what to include
    this.hasFullMetadata = !!hasFullMetadata;

    log.debug('discord-presence: playerStateChanged', {
      hasFullMetadata: this.hasFullMetadata,
      trackState,
      videoId: videoDetails?.id,
      progress: Math.floor(videoProgress)
    });

    if (!videoDetails) {
      this.discordClient.clearActivity();
      return;
    }
    const oldState = this.videoState ?? null;
    const oldId = this.videoDetails?.id ?? null;
    const oldProgress = this.progress ?? null;
    this.videoState = trackState;
    this.videoDetails = videoDetails;
    this.progress = Math.floor(videoProgress);

    const changedEnoughForFull =
      hasFullMetadata &&
      (oldState !== this.videoState || oldId !== this.videoDetails.id || Math.abs(this.progress - oldProgress) > 1 || oldProgress > this.progress);

    // Fallback: if we don't have full metadata, still send activity when the track changes (id differs)
    const changedForFallback = !hasFullMetadata && oldId !== this.videoDetails.id;

    if (changedEnoughForFull || changedForFallback) {
      log.debug('discord-presence: UpdateActivity triggered', {
        oldState,
        oldId,
        oldProgress,
        newState: this.videoState,
        newId: this.videoDetails.id,
        progress: this.progress,
        hasFullMetadata: this.hasFullMetadata
      });
      this.UpdateActivity();
    } else {
      log.debug('discord-presence: UpdateActivity skipped', {
        hasFullMetadata: this.hasFullMetadata,
        oldState,
        oldId,
        oldProgress,
        newState: this.videoState,
        newId: this.videoDetails?.id,
        progress: this.progress
      });
    }

    clearTimeout(this.pauseTimeout);
    this.pauseTimeout = null;
    if (state.trackState == VideoState.Playing) return;
    this.pauseTimeout = setTimeout(() => {
      if (!this.discordClient && !this.ready) return;
      this.discordClient.clearActivity();
      this.pauseTimeout = null;
    }, 30 * 1000);
  }

  public provide(memoryStore: MemoryStore<MemoryStoreSchema>): void {
    this.memoryStore = memoryStore;
  }

  private retryDiscordConnection() {
    if (!this.enabled) return;
    if (this.connectionRetries >= 30) {
      this.memoryStore.set("discordPresenceConnectionFailed", true);
      return;
    }

    this.connectionRetries++;
    log.info(`Connecting to Discord attempt ${this.connectionRetries}/30`);

    clearTimeout(this.connectionRetryTimeout);
    this.connectionRetryTimeout = setTimeout(() => {
      if (!this.discordClient) return;
      this.discordClient.connect().catch(() => this.retryDiscordConnection());
    }, 5 * 1000);
  }

  public enable(): void {
    this.enabled = true;
    if (this.discordClient) return;
    this.discordClient = new DiscordClient(DISCORD_CLIENT_ID);

    this.discordClient.on("connect", () => {
      this.ready = true;
      this.connectionRetries = 0;
      this.memoryStore.set("discordPresenceConnectionFailed", false);
    });
    this.discordClient.on("close", () => {
      log.info("Discord connection closed");
      this.ready = false;
      this.retryDiscordConnection();
    });
    this.discordClient.connect().catch(() => this.retryDiscordConnection());
    this.stateCallback = event => {
      this.playerStateChanged(event);
    };

    playerStateStore.addEventListener(this.stateCallback);
  }

  public disable(): void {
    this.enabled = false;
    this.connectionRetries = 0;
    this.memoryStore.set("discordPresenceConnectionFailed", false);

    clearTimeout(this.activityDebounceTimeout);
    clearTimeout(this.pauseTimeout);
    clearTimeout(this.connectionRetryTimeout);
    this.activityDebounceTimeout = this.pauseTimeout = this.connectionRetryTimeout = null;

    if (this.stateCallback) {
      playerStateStore.removeEventListener(this.stateCallback);
    }

    if (!this.discordClient) return;
    this.ready = false;
    this.discordClient.destroy();
    this.discordClient = null;
  }

  public getYTMScripts(): { name: string; script: string }[] {
    return [];
  }
}
