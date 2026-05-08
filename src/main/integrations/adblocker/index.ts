import { BrowserView, session } from "electron";
import { ElectronBlocker } from "@ghostery/adblocker-electron";
import fetch from "cross-fetch";

import IIntegration from "../integration";

export default class Adblocker implements IIntegration {
  private ytmView: BrowserView | null = null;
  private blocker: ElectronBlocker | null = null;
  private isEnabled = false;

  public provide(ytmView: BrowserView): void {
    this.ytmView = ytmView;
    if (this.isEnabled) {
        this.enable();
    }
  }

  public async enable(): Promise<void> {
    this.isEnabled = true;
    if (!this.ytmView) return;

    if (!this.blocker) {
      this.blocker = await ElectronBlocker.fromLists(fetch, [
        "https://easylist.to/easylist/easylist.txt",
        "https://easylist.to/easylist/easyprivacy.txt",
        "https://secure.fanboy.co.nz/fanboy-annoyance.txt"
      ]);
    }

    const viewSession = this.ytmView.webContents.session || session.defaultSession;
    this.blocker.enableBlockingInSession(viewSession);
  }

  public disable(): void {
    this.isEnabled = false;
    if (this.blocker && this.ytmView) {
      const viewSession = this.ytmView.webContents.session || session.defaultSession;
      this.blocker.disableBlockingInSession(viewSession);
    }
  }

  public getYTMScripts(): { name: string; script: string }[] {
    return [];
  }
}
