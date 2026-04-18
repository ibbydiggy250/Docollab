import { NextResponse } from "next/server";
import { z } from "zod";
import { getReportForUser } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const paramsSchema = z.object({
  id: z.string().uuid()
});

type ReportRouteProps = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: ReportRouteProps) {
  const parsed = paramsSchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report ID." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Sign in to view this report." }, { status: 401 });
  }

  try {
    const report = await getReportForUser(supabase, user.id, parsed.data.id);
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }
}
