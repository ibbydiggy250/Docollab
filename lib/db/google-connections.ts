import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";
import type { GoogleConnectionStatus } from "@/types/google";

type SaveGoogleConnectionInput = {
  userId: string;
  scopes: string[];
  providerRefreshToken?: string | null;
  accessTokenExpiresAt?: string | null;
  status: GoogleConnectionStatus;
};

type GoogleConnectionRow = {
  user_id: string;
  provider: string;
  scopes: string[] | null;
  encrypted_refresh_token: string | null;
  access_token_expires_at: string | null;
  status: GoogleConnectionStatus;
};

export async function saveGoogleConnection(supabase: SupabaseClient, input: SaveGoogleConnectionInput) {
  const existing = await getGoogleConnectionRow(supabase, input.userId);
  const encryptedRefreshToken = input.providerRefreshToken
    ? encryptSecret(input.providerRefreshToken)
    : existing?.encrypted_refresh_token ?? null;

  const { error } = await supabase.from("google_connections").upsert(
    {
      user_id: input.userId,
      provider: "google",
      scopes: input.scopes,
      encrypted_refresh_token: encryptedRefreshToken,
      access_token_expires_at: input.accessTokenExpiresAt,
      status: encryptedRefreshToken ? input.status : "token_unavailable",
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,provider" }
  );

  if (error) {
    throw error;
  }
}

export async function getGoogleConnectionRow(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("google_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as GoogleConnectionRow | null;
}

export async function getGoogleRefreshToken(supabase: SupabaseClient, userId: string) {
  const connection = await getGoogleConnectionRow(supabase, userId);

  if (!connection?.encrypted_refresh_token) {
    return null;
  }

  return decryptSecret(connection.encrypted_refresh_token);
}

export async function markGoogleConnectionStatus(
  supabase: SupabaseClient,
  userId: string,
  status: GoogleConnectionStatus
) {
  const { error } = await supabase
    .from("google_connections")
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq("user_id", userId)
    .eq("provider", "google");

  if (error) {
    throw error;
  }
}
