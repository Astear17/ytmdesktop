import path from "node:path";
import { app } from "electron";
import { Module } from "node:module";

/**
 * MONKEY-PATCH: require.resolve
 * This intercepts any attempt to resolve the adblocker-preload module
 * and redirects it to the production-safe resources path.
 */
// @ts-expect-error - Overriding a system method
const originalResolve = Module._resolveFilename;
// @ts-expect-error
Module._resolveFilename = function(request: string, parent: any, isMain: boolean, options: any) {
  if (request === "@ghostery/adblocker-electron-preload") {
    return path.join(process.resourcesPath, "index.cjs");
  }
  return originalResolve.call(this, request, parent, isMain, options);
};

// Also inject global search path for the main adblocker module
if (app.isPackaged) {
  const extraModulesPath = path.join(process.resourcesPath, "node_modules");
  // @ts-expect-error
  if (!Module.globalPaths.includes(extraModulesPath)) {
    // @ts-expect-error
    Module.globalPaths.push(extraModulesPath);
  }
}
