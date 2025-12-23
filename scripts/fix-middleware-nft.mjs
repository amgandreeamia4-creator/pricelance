// scripts/fix-middleware-nft.mjs
//
// Workaround for a Next.js bug where proxy/middleware NFT file
// is written under the wrong name (e.g. proxy.js.nft.json),
// so Vercel can't find middleware.js.nft.json.
//
// Run this AFTER `next build`.

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

console.log(
  "[fix-middleware-nft] Neither middleware.js.nft.json nor proxy.js.nft.json found, nothing to patch."
);
