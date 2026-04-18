import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { ContributorAnalysis } from "@/types/contributor";

type CreateReportInput = {
  userId: string;
  docTitle: string;
  docUrl: string;
  googleDocId: string;
  totalRevisions: number;
  totalCollaborators: number;
  overallSummary: string;
  contributors: ContributorAnalysis[];
};

export async function upsertProfileForUser(supabase: SupabaseClient, user: User) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null
    },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}

export async function createReportWithContributors(supabase: SupabaseClient, input: CreateReportInput) {
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      user_id: input.userId,
      doc_title: input.docTitle,
      doc_url: input.docUrl,
      google_doc_id: input.googleDocId,
      total_revisions: input.totalRevisions,
      total_collaborators: input.totalCollaborators,
      overall_summary: input.overallSummary
    })
    .select("*")
    .single();

  if (reportError || !report) {
    throw reportError ?? new Error("Report was not created.");
  }

  const rows = input.contributors.map((contributor) => ({
    report_id: report.id,
    contributor_name: contributor.contributor_name,
    contributor_email: contributor.contributor_email,
    contribution_percent: contributor.contribution_percent,
    originality_score: contributor.originality_score,
    significance_score: contributor.significance_score,
    writing_quality_score: contributor.writing_quality_score,
    summary: contributor.summary,
    raw_text_added: contributor.raw_text_added
  }));

  const { data: contributors, error: contributorError } = await supabase
    .from("contributors")
    .insert(rows)
    .select("*");

  if (contributorError) {
    throw contributorError;
  }

  return {
    ...report,
    contributors: contributors ?? []
  };
}

export async function listReportsForUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getReportForUser(supabase: SupabaseClient, userId: string, reportId: string) {
  const { data, error } = await supabase
    .from("reports")
    .select("*, contributors(*)")
    .eq("id", reportId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
