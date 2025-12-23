// scripts/fix-middleware-nft.mjs
//
// Workaround for a Next.js / Vercel mismatch where a middleware NFT file
// (.next/server/middleware.js.nft.json) is expected but not generated.
//
// Run this AFTER `next build`.
//
// Behaviour:
// 1. If middleware.js.nft.json already exists, do nothing.
// 2. If proxy.js.nft.json exists, copy it to middleware.js.nft.json.
// 3. Otherwise, search for any *.nft.json file under .next/server and copy
//    its contents to middleware.js.nft.json.
// 4. If none are found, create a minimal placeholder NFT JSON.

import fs from "fs";
import path from "path";

const distDir = ".next";
const serverDir = path.join(distDir, "server");

const proxyNftPath = path.join(serverDir, "proxy.js.nft.json");
const middlewareNftPath = path.join(serverDir, "middleware.js.nft.json");

function fileExists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function findAnyNftFile(dir) {
  let result = null;

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        if (result) return;
      } else if (entry.isFile() && entry.name.endsWith(".nft.json")) {
        result = fullPath;
        return;
      }
    }
  }

  walk(dir);
  return result;
}

if (!fileExists(serverDir)) {
  console.log("[fix-middleware-nft] .next/server not found, skipping.");
  process.exit(0);
}

if (fileExists(middlewareNftPath)) {
  console.log(
    "[fix-middleware-nft] middleware.js.nft.json already exists, nothing to do."
  );
  process.exit(0);
}

if (fileExists(proxyNftPath)) {
  fs.copyFileSync(proxyNftPath, middlewareNftPath);
  console.log(
    "[fix-middleware-nft] Created middleware.js.nft.json from proxy.js.nft.json."
  );
  process.exit(0);
}

// Try to find any other NFT file to clone shape from
const anyNftPath = findAnyNftFile(serverDir);
if (anyNftPath) {
  fs.copyFileSync(anyNftPath, middlewareNftPath);
  console.log(
    `[fix-middleware-nft] Created middleware.js.nft.json from ${path.relative(
      serverDir,
      anyNftPath
    )}.`
  );
  process.exit(0);
}

// Fallback: minimal placeholder NFT JSON
const minimalNft = JSON.stringify(
  {
    version: 1,
    files: [],
    external: [],
    trace: [],
  },
  null,
  2
);

fs.writeFileSync(middlewareNftPath, minimalNft);
console.log(
  "[fix-middleware-nft] Created minimal placeholder middleware.js.nft.json."
);