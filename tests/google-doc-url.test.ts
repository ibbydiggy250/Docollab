import { describe, expect, it } from "vitest";
import { googleDocUrlSchema } from "@/lib/google/doc-url-schema";
import { extractGoogleDocId } from "@/lib/google/extract-doc-id";

describe("Google Doc URL handling", () => {
  it("extracts a document ID from a standard Google Docs URL", () => {
    const id = "1AbCdEfGhIjKlMnOpQrStUvWxYz_1234567890";
    const url = `https://docs.google.com/document/d/${id}/edit?tab=t.0`;

    expect(extractGoogleDocId(url)).toBe(id);
    expect(googleDocUrlSchema.safeParse(url).success).toBe(true);
  });

  it("rejects non-Google Docs URLs", () => {
    const parsed = googleDocUrlSchema.safeParse("https://example.com/document/d/not-google");

    expect(parsed.success).toBe(false);
    expect(() => extractGoogleDocId("https://example.com/document/d/not-google")).toThrow("Google Docs");
  });
});
