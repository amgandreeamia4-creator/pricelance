import dns from "node:dns/promises";
import net from "node:net";

export const DEFAULT_REMOTE_FETCH_TIMEOUT_MS = 10_000;
export const DEFAULT_REMOTE_MAX_BYTES = 5 * 1024 * 1024;

export class SafeRemoteUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SafeRemoteUrlError";
  }
}

type LookupResult = { address: string; family?: number };
type LookupFn = (hostname: string, options: { all: true; verbatim?: boolean }) => Promise<LookupResult[]>;

type SafeRemoteUrlOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  lookup?: LookupFn;
  fetchImpl?: typeof fetch;
};

const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".localdomain",
  ".internal",
  ".local",
  ".home.arpa",
  ".lan",
  ".intranet",
  ".internal.localhost",
];

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");

  if (!normalized) return true;
  if (normalized === "localhost" || normalized === "localhost.localdomain") return true;
  if (normalized === "localdomain" || normalized === "local" || normalized === "internal") return true;
  if (normalized.endsWith(".localhost")) return true;
  if (normalized.endsWith(".localdomain")) return true;
  if (normalized.endsWith(".internal")) return true;
  if (normalized.endsWith(".local")) return true;
  if (normalized.endsWith(".home.arpa")) return true;
  if (normalized.endsWith(".lan")) return true;
  if (normalized.endsWith(".intranet")) return true;
  if (normalized.includes("localhost")) return true;
  if (normalized.includes("internal")) return true;

  return false;
}

function isBlockedIPv4(ip: string): boolean {
  const octets = ip.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => Number.isNaN(octet))) {
    return false;
  }

  const [a, b] = octets;

  if (ip === "0.0.0.0") return true;
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a === 192 && b === 0 && (octets[1] === 0 || octets[1] === 2)) return true;
  if (a === 198 && b === 51 && octets[2] === 100) return true;
  if (a === 203 && b === 0 && octets[2] === 113) return true;
  if (a >= 224 && a <= 255) return true;

  return false;
}

function isBlockedIPv6(ip: string): boolean {
  if (ip === "::1") return true;
  if (ip === "::") return true;
  if (ip.startsWith("::ffff:")) {
    return isBlockedIPv4(ip.slice("::ffff:".length));
  }

  const normalized = ip.toLowerCase();
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe8")) return true;
  if (normalized.startsWith("fe9")) return true;
  if (normalized.startsWith("fea")) return true;
  if (normalized.startsWith("feb")) return true;
  if (normalized.startsWith("ff")) return true;
  if (normalized.startsWith("::") && normalized.includes("1")) {
    return true;
  }

  return false;
}

function isBlockedIP(ip: string): boolean {
  if (!ip) return true;
  if (net.isIPv4(ip)) return isBlockedIPv4(ip);
  if (net.isIPv6(ip)) return isBlockedIPv6(ip);
  return false;
}

export async function validateSafeRemoteUrl(
  inputUrl: string,
  options: SafeRemoteUrlOptions = {},
): Promise<URL> {
  const lookupImpl = options.lookup ?? dns.lookup;
  if (typeof inputUrl !== "string") {
    throw new SafeRemoteUrlError("Remote import URL is invalid.");
  }

  const trimmed = inputUrl.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new SafeRemoteUrlError("Remote import URL is malformed.");
  }

  if (!url.protocol || (url.protocol !== "http:" && url.protocol !== "https:")) {
    throw new SafeRemoteUrlError("Only HTTP and HTTPS URLs are allowed for remote imports.");
  }

  if (url.protocol !== "https:") {
    throw new SafeRemoteUrlError("Only HTTPS remote imports are allowed.");
  }

  if (!url.hostname) {
    throw new SafeRemoteUrlError("Remote import URL is missing a valid hostname.");
  }

  if (isBlockedHostname(url.hostname)) {
    throw new SafeRemoteUrlError("Remote import target is not allowed.");
  }

  let resolvedAddresses: LookupResult[];
  try {
    const resolved = await lookupImpl(url.hostname, { all: true, verbatim: true });
    resolvedAddresses = Array.isArray(resolved) ? resolved : [resolved as unknown as LookupResult];
  } catch {
    throw new SafeRemoteUrlError("Remote import hostname could not be resolved safely.");
  }

  if (!resolvedAddresses.length) {
    throw new SafeRemoteUrlError("Remote import hostname resolves to no valid addresses.");
  }

  for (const record of resolvedAddresses) {
    const candidate = record && typeof record === "object" ? record.address : String(record);
    if (isBlockedIP(candidate)) {
      throw new SafeRemoteUrlError("Remote import target resolves to a restricted internal address.");
    }
  }

  if (url.hostname === "169.254.169.254" || url.hostname === "metadata.google.internal") {
    throw new SafeRemoteUrlError("Remote import target is not allowed.");
  }

  return url;
}

function isAllowedContentType(contentType: string | null): boolean {
  if (!contentType) return true;

  const normalized = contentType.toLowerCase();
  if (normalized.includes("text/csv")) return true;
  if (normalized.includes("text/plain")) return true;
  if (normalized.includes("application/csv")) return true;
  if (normalized.includes("application/vnd.ms-excel")) return true;
  if (normalized.includes("application/octet-stream")) return true;
  if (normalized.includes("text/") && !normalized.includes("html")) return true;

  return false;
}

async function readResponseBodyWithLimit(response: Response, maxBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) {
    return "";
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        throw new SafeRemoteUrlError("Remote feed exceeds the maximum allowed size.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const buffer = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

export async function safeFetchRemoteText(
  inputUrl: string,
  options: SafeRemoteUrlOptions = {},
): Promise<string> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_REMOTE_FETCH_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_REMOTE_MAX_BYTES;
  const fetchImpl = options.fetchImpl ?? fetch;

  const resolvedUrl = await validateSafeRemoteUrl(inputUrl, { lookup: options.lookup, timeoutMs, maxBytes });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(resolvedUrl.toString(), {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        Accept: "text/csv,text/plain,application/csv,application/vnd.ms-excel,application/octet-stream",
      },
    });

    if (response.status >= 300 && response.status < 400) {
      throw new SafeRemoteUrlError("Remote feed redirects are not allowed.");
    }

    if (!response.ok) {
      throw new SafeRemoteUrlError(`Remote feed request failed with HTTP ${response.status}.`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && !isAllowedContentType(contentType)) {
      throw new SafeRemoteUrlError("Remote feed content type is not supported.");
    }

    const text = await readResponseBodyWithLimit(response, maxBytes);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

// NOTE: Standard fetch + DNS resolution are not atomic on Node/Vercel. We resolve the
// hostname first and reject any private/loopback/link-local destination before fetching,
// then fetch with redirect: "manual". This is the safest practical approach without
// introducing a heavy dependency or custom proxy layer.
