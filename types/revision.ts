export interface RevisionChunk {
  id: string;
  docId: string;
  contributorName: string;
  contributorEmail?: string;
  timestamp: string;
  textAdded: string;
  textDeleted?: string;
}

export interface ProcessedContributionInput {
  contributorName: string;
  contributorEmail?: string;
  revisionCount: number;
  totalWordsAdded: number;
  totalWordsDeleted: number;
  substantiveChunks: number;
  textSamples: string[];
  rawTextAdded: string;
  firstEditAt?: string;
  lastEditAt?: string;
}
