import { readFile, stat } from "node:fs/promises";

const requiredManifestFields = [
  "name",
  "short_name",
  "start_url",
  "display",
  "background_color",
  "theme_color",
  "icons",
];

const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

async function assertFile(path) {
  const fileStat = await stat(path);
  if (!fileStat.isFile()) throw new Error(`${path} no es archivo`);
  if (fileStat.size === 0) throw new Error(`${path} está vacío`);
}

async function assertPng(path) {
  const file = await readFile(path);
  if (!file.subarray(0, 8).equals(pngSignature)) {
    throw new Error(`${path} no es PNG válido`);
  }
}

const manifest = JSON.parse(await readFile("public/manifest.json", "utf8"));

for (const field of requiredManifestFields) {
  if (!manifest[field]) throw new Error(`manifest.json sin ${field}`);
}

if (!Array.isArray(manifest.icons) || manifest.icons.length < 3) {
  throw new Error("manifest.json debe tener iconos instalables");
}

for (const icon of manifest.icons) {
  if (!icon.src || !icon.sizes || !icon.type) {
    throw new Error(`icono manifest incompleto: ${JSON.stringify(icon)}`);
  }

  if (icon.type === "image/png") {
    await assertPng(`public${icon.src}`);
  }
}

for (const shortcut of manifest.shortcuts || []) {
  for (const icon of shortcut.icons || []) {
    await assertPng(`public${icon.src}`);
  }
}

await assertFile("public/offline.html");

const sw = await readFile("public/sw.js", "utf8");
for (const required of [
  "install",
  "activate",
  "fetch",
  "caches.open",
  "networkFirst",
  "cacheFirst",
]) {
  if (!sw.includes(required)) {
    throw new Error(`service worker sin ${required}`);
  }
}

console.log("PWA check OK");
