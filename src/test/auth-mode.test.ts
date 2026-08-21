import { describe, expect, it, vi } from "vitest";

describe("auth mode", () => {
  it("defaults to local mode when VITE_AUTH_MODE is unset", async () => {
    vi.stubEnv("VITE_AUTH_MODE", "");
    const { isCognitoAuthMode } = await import("@/lib/cognito");
    expect(isCognitoAuthMode).toBe(false);
    vi.unstubAllEnvs();
  });

  it("enables cognito mode when VITE_AUTH_MODE=cognito", async () => {
    vi.stubEnv("VITE_AUTH_MODE", "cognito");
    vi.resetModules();
    const { isCognitoAuthMode } = await import("@/lib/cognito");
    expect(isCognitoAuthMode).toBe(true);
    vi.unstubAllEnvs();
  });
});
