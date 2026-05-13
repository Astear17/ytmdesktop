import { BrowserView } from "electron";
import fetch from "cross-fetch";
import Conf from "conf";
import log from "electron-log";

import { StoreSchema } from "../../../shared/store/schema";
import IIntegration from "../integration";
import playerStateStore, { PlayerState, VideoState } from "../../player-state-store";

interface Segment {
  segment: [number, number];
  UUID: string;
  category: string;
}

export default class SponsorBlock implements IIntegration {
  private ytmView: BrowserView | null = null;
  private isEnabled = false;
  private currentVideoId: string | null = null;
  private segments: Segment[] = [];
  private stateCallback: (state: PlayerState) => void;

  public provide(store: Conf<StoreSchema>, ytmView: BrowserView): void {
    this.ytmView = ytmView;
  }

  private async fetchSegments(videoId: string) {
    try {
      const response = await fetch(
        `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=["sponsor","intro","outro","interaction","selfpromo","music_offtopic"]`
      );
      if (response.ok) {
        this.segments = await response.json();
        log.info(`SponsorBlock: Loaded ${this.segments.length} segments for ${videoId}`);
      } else {
        this.segments = [];
      }
    } catch (e) {
      log.error(`SponsorBlock API error for ${videoId}`, e);
      this.segments = [];
    }
  }

  public enable(): void {
    if (this.isEnabled) return;
    this.isEnabled = true;

    this.stateCallback = async (state: PlayerState) => {
      if (!this.isEnabled) return;

      if (state.trackState !== VideoState.Playing) return;

      if (state.videoDetails?.id && state.videoDetails.id !== this.currentVideoId) {
        this.currentVideoId = state.videoDetails.id;
        await this.fetchSegments(this.currentVideoId);
      }

      if (this.segments.length > 0 && this.ytmView) {
        const progress = state.videoProgress;
        for (const segment of this.segments) {
          const [start, end] = segment.segment;
          // If we are within the segment, skip to the end
          // Add a small buffer to start to ensure we catch it
          if (progress >= start && progress < end) {
            log.info(`SponsorBlock: Skipping segment ${segment.category} from ${start} to ${end}`);
            this.ytmView.webContents.send("remoteControl:execute", "seekTo", end);
            break;
          }
        }
      }
    };

    playerStateStore.addEventListener(this.stateCallback);
  }

  public disable(): void {
    if (!this.isEnabled) return;
    this.isEnabled = false;
    this.segments = [];
    this.currentVideoId = null;

    if (this.stateCallback) {
      playerStateStore.removeEventListener(this.stateCallback);
      this.stateCallback = undefined;
    }
  }

  public getYTMScripts(): { name: string; script: string }[] {
    return [];
  }
}
