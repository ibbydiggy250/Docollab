import { describe, expect, it } from "vitest";
import { buildGoogleContributorSignals } from "@/lib/google/contribution-signals";
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

describe("Google contributor signals", () => {
  it("groups activity and revision evidence by contributor email", () => {
    const signals = buildGoogleContributorSignals(
      snapshot({
        activity: {
          count: 1,
          hasNextPage: false,
          items: [
            {
              timestamp: "2026-04-18T01:10:00.000Z",
              actors: [{ displayName: "Maya Chen", emailAddress: "maya@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            }
          ]
        },
        revisions: {
          count: 1,
          hasNextPage: false,
          items: [
            {
              id: "1",
              modifiedTime: "2026-04-18T01:20:00.000Z",
              lastModifyingUser: { displayName: "Maya Chen", emailAddress: "maya@example.com" }
            }
          ]
        }
      })
    );

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      contributorName: "Maya Chen",
      contributorEmail: "maya@example.com",
      activityCount: 1,
      revisionCount: 1,
      appearedAsLastModifier: true,
      activitySharePercent: 100
    });
    expect(signals[0]?.actionTypes).toEqual(["edit"]);
  });

  it("estimates activity share from activity event counts", () => {
    const signals = buildGoogleContributorSignals(
      snapshot({
        activity: {
          count: 3,
          hasNextPage: false,
          items: [
            {
              timestamp: "2026-04-18T01:00:00.000Z",
              actors: [{ displayName: "Maya Chen", emailAddress: "maya@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T01:05:00.000Z",
              actors: [{ displayName: "Maya Chen", emailAddress: "maya@example.com" }],
              actions: ["comment"],
              targets: ["Group Essay"]
            },
            {
              timestamp: "2026-04-18T01:10:00.000Z",
              actors: [{ displayName: "Noah Patel", emailAddress: "noah@example.com" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            }
          ]
        }
      })
    );

    expect(signals.map((signal) => signal.contributorName)).toEqual(["Maya Chen", "Noah Patel"]);
    expect(signals.map((signal) => signal.activitySharePercent)).toEqual([67, 33]);
  });

  it("keeps unknown actor events visible instead of dropping them", () => {
    const signals = buildGoogleContributorSignals(
      snapshot({
        activity: {
          count: 1,
          hasNextPage: false,
          items: [
            {
              timestamp: "2026-04-18T01:00:00.000Z",
              actors: [],
              actions: ["edit"],
              targets: ["Group Essay"]
            }
          ]
        }
      })
    );

    expect(signals[0]).toMatchObject({
      contributorName: "Unknown collaborator",
      activityCount: 1,
      activitySharePercent: 100
    });
  });

  it("merges a Google people id into a named revision user when timestamps line up", () => {
    const signals = buildGoogleContributorSignals(
      snapshot({
        activity: {
          count: 1,
          hasNextPage: false,
          items: [
            {
              timestamp: "2026-04-19T04:40:00.000Z",
              actors: [{ knownUserPersonName: "people/10126094759115728147" }],
              actions: ["edit"],
              targets: ["Group Essay"]
            }
          ]
        },
        revisions: {
          count: 1,
          hasNextPage: false,
          items: [
            {
              id: "2",
              modifiedTime: "2026-04-19T04:41:00.000Z",
              lastModifyingUser: { displayName: "afnan.ali", emailAddress: "afnan.ali@example.com" }
            }
          ]
        }
      })
    );

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      contributorName: "afnan.ali",
      contributorEmail: "afnan.ali@example.com",
      activityCount: 1,
      revisionCount: 1,
      activitySharePercent: 100
    });
  });

  it("does not merge a Google people id when the timestamp match is ambiguous", () => {
    const signals = buildGoogleContributorSignals(
      snapshot({
        activity: {
          count: 1,
          hasNextPage: false,
          items: [
            {
              timestamp: "2026-04-19T04:40:00.000Z",
              actors: [{ knownUserPersonName: "people/10126094759115728147" }],
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
              id: "2",
              modifiedTime: "2026-04-19T04:41:00.000Z",
              lastModifyingUser: { displayName: "Afnan Ali", emailAddress: "afnan@example.com" }
            },
            {
              id: "3",
              modifiedTime: "2026-04-19T04:41:00.000Z",
              lastModifyingUser: { displayName: "Maya Chen", emailAddress: "maya@example.com" }
            }
          ]
        }
      })
    );

    expect(signals.map((signal) => signal.contributorName)).toEqual([
      "people/10126094759115728147",
      "Afnan Ali",
      "Maya Chen"
    ]);
  });
});
