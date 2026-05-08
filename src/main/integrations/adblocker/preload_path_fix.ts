import path from "node:path";
import { app } from "electron";

// During development, we use the local node_modules path.
// In production, we use the file copied to resourcesPath.
export const PRELOAD_PATH = app.isPackaged
  ? path.join(process.resourcesPath, "index.cjs")
  : require.resolve("@ghostery/adblocker-electron-preload");
