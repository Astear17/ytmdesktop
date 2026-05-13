import { BrowserView, session, app, type Session } from "electron";
import { ElectronBlocker, adsLists, adsAndTrackingLists, fullLists } from "@ghostery/adblocker-electron";
import fetch from "cross-fetch";
import { promises as fs } from "node:fs";
import path from "node:path";
import log from "electron-log";

import type { AdblockerEngine } from "../../../shared/store/schema";
import { StoreSchema } from "../../../shared/store/schema";
import Conf from "conf";
import IIntegration from "../integration";

const extensionLoadedSessions = new WeakMap<Session, boolean>();

function listsForEngine(engine: AdblockerEngine): string[] {
  switch (engine) {
    case "ghostery_ads":
      return [...adsLists];
    case "ghostery_full":
      return [...fullLists];
    case "ghostery_ads_privacy":
    default:
      return [...adsAndTrackingLists];
  }
}

function normalizeEngine(value: unknown): AdblockerEngine {
  if (value === "ghostery_ads" || value === "ghostery_full" || value === "ghostery_ads_privacy") {
    return value;
  }
  return "ghostery_ads_privacy";
}

/**
 * Uses @ghostery/adblocker-electron (Ghostery’s fork of the Cliqz adblocker) with
 * selectable filter bundles: ads-only, ads+privacy (default), or full (adds annoyances/cookies).
 * Lists are fetched from Ghostery’s curated mirrors of EasyList / uBlock slices (see package `fetch.js`).
 *
 * Optional MV3 extension (e.g. uBlock Origin Lite unpacked build): set env
 * `YTMD_UBLOCK_LITE_PATH` to the extension directory, then restart the app.
 * If load fails, only the Ghostery engine is used.
 */
export default class Adblocker implements IIntegration {
  private ytmView: BrowserView | null = null;
  private store: Conf<StoreSchema> | null = null;
  private blocker: ElectronBlocker | null = null;
  private isEnabled = false;
  private lastBuiltEngine: AdblockerEngine | null = null;

  public provide(store: Conf<StoreSchema>, ytmView: BrowserView): void {
    this.store = store;
    this.ytmView = ytmView;
    if (this.isEnabled) {
      void this.enableAsync().catch(err => {
        log.error("Adblocker failed to start:", err);
      });
    }
  }

  public enable(): void {
    this.isEnabled = true;
    if (!this.ytmView) return;

    void this.enableAsync().catch(err => {
      log.error("Adblocker failed to start:", err);
    });
  }

  /** Rebuild filter engine from store (e.g. after user changes engine). Safe if disabled. */
  public async reloadEngine(): Promise<void> {
    if (!this.ytmView) return;

    const viewSession = this.ytmView.webContents.session || session.defaultSession;
    if (this.blocker) {
      try {
        this.blocker.disableBlockingInSession(viewSession);
      } catch {
        /* not attached */
      }
    }
    this.blocker = null;
    this.lastBuiltEngine = null;

    if (this.isEnabled) {
      await this.enableAsync();
    }
  }

  private getEngine(): AdblockerEngine {
    return normalizeEngine(this.store?.get("integrations.adblockerEngine"));
  }

  private cacheFilePath(engine: AdblockerEngine): string {
    return path.join(app.getPath("userData"), `ytmd-adblocker-engine-${engine}.bin`);
  }

  private async enableAsync(): Promise<void> {
    if (!this.ytmView || !this.isEnabled) return;

    const viewSession = this.ytmView.webContents.session || session.defaultSession;
    const engine = this.getEngine();
    const lists = listsForEngine(engine);

    const needsRebuild = !this.blocker || this.lastBuiltEngine !== engine;
    if (needsRebuild) {
      if (this.blocker) {
        try {
          this.blocker.disableBlockingInSession(viewSession);
        } catch {
          /* */
        }
      }
      this.blocker = null;

      const cacheFile = this.cacheFilePath(engine);
      const fromListsOptions = {
        loadExtendedSelectors: true,
        loadGenericCosmeticsFilters: true,
        enableMutationObserver: true
      };

      try {
        this.blocker = await ElectronBlocker.fromLists(fetch, lists, fromListsOptions, {
          path: cacheFile,
          read: fs.readFile,
          write: fs.writeFile
        });
        log.info(`Adblocker engine ready (${engine}, ${lists.length} lists)`);
      } catch (err) {
        log.warn("Adblocker: cached engine failed, building from network only", err);
        this.blocker = await ElectronBlocker.fromLists(fetch, lists, fromListsOptions);
      }
      this.lastBuiltEngine = engine;
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
