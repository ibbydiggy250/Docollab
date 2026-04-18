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
