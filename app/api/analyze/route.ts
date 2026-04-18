import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeContributions } from "@/lib/analysis/analyzer";
import { createReportWithContributors, upsertProfileForUser } from "@/lib/db/queries";
import { googleDocUrlSchema } from "@/lib/google/doc-url-schema";
import {
  extractGoogleDocId,
  fetchGoogleDocMetadata,
  fetchGoogleDocRevisions,
  preprocessRevisions
} from "@/lib/google/revision-parser";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const analyzeRequestSchema = z.object({
  docUrl: googleDocUrlSchema
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const parsed = analyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid request.", 400);
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonError("Sign in before analyzing a document.", 401);
  }

  let docId: string;

  try {
    docId = extractGoogleDocId(parsed.data.docUrl);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Could not extract the Google Doc ID.", 400);
  }

  try {
    await upsertProfileForUser(supabase, user);

    const [metadata, revisions] = await Promise.all([
      fetchGoogleDocMetadata(docId),
      fetchGoogleDocRevisions(docId)
    ]);
    const processed = preprocessRevisions(revisions);
    const analysis = await analyzeContributions(processed);

    const report = await createReportWithContributors(supabase, {
      userId: user.id,
      docTitle: metadata.title,
      docUrl: parsed.data.docUrl,
      googleDocId: docId,
      totalRevisions: revisions.length,
      totalCollaborators: processed.length,
      overallSummary: analysis.overall_summary,
      contributors: analysis.contributors
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "The mock analysis ran, but the report could not be saved.",
      500
    );
  }
}
