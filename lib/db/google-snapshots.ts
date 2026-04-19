import type { SupabaseClient } from "@supabase/supabase-js";
import type { GoogleDocSnapshotRecord, GoogleProbeResult } from "@/types/google";

type CreateGoogleDocSnapshotInput = {
  userId: string;
  docUrl: string;
  probe: GoogleProbeResult;
};

export async function createGoogleDocSnapshot(supabase: SupabaseClient, input: CreateGoogleDocSnapshotInput) {
  const { probe } = input;
  const { data, error } = await supabase
    .from("google_doc_snapshots")
    .insert({
      user_id: input.userId,
      google_doc_id: probe.docId,
      doc_url: input.docUrl,
      doc_title: probe.document.title ?? probe.metadata.name ?? null,
      activity_count: probe.activity.count,
      revision_count: probe.revisions.count,
      document_text_length: probe.document.bodyTextLength,
      document_text_preview: probe.document.bodyTextPreview,
      has_collaborator_identity: probe.feasibility.hasCollaboratorIdentity,
      has_edit_timestamps: probe.feasibility.hasEditTimestamps,
      has_revision_ids: probe.feasibility.hasRevisionIds,
      has_last_modifying_users: probe.feasibility.hasLastModifyingUsers,
      has_document_content: probe.feasibility.hasDocumentContent,
      has_text_deltas: probe.feasibility.hasTextDeltas,
      likely_supports_contribution_estimate: probe.feasibility.likelySupportsContributionEstimate,
      metadata: probe.metadata,
      revisions: probe.revisions,
      activity: probe.activity,
      document: probe.document,
      feasibility: probe.feasibility
    })
    .select("*")
    .single();

  if (error || !data) {
    throw error ?? new Error("Google data snapshot was not saved.");
  }

  return data as GoogleDocSnapshotRecord;
}

export async function listGoogleDocSnapshotsForUser(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("google_doc_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as GoogleDocSnapshotRecord[];
}
