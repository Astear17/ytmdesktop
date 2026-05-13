import { BrowserView, session, app, type Session } from "electron";
import { ElectronBlocker, adsAndTrackingLists } from "@ghostery/adblocker-electron";
import fetch from "cross-fetch";
import { promises as fs } from "node:fs";
import path from "node:path";
import log from "electron-log";

import { StoreSchema } from "../../../shared/store/schema";
import Conf from "conf";
import IIntegration from "../integration";

const extensionLoadedSessions = new WeakMap<Session, boolean>();

/**
 * Uses @ghostery/adblocker-electron with the same filter subscriptions as
 * `fromPrebuiltAdsAndTracking`, plus `loadExtendedSelectors` for better cosmetic
 * rules (important for YouTube Music). Results are cached under userData.
 *
 * Optional MV3 extension (e.g. uBlock Origin Lite unpacked build): set env
 * `YTMD_UBLOCK_LITE_PATH` to the extension directory, then restart the app.
 * If load fails, only the Ghostery engine is used.
 */
export default class Adblocker implements IIntegration {
  private ytmView: BrowserView | null = null;
  private blocker: ElectronBlocker | null = null;
  private isEnabled = false;

  public provide(_store: Conf<StoreSchema>, ytmView: BrowserView): void {
    this.ytmView = ytmView;
    if (this.isEnabled) {
      this.enable();
    }
  }

  public enable(): void {
    this.isEnabled = true;
    if (!this.ytmView) return;

    void this.enableAsync().catch(err => {
      log.error("Adblocker failed to start:", err);
    });
  }

  private async enableAsync(): Promise<void> {
    if (!this.ytmView || !this.isEnabled) return;

    const viewSession = this.ytmView.webContents.session || session.defaultSession;

    if (!this.blocker) {
      const cacheFile = path.join(app.getPath("userData"), "ytmd-adblocker-engine.bin");
      try {
        this.blocker = await ElectronBlocker.fromLists(
          fetch,
          [...adsAndTrackingLists],
          {
            loadExtendedSelectors: true,
            loadGenericCosmeticsFilters: true,
            enableMutationObserver: true
          },
          {
            path: cacheFile,
            read: fs.readFile,
            write: fs.writeFile
          }
        );
        log.info(`Adblocker engine ready (${adsAndTrackingLists.length} lists, extended selectors on)`);
      } catch (err) {
        log.warn("Adblocker: cached engine failed, building from network only", err);
        this.blocker = await ElectronBlocker.fromLists(fetch, [...adsAndTrackingLists], {
          loadExtendedSelectors: true,
          loadGenericCosmeticsFilters: true,
          enableMutationObserver: true
        });
      }
    }

    if (!this.isEnabled || !this.blocker || !this.ytmView) return;

    const extPath = process.env.YTMD_UBLOCK_LITE_PATH?.trim();
    if (extPath && !extensionLoadedSessions.get(viewSession)) {
      try {
        await fs.access(extPath);
        const res = await viewSession.loadExtension(extPath, { allowFileAccess: true });
        extensionLoadedSessions.set(viewSession, true);
        log.info("Adblocker: loaded extension", res.name);
      } catch (e) {
        log.warn("Adblocker: YTMD_UBLOCK_LITE_PATH set but extension could not be loaded:", e);
      }
    }

    this.blocker.enableBlockingInSession(viewSession);
  }

  public disable(): void {
    this.isEnabled = false;
    if (this.blocker && this.ytmView) {
      const viewSession = this.ytmView.webContents.session || session.defaultSession;
      try {
        this.blocker.disableBlockingInSession(viewSession);
      } catch {
        /* not enabled on this session */
      }
    }
  }

  public getYTMScripts(): { name: string; script: string }[] {
    return [];
  }
}
