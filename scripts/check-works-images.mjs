import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const worksDataPath = path.join(repoRoot, "src/data/works.json");
const srcRoot = path.join(repoRoot, "src");
const worksImageDir = path.join(repoRoot, "public/images/works");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]);

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function collectStaticWorksImageRefs() {
  const files = await walkFiles(srcRoot);
  const refs = new Set();
  const pattern = /\/images\/works\/([A-Za-z0-9_.-]+\.[A-Za-z0-9]+)/g;

  for (const file of files) {
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(pattern)) {
      const fileName = match[1];
      const ext = path.extname(fileName).toLowerCase();
      if (IMAGE_EXTENSIONS.has(ext)) {
        refs.add(fileName);
      }
    }
  }

  return refs;
}

async function collectWorksDataRefs() {
  const raw = await readFile(worksDataPath, "utf8");
  const data = JSON.parse(raw);
  const refs = new Set();

  for (const item of data.items) {
    refs.add(item.src.replace(/^img\//, ""));
    refs.add(item.thumbnail.replace(/^img\//, ""));
  }

  return refs;
}

async function collectActualFiles() {
  const entries = await readdir(worksImageDir, { withFileTypes: true });
  return new Set(
    entries.filter((entry) => entry.isFile()).map((entry) => entry.name),
  );
}

function printList(label, files) {
  if (files.length === 0) return;
  console.log(`${label} (${files.length})`);
  for (const file of files) {
    console.log(`- ${file}`);
  }
}

async function main() {
  const expected = new Set([
    ...(await collectStaticWorksImageRefs()),
    ...(await collectWorksDataRefs()),
  ]);
  const actual = await collectActualFiles();

  const missing = [...expected].filter((file) => !actual.has(file)).sort();
  const extra = [...actual].filter((file) => !expected.has(file)).sort();

  console.log("Works image check");
  console.log(`expected: ${expected.size}`);
  console.log(`actual: ${actual.size}`);
  console.log(`missing: ${missing.length}`);
  console.log(`extra: ${extra.length}`);

  printList("Missing files", missing);
  printList("Extra files", extra);

  if (missing.length > 0) {
    process.exitCode = 1;
  }
}

await main();
