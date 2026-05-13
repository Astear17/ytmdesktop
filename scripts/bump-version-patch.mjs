/**
 * Increments semver PATCH (3.0.0 → 3.0.1). Intended to run before `yarn make`
 * from watch:make so each debounced rebuild gets a new 3.0.x build number.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkgPath = path.join(root, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const parts = String(pkg.version).split(".").map(Number);
if (parts.length !== 3 || parts.some(n => Number.isNaN(n))) {
  console.error("bump-version-patch: expected semver MAJOR.MINOR.PATCH in package.json, got", pkg.version);
  process.exit(1);
}
parts[2] += 1;
pkg.version = `${parts[0]}.${parts[1]}.${parts[2]}`;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log(`bump-version-patch: → ${pkg.version}`);
