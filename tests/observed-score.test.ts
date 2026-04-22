import { describe, expect, it } from "vitest";
import { buildObservedContributorScores } from "@/lib/analysis/observed-score";
import type { GoogleDocSnapshotRecord } from "@/types/google";

function snapshot(
  overrides: Partial<GoogleDocSnapshotRecord> = {}
): GoogleDocSnapshotRecord {
  return {
    id: "snapshot-1",
    user_id: "user-1",
    google_doc_id: "doc-1",
    doc_url: "https://docs.google.com/document/d/doc-1/edit",
    doc_title: "Group Essay",
    activity_count: 0,
    revision_count: 0,
    document_text_length: 0,
    document_text_preview: null,
    has_collaborator_identity: true,
    has_edit_timestamps: true,
    has_revision_ids: true,
    has_last_modifying_users: true,
    has_document_content: true,
    has_text_deltas: false,
    likely_supports_contribution_estimate: true,
    metadata: { id: "doc-1" },
    revisions: { count: 0, hasNextPage: false, items: [] },
    activity: { count: 0, hasNextPage: false, items: [] },
    document: {
      documentId: "doc-1",
      bodyTextLength: 0,
      bodyTextPreview: ""
    },
    feasibility: {
      hasCollaboratorIdentity: true,
      hasEditTimestamps: true,
      hasRevisionIds: true,
      hasLastModifyingUsers: true,
      hasDocumentContent: true,
      hasTextDeltas: false,
      likelySupportsContributionEstimate: true,
      notes: []
    },
    created_at: "2026-04-18T01:00:00.000Z",
    ...overrides
  };
}

describe("Observed contribution scoring", () => {
  it("ranks a steady editor above a burst contributor", () => {
    const scores = buildObservedContributorScores(
      snapshot({
        activity: {
          count: 6,
          hasNextPage: false,
          items: [
            {
              timestamp: "2026-04-18T01:00:00.000Z",
              actors: [{ displayName: "Steady Student", emailAddress: "steady@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T01:20:00.000Z",
              actors: [{ displayName: "Steady Student", emailAddress: "steady@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T01:40:00.000Z",
              actors: [{ displayName: "Steady Student", emailAddress: "steady@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T02:00:00.000Z",
              actors: [{ displayName: "Burst Student", emailAddress: "burst@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T02:01:00.000Z",
              actors: [{ displayName: "Burst Student", emailAddress: "burst@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T02:02:00.000Z",
              actors: [{ displayName: "Burst Student", emailAddress: "burst@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            }
          ]
        },
        revisions: {
          count: 6,
          hasNextPage: false,
          items: [
            {
              id: "1",
              modifiedTime: "2026-04-18T01:00:00.000Z",
              lastModifyingUser: { displayName: "Steady Student", emailAddress: "steady@example.com" }
            },
            {
              id: "2",
              modifiedTime: "2026-04-18T01:20:00.000Z",
              lastModifyingUser: { displayName: "Steady Student", emailAddress: "steady@example.com" }
            },
            {
              id: "3",
              modifiedTime: "2026-04-18T01:40:00.000Z",
              lastModifyingUser: { displayName: "Steady Student", emailAddress: "steady@example.com" }
            },
            {
              id: "4",
              modifiedTime: "2026-04-18T02:00:00.000Z",
              lastModifyingUser: { displayName: "Burst Student", emailAddress: "burst@example.com" }
            },
            {
              id: "5",
              modifiedTime: "2026-04-18T02:01:00.000Z",
              lastModifyingUser: { displayName: "Burst Student", emailAddress: "burst@example.com" }
            },
            {
              id: "6",
              modifiedTime: "2026-04-18T02:02:00.000Z",
              lastModifyingUser: { displayName: "Burst Student", emailAddress: "burst@example.com" }
            }
          ]
        }
      })
    );

    expect(scores[0]?.contributorName).toBe("Steady Student");
    expect(scores[0]?.observedContributionScore).toBeGreaterThan(scores[1]?.observedContributionScore ?? 0);
  });

  it("keeps admin-only activity from overpowering real editing", () => {
    const scores = buildObservedContributorScores(
      snapshot({
        activity: {
          count: 5,
          hasNextPage: false,
          items: [
            {
              timestamp: "2026-04-18T01:00:00.000Z",
              actors: [{ displayName: "Admin Student", emailAddress: "admin@example.com" }],
              actions: ["create"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T01:05:00.000Z",
              actors: [{ displayName: "Admin Student", emailAddress: "admin@example.com" }],
              actions: ["rename"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T01:10:00.000Z",
              actors: [{ displayName: "Admin Student", emailAddress: "admin@example.com" }],
              actions: ["permissionChange"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T01:20:00.000Z",
              actors: [{ displayName: "Editing Student", emailAddress: "editor@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T01:40:00.000Z",
              actors: [{ displayName: "Editing Student", emailAddress: "editor@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            }
          ]
        },
        revisions: {
          count: 2,
          hasNextPage: false,
          items: [
            {
              id: "1",
              modifiedTime: "2026-04-18T01:20:00.000Z",
              lastModifyingUser: { displayName: "Editing Student", emailAddress: "editor@example.com" }
            },
            {
              id: "2",
              modifiedTime: "2026-04-18T01:40:00.000Z",
              lastModifyingUser: { displayName: "Editing Student", emailAddress: "editor@example.com" }
            }
          ]
        }
      })
    );

    expect(scores[0]?.contributorName).toBe("Editing Student");
    expect(scores[0]?.observedContributionScore).toBeGreaterThan(scores[1]?.observedContributionScore ?? 0);
    expect(scores[1]?.scoreLabel).toBe("Minimal Contributor");
  });
});
