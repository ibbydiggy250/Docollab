import { NextResponse } from "next/server";
import { z } from "zod";
import { getGoogleRefreshToken, saveGoogleConnection } from "@/lib/db/google-connections";
import { createGoogleDocSnapshot, listGoogleDocSnapshotsForUser } from "@/lib/db/google-snapshots";
import { googleDocUrlSchema } from "@/lib/google/doc-url-schema";
import { extractGoogleDocId } from "@/lib/google/extract-doc-id";
import { probeGoogleDoc } from "@/lib/google/probe";
import { GOOGLE_AUTH_SCOPES } from "@/lib/google/scopes";
import { refreshGoogleAccessToken } from "@/lib/google/tokens";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const snapshotRequestSchema = z.object({
  docUrl: googleDocUrlSchema
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getSignedInUser() {
  const supabase = createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  return { supabase, user, error };
}

export async function GET() {
  const { supabase, user, error } = await getSignedInUser();

  if (error || !user) {
    return jsonError("Sign in to view saved Google data.", 401);
  }

  try {
    const snapshots = await listGoogleDocSnapshotsForUser(supabase, user.id);
    return NextResponse.json({ snapshots });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Saved Google data could not be loaded.", 500);
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = snapshotRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  }

  const { supabase, user, error } = await getSignedInUser();

  if (error || !user) {
    return jsonError("Sign in before fetching Google data.", 401);
  }

  if (!isSupabaseAdminConfigured()) {
    return jsonError(
      "Google data fetching requires SUPABASE_SERVICE_ROLE_KEY and GOOGLE_TOKEN_ENCRYPTION_KEY on the server.",
      500
    );
  }

  const adminSupabase = createAdminClient();
  const refreshToken = await getGoogleRefreshToken(adminSupabase, user.id);

  if (!refreshToken) {
    return jsonError("Reconnect Google to grant offline Docs and Drive access before fetching data.", 409);
  }

  try {
    const docId = extractGoogleDocId(parsed.data.docUrl);
    const refreshed = await refreshGoogleAccessToken(adminSupabase, user.id, refreshToken);

    await saveGoogleConnection(adminSupabase, {
      userId: user.id,
      scopes: refreshed.scopes.length > 0 ? refreshed.scopes : GOOGLE_AUTH_SCOPES,
      providerRefreshToken: null,
      accessTokenExpiresAt: refreshed.expiresAt,
      status: "connected"
    });

    const probe = await probeGoogleDoc(docId, refreshed.accessToken);
    const snapshot = await createGoogleDocSnapshot(supabase, {
      userId: user.id,
      docUrl: parsed.data.docUrl,
      probe
    });

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Google data could not be fetched and saved.", 500);
  }
}
