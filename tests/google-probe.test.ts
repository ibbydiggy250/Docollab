import { afterEach, describe, expect, it, vi } from "vitest";
import { probeGoogleDoc } from "@/lib/google/probe";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("Google probe normalization", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes metadata, revisions, activity, document content, and feasibility", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("/drive/v3/files/doc-123?")) {
          return Promise.resolve(
            jsonResponse({
              id: "doc-123",
              name: "Group Essay",
              mimeType: "application/vnd.google-apps.document",
              modifiedTime: "2026-04-18T01:00:00.000Z",
              owners: [{ displayName: "Teacher", emailAddress: "teacher@example.com" }],
              capabilities: { canEdit: true, canComment: true, canReadRevisions: true }
            })
          );
        }

        if (url.includes("/revisions")) {
          return Promise.resolve(
            jsonResponse({
              revisions: [
                {
                  id: "1",
                  mimeType: "text/plain",
                  modifiedTime: "2026-04-18T01:05:00.000Z",
                  lastModifyingUser: {
                    displayName: "Maya Chen",
                    emailAddress: "maya@example.com"
                  }
                }
              ]
            })
          );
        }

        if (url.includes("driveactivity.googleapis.com")) {
          return Promise.resolve(
            jsonResponse({
              activities: [
                {
                  timestamp: "2026-04-18T01:10:00.000Z",
                  actors: [{ user: { knownUser: { personName: "people/123" } } }],
                  actions: [{ detail: { edit: {} } }],
                  targets: [{ driveItem: { title: "Group Essay", name: "items/doc-123" } }]
                }
              ]
            })
          );
        }

        return Promise.resolve(
          jsonResponse({
            documentId: "doc-123",
            title: "Group Essay",
            revisionId: "rev-current",
            body: {
              content: [
                {
                  paragraph: {
                    elements: [{ textRun: { content: "This is the current document text." } }]
                  }
                }
              ]
            }
          })
        );
      })
    );

    const result = await probeGoogleDoc("doc-123", "access-token");

    expect(result.metadata.name).toBe("Group Essay");
    expect(result.revisions.count).toBe(1);
    expect(result.activity.items[0]?.actions).toContain("edit");
    expect(result.document.bodyTextPreview).toContain("current document text");
    expect(result.feasibility.hasCollaboratorIdentity).toBe(true);
    expect(result.feasibility.hasTextDeltas).toBe(false);
  });
});
