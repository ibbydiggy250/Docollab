import "server-only";
import { markGoogleConnectionStatus } from "@/lib/db/google-connections";
import type { SupabaseClient } from "@supabase/supabase-js";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

export async function refreshGoogleAccessToken(supabase: SupabaseClient, userId: string, refreshToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token"
    })
  });

  const payload = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !payload.access_token) {
    await markGoogleConnectionStatus(supabase, userId, "needs_reconnect");
    throw new Error(payload.error_description ?? payload.error ?? "Google access token refresh failed.");
  }

  return {
    accessToken: payload.access_token,
    expiresAt: new Date(Date.now() + (payload.expires_in ?? 3600) * 1000).toISOString(),
    scopes: payload.scope?.split(" ").filter(Boolean) ?? []
  };
}
