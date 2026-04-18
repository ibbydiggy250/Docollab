import { extractGoogleDocId as extractIdFromUrl } from "@/lib/google/extract-doc-id";
import { mockRevisions } from "@/lib/google/mock-revisions";
import type { ProcessedContributionInput, RevisionChunk } from "@/types/revision";

type GoogleDocMetadata = {
  id: string;
  title: string;
  lastModified: string;
};

function countWords(text?: string) {
  return text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

export function extractGoogleDocId(url: string): string {
  return extractIdFromUrl(url);
}

export async function fetchGoogleDocMetadata(docId: string): Promise<GoogleDocMetadata> {
  // TODO: Replace this with Google Drive API metadata lookup after OAuth is configured.
  return {
    id: docId,
    title: "Urban Heat Islands Group Essay",
    lastModified: new Date().toISOString()
  };
}

export async function fetchGoogleDocRevisions(docId: string): Promise<RevisionChunk[]> {
  // TODO: Replace with a real Google Docs/Drive revision fetcher.
  // Google Docs does not expose perfect per-character authorship through a simple public endpoint,
  // so the real implementation should be explicit about API limits and consent.
  return mockRevisions.map((revision) => ({
    ...revision,
    docId
  }));
}

export function preprocessRevisions(revisions: RevisionChunk[]): ProcessedContributionInput[] {
  const byContributor = new Map<string, ProcessedContributionInput>();

  for (const revision of revisions) {
    const key = revision.contributorEmail ?? revision.contributorName;
    const existing = byContributor.get(key);
    const wordsAdded = countWords(revision.textAdded);
    const wordsDeleted = countWords(revision.textDeleted);
    const substantiveChunk = wordsAdded >= 12 ? 1 : 0;

    if (!existing) {
      byContributor.set(key, {
        contributorName: revision.contributorName,
        contributorEmail: revision.contributorEmail,
        revisionCount: 1,
        totalWordsAdded: wordsAdded,
        totalWordsDeleted: wordsDeleted,
        substantiveChunks: substantiveChunk,
        textSamples: revision.textAdded ? [revision.textAdded] : [],
        rawTextAdded: revision.textAdded ?? "",
        firstEditAt: revision.timestamp,
        lastEditAt: revision.timestamp
      });
      continue;
    }

    existing.revisionCount += 1;
    existing.totalWordsAdded += wordsAdded;
    existing.totalWordsDeleted += wordsDeleted;
    existing.substantiveChunks += substantiveChunk;
    existing.rawTextAdded = [existing.rawTextAdded, revision.textAdded].filter(Boolean).join("\n\n");
    existing.textSamples = [...existing.textSamples, revision.textAdded].filter(Boolean).slice(0, 3);

    if (!existing.firstEditAt || revision.timestamp < existing.firstEditAt) {
      existing.firstEditAt = revision.timestamp;
    }

    if (!existing.lastEditAt || revision.timestamp > existing.lastEditAt) {
      existing.lastEditAt = revision.timestamp;
    }
  }

  return Array.from(byContributor.values()).sort((a, b) => b.totalWordsAdded - a.totalWordsAdded);
}
