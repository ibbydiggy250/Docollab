import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function assertServerRuntime() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase admin client must never be created in the browser.");
  }
}

export function isSupabaseAdminConfigured() {
  assertServerRuntime();

  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.GOOGLE_TOKEN_ENCRYPTION_KEY
  );
}

export function createAdminClient() {
  assertServerRuntime();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
