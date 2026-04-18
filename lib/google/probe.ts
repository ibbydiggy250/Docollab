import "server-only";
import type {
  GoogleDocumentSnapshot,
  GoogleDriveActivityEvent,
  GoogleProbeResult,
  GoogleRevisionMetadata
} from "@/types/google";

type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

type GoogleFileMetadataPayload = {
  id?: string;
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

type GoogleRevisionsPayload = {
  revisions?: GoogleRevisionMetadata[];
  nextPageToken?: string;
};

type GoogleActivityPayload = {
  activities?: unknown[];
  nextPageToken?: string;
};

type GoogleDocumentPayload = {
  documentId?: string;
  title?: string;
  revisionId?: string;
  body?: {
    content?: unknown[];
  };
};

async function fetchGoogleJson<T>(url: string, accessToken: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...init?.headers
      }
    });

    const payload = (await response.json()) as T & { error?: { message?: string } };

    if (!response.ok) {
      return {
        data: null,
        error: payload.error?.message ?? `Google API request failed with status ${response.status}.`
      };
    }

    return { data: payload, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Google API request failed."
    };
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function getObjectKeys(value: unknown) {
  return Object.keys(asRecord(value));
}

function extractParagraphText(content: unknown[]) {
  const textParts: string[] = [];

  for (const item of content) {
    const paragraph = asRecord(asRecord(item).paragraph);
    const elements = Array.isArray(paragraph.elements) ? paragraph.elements : [];

    for (const element of elements) {
      const textRun = asRecord(asRecord(element).textRun);
      const contentValue = textRun.content;

      if (typeof contentValue === "string") {
        textParts.push(contentValue);
      }
    }
  }

  return textParts.join("");
}

function normalizeDocument(docId: string, payload: GoogleDocumentPayload | null): GoogleDocumentSnapshot {
  const bodyContent = Array.isArray(payload?.body?.content) ? payload.body.content : [];
  const bodyText = extractParagraphText(bodyContent).trim();

  return {
    documentId: payload?.documentId ?? docId,
    title: payload?.title,
    revisionId: payload?.revisionId,
    bodyTextLength: bodyText.length,
    bodyTextPreview: bodyText.slice(0, 500)
  };
}

function normalizeActivity(activity: unknown): GoogleDriveActivityEvent {
  const activityRecord = asRecord(activity);
  const actors = Array.isArray(activityRecord.actors) ? activityRecord.actors : [];
  const actions = Array.isArray(activityRecord.actions) ? activityRecord.actions : [];
  const targets = Array.isArray(activityRecord.targets) ? activityRecord.targets : [];
  const timestamp = typeof activityRecord.timestamp === "string" ? activityRecord.timestamp : undefined;
  const timeRange = asRecord(activityRecord.timeRange);

  return {
    timestamp,
    timeRange: {
      startTime: typeof timeRange.startTime === "string" ? timeRange.startTime : undefined,
      endTime: typeof timeRange.endTime === "string" ? timeRange.endTime : undefined
    },
    actors: actors.map((actor) => {
      const user = asRecord(asRecord(actor).user);
      const knownUser = asRecord(user.knownUser);

      return {
        displayName: typeof knownUser.personName === "string" ? knownUser.personName : undefined,
        knownUserPersonName: typeof knownUser.personName === "string" ? knownUser.personName : undefined
      };
    }),
    actions: actions.flatMap((action) => getObjectKeys(asRecord(action).detail)),
    targets: targets.flatMap((target) => {
      const driveItem = asRecord(asRecord(target).driveItem);
      const title = typeof driveItem.title === "string" ? driveItem.title : undefined;
      const name = typeof driveItem.name === "string" ? driveItem.name : undefined;
      return [title ?? name].filter((value): value is string => Boolean(value));
    })
  };
}

function buildFeasibility(result: Omit<GoogleProbeResult, "feasibility">): GoogleProbeResult["feasibility"] {
  const hasRevisionIds = result.revisions.items.some((revision) => Boolean(revision.id));
  const hasLastModifyingUsers = result.revisions.items.some((revision) => Boolean(revision.lastModifyingUser));
  const hasActivityActors = result.activity.items.some((activity) => activity.actors.length > 0);
  const hasActivityTimestamps = result.activity.items.some(
    (activity) => Boolean(activity.timestamp) || Boolean(activity.timeRange?.startTime)
  );
  const hasDocumentContent = result.document.bodyTextLength > 0;
  const likelySupportsContributionEstimate = hasActivityActors && hasActivityTimestamps;
  const notes = [
    "Drive revisions and Drive Activity can support activity diagnostics, but neither endpoint guarantees exact text deltas.",
    "Docs API returns the latest document snapshot, not a full collaborator edit ledger.",
    "Treat this probe as evidence gathering before building final scoring."
  ];

  if (!hasLastModifyingUsers) {
    notes.push("No lastModifyingUser values were found in the sampled revision metadata.");
  }

  if (!likelySupportsContributionEstimate) {
    notes.push("Actor/timestamp data is not strong enough yet for a defensible contribution estimate.");
  }

  return {
    hasCollaboratorIdentity: hasLastModifyingUsers || hasActivityActors,
    hasEditTimestamps: hasActivityTimestamps || result.revisions.items.some((revision) => Boolean(revision.modifiedTime)),
    hasRevisionIds,
    hasLastModifyingUsers,
    hasDocumentContent,
    hasTextDeltas: false,
    likelySupportsContributionEstimate,
    notes
  };
}

export async function probeGoogleDoc(docId: string, accessToken: string): Promise<GoogleProbeResult> {
  const encodedDocId = encodeURIComponent(docId);
  const [metadataResult, revisionsResult, activityResult, documentResult] = await Promise.all([
    fetchGoogleJson<GoogleFileMetadataPayload>(
      `https://www.googleapis.com/drive/v3/files/${encodedDocId}?fields=id,name,mimeType,modifiedTime,owners(displayName,emailAddress),capabilities(canEdit,canComment,canReadRevisions)`,
      accessToken
    ),
    fetchGoogleJson<GoogleRevisionsPayload>(
      `https://www.googleapis.com/drive/v3/files/${encodedDocId}/revisions?pageSize=100&fields=nextPageToken,revisions(id,mimeType,modifiedTime,lastModifyingUser(displayName,emailAddress))`,
      accessToken
    ),
    fetchGoogleJson<GoogleActivityPayload>("https://driveactivity.googleapis.com/v2/activity:query", accessToken, {
      method: "POST",
      body: JSON.stringify({
        itemName: `items/${docId}`,
        pageSize: 100,
        consolidationStrategy: {
          none: {}
        }
      })
    }),
    fetchGoogleJson<GoogleDocumentPayload>(
      `https://docs.googleapis.com/v1/documents/${encodedDocId}?fields=documentId,title,revisionId,body/content/paragraph/elements/textRun/content`,
      accessToken
    )
  ]);

  const errors = [
    metadataResult.error ? `metadata: ${metadataResult.error}` : null,
    revisionsResult.error ? `revisions: ${revisionsResult.error}` : null,
    activityResult.error ? `activity: ${activityResult.error}` : null,
    documentResult.error ? `document: ${documentResult.error}` : null
  ].filter((error): error is string => Boolean(error));

  const baseResult: Omit<GoogleProbeResult, "feasibility"> = {
    docId,
    fetchedAt: new Date().toISOString(),
    errors,
    metadata: {
      id: metadataResult.data?.id ?? docId,
      name: metadataResult.data?.name,
      mimeType: metadataResult.data?.mimeType,
      modifiedTime: metadataResult.data?.modifiedTime,
      owners: metadataResult.data?.owners ?? [],
      capabilities: metadataResult.data?.capabilities
    },
    revisions: {
      count: revisionsResult.data?.revisions?.length ?? 0,
      hasNextPage: Boolean(revisionsResult.data?.nextPageToken),
      items: revisionsResult.data?.revisions ?? []
    },
    activity: {
      count: activityResult.data?.activities?.length ?? 0,
      hasNextPage: Boolean(activityResult.data?.nextPageToken),
      items: (activityResult.data?.activities ?? []).map(normalizeActivity)
    },
    document: normalizeDocument(docId, documentResult.data)
  };

  return {
    ...baseResult,
    feasibility: buildFeasibility(baseResult)
  };
}
