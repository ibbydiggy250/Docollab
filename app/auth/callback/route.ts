import { NextResponse } from "next/server";
import { upsertProfileForUser } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/?auth_error=missing_code", requestUrl.origin));
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

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
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
