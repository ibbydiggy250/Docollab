import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeContributions } from "@/lib/analysis/analyzer";
import { createReportWithContributors, upsertProfileForUser } from "@/lib/db/queries";
import {
  extractGoogleDocId,
  fetchGoogleDocMetadata,
  fetchGoogleDocRevisions,
  preprocessRevisions
} from "@/lib/google/revision-parser";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const analyzeRequestSchema = z.object({
  docUrl: z
    .string()
    .trim()
    .min(1, "Document URL is required.")
    .url("Enter a valid URL.")
    .refine((value) => {
      try {
        const url = new URL(value);
        return url.hostname.endsWith("docs.google.com") && url.pathname.includes("/document/d/");
      } catch {
        return false;
      }
    }, "Enter a valid Google Docs document URL.")
});

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = analyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Sign in before analyzing a document." }, { status: 401 });
  }

  let docId: string;

  try {
    docId = extractGoogleDocId(parsed.data.docUrl);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not extract the Google Doc ID." },
      { status: 400 }
    );
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
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "The mock analysis ran, but the report could not be saved."
      },
      { status: 500 }
    );
  }
}
