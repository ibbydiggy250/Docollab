import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshGoogleAccessToken } from "@/lib/google/tokens";

type SupabaseUpdateStub = Parameters<typeof refreshGoogleAccessToken>[0];

function createSupabaseUpdateStub() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq: vi.fn(() => ({ eq })) }));
  const from = vi.fn(() => ({ update }));

  return { from } as unknown as SupabaseUpdateStub;
}

describe("Google token refresh", () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = "google-client-id";
    process.env.GOOGLE_CLIENT_SECRET = "google-client-secret";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("marks the connection for reconnect when refresh fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(JSON.stringify({ error_description: "Token has expired or been revoked." }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          })
        )
      )
    );

    await expect(refreshGoogleAccessToken(createSupabaseUpdateStub(), "user-123", "refresh-token")).rejects.toThrow(
      "Token has expired or been revoked."
    );
  });
});
