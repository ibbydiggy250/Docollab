import { NextResponse } from "next/server";
import { saveGoogleConnection } from "@/lib/db/google-connections";
import { upsertProfileForUser } from "@/lib/db/queries";
import { GOOGLE_AUTH_SCOPES } from "@/lib/google/scopes";
import { createAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/?auth_error=missing_code", requestUrl.origin));
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/?auth_error=${encodeURIComponent(error.message)}`, requestUrl.origin));
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    try {
      await upsertProfileForUser(supabase, user);
    } catch (err) {
      console.error("Profile upsert failed during auth callback:", err);
      return NextResponse.redirect(new URL("/dashboard?setup_error=missing_schema", requestUrl.origin));
    }

    try {
      if (!isSupabaseAdminConfigured()) {
        return NextResponse.redirect(new URL("/dashboard?setup_error=google_token_storage", requestUrl.origin));
      }

      const adminSupabase = createAdminClient();
      await saveGoogleConnection(adminSupabase, {
        userId: user.id,
        scopes: GOOGLE_AUTH_SCOPES,
        providerRefreshToken: data.session?.provider_refresh_token,
        accessTokenExpiresAt: null,
        status: data.session?.provider_refresh_token ? "connected" : "token_unavailable"
      });
    } catch (err) {
      console.error("Google token storage failed during auth callback:", err);
      return NextResponse.redirect(new URL("/dashboard?setup_error=google_token_storage", requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
