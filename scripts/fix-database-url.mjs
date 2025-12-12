#!/usr/bin/env node

// Non-interactive CLI to ensure Vercel production DATABASE_URL matches local .env,
// trigger a redeploy, and health-check /admin/search-analytics.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getEnvVar(name, { required = false } = {}) {
  const value = process.env[name];
  if (required && (!value || value.trim() === "")) {
    console.error(`[FATAL] Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const VERCEL_TOKEN = getEnvVar("VERCEL_TOKEN", { required: true });
const VERCEL_PROJECT_ID = getEnvVar("VERCEL_PROJECT_ID", { required: true });
const VERCEL_TEAM_ID = getEnvVar("VERCEL_TEAM_ID", { required: false });
const APP_BASE_URL = getEnvVar("APP_BASE_URL", { required: true });
const LOCAL_ENV_PATH = getEnvVar("LOCAL_ENV_PATH", { required: false }) || ".env";

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseDotEnv(contents) {
  const lines = contents.split(/\r?\n/);
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!key) continue;
    result[key] = stripQuotes(value);
  }
  return result;
}

function readLocalDatabaseUrl() {
  try {
    const envPath = path.resolve(process.cwd(), LOCAL_ENV_PATH);
    if (!fs.existsSync(envPath)) {
      console.error(`[FATAL] Env file not found at path: ${envPath}`);
      process.exit(1);
    }
    const contents = fs.readFileSync(envPath, "utf8");
    const env = parseDotEnv(contents);
    const dbUrl = env["DATABASE_URL"];
    if (!dbUrl) {
      console.error("[FATAL] DATABASE_URL not found in env file.");
      process.exit(1);
    }
    const lower = dbUrl.toLowerCase();
    if (!lower.startsWith("postgres://") && !lower.startsWith("postgresql://")) {
      console.error(
        `[FATAL] Local DATABASE_URL is invalid; must start with postgres:// or postgresql://. Got: ${dbUrl.slice(
          0,
          50
        )}...`
      );
      process.exit(1);
    }
    console.log(
      `[INFO] Local DATABASE_URL seems valid and starts with "${dbUrl.slice(
        0,
        13
      )}..."`
    );
    return dbUrl;
  } catch (err) {
    console.error("[FATAL] Failed to read local DATABASE_URL:", err?.message || err);
    process.exit(1);
  }
}

async function vercelFetch(pathname, init = {}) {
  const base = new URL("https://api.vercel.com");
  const url = new URL(pathname, base);
  if (VERCEL_TEAM_ID) {
    url.searchParams.set("teamId", VERCEL_TEAM_ID);
  }

  const headers = {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };

  const resp = await fetch(url, { ...init, headers });
  if (!resp.ok) {
    const text = await resp.text();
    console.error(
      `[ERROR] Vercel API request failed: ${resp.status} ${resp.statusText} for ${url.toString()}`
    );
    console.error("[ERROR] Response body:", text.slice(0, 1000));
    throw new Error(`Vercel API error: ${resp.status}`);
  }
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return resp.json();
  }
  return resp.text();
}

async function getVercelEnvVars() {
  console.log("[INFO] Fetching Vercel project environment variables...");
  const data = await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}/env`, {
    method: "GET",
  });
  if (!data || !Array.isArray(data.envs)) {
    throw new Error("Unexpected response from Vercel env API");
  }
  return data.envs;
}

async function createVercelEnvVar({ key, value, target }) {
  console.log(
    `[INFO] Creating Vercel env var ${key} for target(s): ${Array.isArray(target) ? target.join(",") : target}`
  );
  const body = {
    key,
    value,
    target,
    type: "encrypted",
  };
  const data = await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}/env`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  console.log("[INFO] Created env var:", data?.id || "<no-id>");
  return data;
}

async function updateVercelEnvVar(id, { value, target }) {
  console.log(
    `[INFO] Updating Vercel env var ${id} for target(s): ${Array.isArray(target) ? target.join(",") : target}`
  );
  const body = {
    value,
    target,
  };
  const data = await vercelFetch(`/v9/projects/${VERCEL_PROJECT_ID}/env/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  console.log("[INFO] Updated env var:", id);
  return data;
}

async function ensureProductionDatabaseUrl(localDbUrl) {
  console.log("[STEP] Ensuring production DATABASE_URL matches local value...");
  const envs = await getVercelEnvVars();

  const prodDbEnv = envs.find((env) => {
    if (env.key !== "DATABASE_URL") return false;
    if (!Array.isArray(env.target)) return false;
    return env.target.includes("production");
  });

  if (!prodDbEnv) {
    console.warn("[WARN] DATABASE_URL for production does not exist on Vercel. Creating it...");
    await createVercelEnvVar({
      key: "DATABASE_URL",
      value: localDbUrl,
      target: ["production"],
    });
    console.log("[INFO] Created production DATABASE_URL.");
    return;
  }

  const currentValue = prodDbEnv.value || "";
  const currentLower = currentValue.toLowerCase();
  const isValid =
    currentLower.startsWith("postgres://") || currentLower.startsWith("postgresql://");

  if (!isValid) {
    console.warn(
      `[WARN] Existing production DATABASE_URL is invalid. Current value (truncated): ${currentValue.slice(
        0,
        20
      )}...`
    );
    await updateVercelEnvVar(prodDbEnv.id, {
      value: localDbUrl,
      target: ["production"],
    });
    console.log("[INFO] Updated production DATABASE_URL to local value.");
    return;
  }

  if (currentValue !== localDbUrl) {
    console.warn("[WARN] Production DATABASE_URL differs from local value. Updating...");
    await updateVercelEnvVar(prodDbEnv.id, {
      value: localDbUrl,
      target: ["production"],
    });
    console.log("[INFO] Synchronized production DATABASE_URL with local value.");
    return;
  }

  console.log("[INFO] Production DATABASE_URL already matches local value. No update needed.");
}

async function getLatestDeployment() {
  console.log("[INFO] Fetching latest deployment for project...");
  const data = await vercelFetch(
    `/v6/deployments?projectId=${encodeURIComponent(VERCEL_PROJECT_ID)}&limit=1`,
    {
      method: "GET",
    }
  );
  const deployments = data?.deployments || [];
  if (!deployments.length) {
    console.warn("[WARN] No previous deployments found for project.");
    return null;
  }
  const latest = deployments[0];
  console.log(
    `[INFO] Latest deployment: id=${latest.id}, url=${latest.url}, state=${latest.state}`
  );
  return latest;
}

async function triggerRedeploy() {
  console.log("[STEP] Triggering redeploy based on latest deployment...");
  const latest = await getLatestDeployment();
  if (!latest) {
    throw new Error("Cannot redeploy: no existing deployments found for project.");
  }

  const body = {
    project: VERCEL_PROJECT_ID,
    target: "production",
    sourceDeploymentId: latest.id,
    name: `redeploy-${latest.url || latest.id}`,
  };

  const data = await vercelFetch("/v13/deployments", {
    method: "POST",
    body: JSON.stringify(body),
  });

  console.log(
    `[INFO] Triggered redeploy: id=${data.id}, url=${data.url}, state=${data.state}`
  );
  return data;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDeploymentReady(deploymentId, timeoutMs = 15 * 60 * 1000, pollIntervalMs = 10 * 1000) {
  console.log(`
[STEP] Waiting for deployment ${deploymentId} to become ready...`);
  const start = Date.now();

  while (true) {
    const elapsed = Date.now() - start;
    if (elapsed > timeoutMs) {
      throw new Error(
        `Deployment ${deploymentId} did not become ready within ${Math.round(
          timeoutMs / 1000
        )} seconds.`
      );
    }

    const data = await vercelFetch(`/v13/deployments/${deploymentId}`, {
      method: "GET",
    });

    const state = data?.state || "unknown";
    console.log(`[INFO] Deployment ${deploymentId} state: ${state}`);

    if (state === "ready") {
      console.log(`[INFO] Deployment ${deploymentId} is ready.`);
      return;
    }

    if (state === "error") {
      throw new Error(`Deployment ${deploymentId} entered error state.`);
    }

    await sleep(pollIntervalMs);
  }
}

async function healthCheckAdminAnalytics() {
  console.log("[STEP] Health check for /admin/search-analytics...");
  let url;
  try {
    url = new URL("/admin/search-analytics", APP_BASE_URL);
  } catch (err) {
    throw new Error(`Invalid APP_BASE_URL '${APP_BASE_URL}': ${err?.message || err}`);
  }

  const resp = await fetch(url.toString(), {
    method: "GET",
  });

  if (!resp.ok) {
    const bodyText = (await resp.text()).slice(0, 300);
    console.error(
      `[ERROR] Health check failed with status ${resp.status} ${resp.statusText}. Body (truncated):`,
      bodyText
    );
    throw new Error("Health check failed: non-2xx status.");
  }

  const body = await resp.text();
  const truncatedBodyForLog = body.slice(0, 5000);

  if (truncatedBodyForLog.includes("Error validating datasource 'db'")) {
    console.error(
      "[ERROR] Prisma datasource error detected in /admin/search-analytics response body."
    );
    throw new Error("Prisma datasource still invalid according to /admin/search-analytics.");
  }

  console.log("[INFO] /admin/search-analytics health check passed.");
}

async function main() {
  console.log("[START] fix-database-url CLI");

  const localDbUrl = readLocalDatabaseUrl();
  await ensureProductionDatabaseUrl(localDbUrl);

  const newDeployment = await triggerRedeploy();
  await waitForDeploymentReady(newDeployment.id);

  await healthCheckAdminAnalytics();

  console.log("\n[SUCCESS] DATABASE_URL mismatch fully resolved and verified.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[FAILURE] fix-database-url encountered an error.");
  console.error("[ERROR]", err?.message || err);
  console.error("[ERROR] Unhandled error in fix-database-url:", err?.stack || "<no-stack>");
  process.exit(1);
});
