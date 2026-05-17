import { defineConfig } from "vite";
import { execSync } from "node:child_process";

let gitBranch: string = "";
try {
  gitBranch = execSync("git rev-parse --abbrev-ref HEAD").toString().trim();
} catch {
  console.warn("Failed to get Git Info. Using placeholders.");
  gitBranch = "unknown";
}

// HEAD is used for production builds as they check out version tags in a detached HEAD state
const devBuild = gitBranch !== "HEAD" && process.env.NODE_ENV === "development";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    outDir: ".vite/main",
    rollupOptions: {
      external: ["bufferutil", "utf-8-validate", "@ghostery/adblocker-electron", "@ghostery/adblocker-electron-preload", "cross-fetch", "whatwg-url"]
    }
  },
  plugins: [],
  define: {
    YTMD_DISABLE_UPDATES: devBuild,
    YTMD_UPDATE_FEED_OWNER: process.env.YTMD_UPDATE_FEED_OWNER ? `'${process.env.YTMD_UPDATE_FEED_OWNER}'` : "'Astear17'",
    YTMD_UPDATE_FEED_REPOSITORY: process.env.YTMD_UPDATE_FEED_REPOSITORY ? `'${process.env.YTMD_UPDATE_FEED_REPOSITORY}'` : "'ytmdesktop'"
  }
});
