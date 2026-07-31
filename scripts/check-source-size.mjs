import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOTS = ["apps", "packages", "scripts"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".sql"]);
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".next",
  ".open-next",
  ".wrangler",
  "dist",
  "build",
]);
const MAX_LINES = 800;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (IGNORED_DIRECTORIES.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(target));
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(target);
    }
  }
  return files;
}

const files = (await Promise.all(ROOTS.map(collectFiles))).flat();
const oversized = [];

for (const file of files) {
  const source = await readFile(file, "utf8");
  const lines = source.split(/\r?\n/).length;
  if (lines > MAX_LINES) {
    oversized.push({ file: path.relative(process.cwd(), file), lines });
  }
}

if (oversized.length > 0) {
  for (const item of oversized) {
    console.error(`${item.file}: ${item.lines} lines (maximum ${MAX_LINES})`);
  }
  process.exitCode = 1;
} else {
  console.log(`Source size check passed: ${files.length} files, maximum ${MAX_LINES} lines.`);
}
