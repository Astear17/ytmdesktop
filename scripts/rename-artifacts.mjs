import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const makeRoot = path.join(root, "out", "make");

function readPkgVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  return String(pkg.version);
}

function inferOs() {
  const o = process.env.YTMD_RENAME_OS?.toLowerCase();
  if (o === "windows" || o === "macos" || o === "linux") return o;
  if (process.platform === "win32") return "windows";
  if (process.platform === "darwin") return "macos";
  if (process.platform === "linux") return "linux";
  return "unknown";
}

function inferArch() {
  const a = process.env.YTMD_RENAME_ARCH?.toLowerCase();
  if (a === "x64" || a === "arm64") return a;
  if (process.arch === "arm64") return "arm64";
  return "x64";
}

function osArchSlug(os, arch, ext) {
  if (os === "windows") return arch === "arm64" ? "win-arm64" : "win-x64";
  if (os === "macos") return arch === "arm64" ? "darwin-arm64" : "darwin-x64";
  if (os === "linux") {
    if (arch === "arm64") return "linux-arm64";
    if (ext === ".rpm") return "linux-x86_64";
    return "linux-amd64";
  }
  return `${os}-${arch}`;
}

function shouldRename(file) {
  const base = path.basename(file);
  if (base.endsWith(".blockmap")) return false;
  if (base === "RELEASES" || base.endsWith(".nupkg") || base.endsWith(".delta")) return false;
  return /\.(exe|zip|deb|rpm)$/i.test(file);
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const version = readPkgVersion();
const suffix = process.env.YTMD_ARTIFACT_SUFFIX?.trim();
const os = inferOs();
const arch = inferArch();
const label = `${version}-${suffix}`;

const files = walk(makeRoot).filter(shouldRename);
let renamed = 0;
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  const slug = osArchSlug(os, arch, ext);
  const nextName = `YTMDesktop-Astear17_${label}_${slug}${ext}`;
  const dest = path.join(path.dirname(file), nextName);
  if (path.resolve(file) === path.resolve(dest)) continue;
  if (fs.existsSync(dest)) fs.rmSync(dest);
  fs.renameSync(file, dest);
  console.log(`rename-artifacts: ${path.basename(file)} → ${nextName}`);
  renamed++;
}
if (renamed === 0) {
  console.warn("rename-artifacts: no matching artifacts under", makeRoot);
} else {
  console.log(`rename-artifacts: renamed ${renamed} file(s).`);
}
