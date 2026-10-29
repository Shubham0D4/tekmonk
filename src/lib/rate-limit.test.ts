/**
 * Unit tests for src/lib/rate-limit.ts
 *
 * rate-limit.ts uses "server-only" which throws in non-Next.js environments,
 * so we mock the module before importing anything else.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock "server-only" so the import in rate-limit.ts does not throw.
vi.mock("server-only", () => ({}));

// Dynamic import ensures the mock is registered before the module is evaluated.
const { rateLimit, requestAddress } = await import("@/lib/rate-limit");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Clear the in-process bucket map between tests to keep them independent. */
function clearBuckets() {
  const g = globalThis as unknown as { tekmonkRateLimits?: Map<string, unknown> };
  g.tekmonkRateLimits?.clear();
}

// ---------------------------------------------------------------------------
// rateLimit
// ---------------------------------------------------------------------------

describe("rateLimit", () => {
  beforeEach(() => {
    clearBuckets();
  });

  it("allows the first call within the window", () => {
    const result = rateLimit("test-key", 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBe(0);
  });

  it("allows calls up to the limit", () => {
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      const result = rateLimit("multi-key", limit, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks calls that exceed the limit", () => {
    const limit = 3;
    for (let i = 0; i < limit; i++) {
      rateLimit("block-key", limit, 60_000);
    }
    // (limit + 1)-th call must be blocked
    const result = rateLimit("block-key", limit, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("resets after the window expires", () => {
    const limit = 1;
    const windowMs = 50; // very short window

    // Exhaust the limit.
    rateLimit("reset-key", limit, windowMs);
    const blocked = rateLimit("reset-key", limit, windowMs);
    expect(blocked.allowed).toBe(false);

    // Wait for the window to expire then try again.
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const result = rateLimit("reset-key", limit, windowMs);
        expect(result.allowed).toBe(true);
        resolve();
      }, windowMs + 10);
    });
  });

  it("treats different keys as independent buckets", () => {
    const limit = 1;
    // Exhaust bucket A.
    rateLimit("key-a", limit, 60_000);
    const blockedA = rateLimit("key-a", limit, 60_000);
    expect(blockedA.allowed).toBe(false);

    // Key B should still be unaffected.
    const resultB = rateLimit("key-b", limit, 60_000);
    expect(resultB.allowed).toBe(true);
  });

  it("returns a positive retryAfter (in seconds) when blocked", () => {
    const limit = 1;
    rateLimit("retry-key", limit, 10_000);
    const result = rateLimit("retry-key", limit, 10_000);
    expect(result.allowed).toBe(false);
    // retryAfter should be at most the window in seconds
    expect(result.retryAfter).toBeGreaterThanOrEqual(1);
    expect(result.retryAfter).toBeLessThanOrEqual(10);
  });
});

// ---------------------------------------------------------------------------
// requestAddress
// ---------------------------------------------------------------------------

describe("requestAddress", () => {
  it("returns the first IP from x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(requestAddress(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    const headers = new Headers({ "x-real-ip": "9.10.11.12" });
    expect(requestAddress(headers)).toBe("9.10.11.12");
  });

  it("returns 'unknown' when both headers are absent", () => {
    const headers = new Headers();
    expect(requestAddress(headers)).toBe("unknown");
  });
});
