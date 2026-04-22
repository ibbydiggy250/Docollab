export type GoogleConnectionStatus = "connected" | "needs_reconnect" | "token_unavailable";

export interface GoogleRevisionMetadata {
  id: string;
  mimeType?: string;
  modifiedTime?: string;
  lastModifyingUser?: {
    displayName?: string;
    emailAddress?: string;
  };
}

export interface GoogleDriveActivityEvent {
  timestamp?: string;
  timeRange?: {
    startTime?: string;
    endTime?: string;
  };
  actors: Array<{
    displayName?: string;
    emailAddress?: string;
    knownUserPersonName?: string;
  }>;
  actions: string[];
  targets: string[];
}

export interface GoogleDocumentSnapshot {
  documentId: string;
  title?: string;
  revisionId?: string;
  bodyTextLength: number;
  bodyTextPreview: string;
}

export interface GoogleProbeResult {
  docId: string;
  fetchedAt: string;
  errors: string[];
  metadata: {
    id: string;
    name?: string;
    mimeType?: string;
    modifiedTime?: string;
    owners?: Array<{
      displayName?: string;
      emailAddress?: string;
    }>;
    capabilities?: {
      canEdit?: boolean;
      canComment?: boolean;
      canReadRevisions?: boolean;
    };
  };
  revisions: {
    count: number;
    hasNextPage: boolean;
    items: GoogleRevisionMetadata[];
  };
  activity: {
    count: number;
    hasNextPage: boolean;
    items: GoogleDriveActivityEvent[];
  };
  document: GoogleDocumentSnapshot;
  feasibility: {
    hasCollaboratorIdentity: boolean;
    hasEditTimestamps: boolean;
    hasRevisionIds: boolean;
    hasLastModifyingUsers: boolean;
    hasDocumentContent: boolean;
    hasTextDeltas: boolean;
    likelySupportsContributionEstimate: boolean;
    notes: string[];
  };
}

export interface GoogleDocSnapshotRecord {
  id: string;
  user_id: string;
  google_doc_id: string;
  doc_url: string;
  doc_title: string | null;
  activity_count: number;
  revision_count: number;
  document_text_length: number;
  document_text_preview: string | null;
  has_collaborator_identity: boolean;
  has_edit_timestamps: boolean;
  has_revision_ids: boolean;
  has_last_modifying_users: boolean;
  has_document_content: boolean;
  has_text_deltas: boolean;
  likely_supports_contribution_estimate: boolean;
  metadata: GoogleProbeResult["metadata"];
  revisions: GoogleProbeResult["revisions"];
  activity: GoogleProbeResult["activity"];
  document: GoogleProbeResult["document"];
  feasibility: GoogleProbeResult["feasibility"];
  created_at: string;
}

export interface GoogleContributorSignal {
  contributorKey: string;
  contributorName: string;
  contributorEmail?: string;
  activityCount: number;
  revisionCount: number;
  firstActivityAt?: string;
  lastActivityAt?: string;
  actionTypes: string[];
  actionCounts: Record<string, number>;
  weightedActivityPoints: number;
  timelineMoments: string[];
  appearedAsLastModifier: boolean;
  activitySharePercent: number;
  identityResolution: "direct" | "heuristic" | "unresolved";
}

export interface ObservedContributionBreakdown {
  activity: number;
  temporal_presence: number;
  consistency: number;
  ownership_proxy: number;
}

export interface ObservedContributorScore extends GoogleContributorSignal {
  observedContributionScore: number;
  scoreBreakdown: ObservedContributionBreakdown;
  scoreConfidence: number;
  scoreLabel: "High Contributor" | "Moderate Contributor" | "Minimal Contributor";
  scoreSummary: string;
  timelineBuckets: boolean[];
  weightedActivitySharePercent: number;
}
