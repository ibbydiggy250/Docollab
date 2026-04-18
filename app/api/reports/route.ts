import { NextResponse } from "next/server";
import { listReportsForUser } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to view reports." }, { status: 401 });
  }

  try {
    const reports = await listReportsForUser(supabase, user.id);
    return NextResponse.json({ reports });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Reports could not be loaded." },
      { status: 500 }
    );
  }
}
