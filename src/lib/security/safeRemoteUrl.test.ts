import { describe, expect, it, vi } from "vitest";
import { safeFetchRemoteText, validateSafeRemoteUrl, SafeRemoteUrlError } from "./safeRemoteUrl";

describe("safeRemoteUrl", () => {
  it("accepts a public HTTPS URL", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("name,price\nWidget,9.99", {
        status: 200,
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      }),
    );

    const url = await validateSafeRemoteUrl("https://example.com/feed.csv", {
      lookup: async () => [{ address: "93.184.216.34", family: 4 }],
    });

    expect(url.hostname).toBe("example.com");

    const text = await safeFetchRemoteText("https://example.com/feed.csv", {
      fetchImpl,
      lookup: async () => [{ address: "93.184.216.34", family: 4 }],
    });

    expect(text).toContain("Widget");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects plain HTTP remote imports", async () => {
    await expect(
      validateSafeRemoteUrl("http://example.com/feed.csv", {
        lookup: async () => [{ address: "93.184.216.34", family: 4 }],
      }),
    ).rejects.toThrow(SafeRemoteUrlError);
  });

  it("rejects localhost", async () => {
    await expect(
      validateSafeRemoteUrl("https://localhost/feed.csv", {
        lookup: async () => [{ address: "127.0.0.1", family: 4 }],
      }),
    ).rejects.toThrow(SafeRemoteUrlError);
  });

  it("rejects 127.0.0.1", async () => {
    await expect(
      validateSafeRemoteUrl("https://127.0.0.1/feed.csv", {
        lookup: async () => [{ address: "127.0.0.1", family: 4 }],
      }),
    ).rejects.toThrow(SafeRemoteUrlError);
  });

  it("rejects private IP ranges", async () => {
    await expect(
      validateSafeRemoteUrl("https://example.com/feed.csv", {
        lookup: async () => [{ address: "10.0.0.5", family: 4 }],
      }),
    ).rejects.toThrow(SafeRemoteUrlError);
  });

  it("rejects cloud metadata endpoints", async () => {
    await expect(
      validateSafeRemoteUrl("https://169.254.169.254/latest/meta-data/", {
        lookup: async () => [{ address: "169.254.169.254", family: 4 }],
      }),
    ).rejects.toThrow(SafeRemoteUrlError);
  });

  it("rejects malformed URLs", async () => {
    await expect(validateSafeRemoteUrl("not-a-url")).rejects.toThrow(SafeRemoteUrlError);
  });

  it("rejects oversized responses", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(new Uint8Array(5 * 1024 * 1024 + 1), {
        status: 200,
        headers: { "Content-Type": "text/csv" },
      }),
    );

    await expect(
      safeFetchRemoteText("https://example.com/feed.csv", {
        fetchImpl,
        lookup: async () => [{ address: "93.184.216.34", family: 4 }],
      }),
    ).rejects.toThrow(SafeRemoteUrlError);
  });

  it("fails closed on redirects", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response("", {
        status: 302,
        headers: { Location: "https://evil.example.com/feed.csv" },
      }),
    );

    await expect(
      safeFetchRemoteText("https://example.com/feed.csv", {
        fetchImpl,
        lookup: async () => [{ address: "93.184.216.34", family: 4 }],
      }),
    ).rejects.toThrow(SafeRemoteUrlError);
  });
});
