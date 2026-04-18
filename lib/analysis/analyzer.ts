import { clampScore, estimateContributionPercentages, normalize } from "@/lib/analysis/scoring";
import type { ContributorAnalysis } from "@/types/contributor";
import type { ProcessedContributionInput } from "@/types/revision";

function averageChunkLength(input: ProcessedContributionInput) {
  if (input.revisionCount === 0) {
    return 0;
  }

  return input.totalWordsAdded / input.revisionCount;
}

function createContributorSummary(input: ProcessedContributionInput, percent: number) {
  const role =
    percent >= 35
      ? "was one of the primary contributors"
      : percent >= 20
        ? "made a steady contribution"
        : "made a smaller but visible contribution";

  const substance =
    input.substantiveChunks >= 3
      ? "with several substantive additions"
      : input.substantiveChunks >= 1
        ? "with at least one meaningful content addition"
        : "mostly through short edits";

  return `${input.contributorName} ${role}, ${substance} across ${input.revisionCount} revision${input.revisionCount === 1 ? "" : "s"}.`;
}

export async function analyzeContributions(
  processedData: ProcessedContributionInput[]
): Promise<{
  overall_summary: string;
  contributors: ContributorAnalysis[];
}> {
  // TODO: Replace this deterministic mock analyzer with a server-side OpenAI call.
  const percentages = estimateContributionPercentages(processedData);
  const maxWords = Math.max(...processedData.map((input) => input.totalWordsAdded), 0);

  const contributors = processedData.map((input) => {
    const contributionPercent = percentages.get(input.contributorName) ?? 0;
    const volumeSignal = normalize(input.totalWordsAdded, maxWords);
    const chunkSignal = Math.min(input.substantiveChunks / 4, 1);
    const avgChunk = averageChunkLength(input);

    const significance = clampScore(50 + chunkSignal * 28 + Math.min(avgChunk, 60) * 0.35);
    const originality = clampScore(54 + volumeSignal * 20 + Math.min(input.textSamples.length, 3) * 5);
    const writingQuality = clampScore(58 + Math.min(avgChunk, 55) * 0.4 - input.totalWordsDeleted * 0.05);

    return {
      contributor_name: input.contributorName,
      contributor_email: input.contributorEmail,
      contribution_percent: contributionPercent,
      originality_score: originality,
      significance_score: significance,
      writing_quality_score: writingQuality,
      summary: createContributorSummary(input, contributionPercent),
      raw_text_added: input.rawTextAdded
    };
  });

  const totalWords = processedData.reduce((sum, input) => sum + input.totalWordsAdded, 0);
  const topContributor = contributors[0]?.contributor_name ?? "The group";

  return {
    overall_summary:
      contributors.length === 0
        ? "No collaborator activity was found in the available revision data."
        : `${topContributor} contributed the largest share of drafted text. The mock analysis processed ${totalWords} added words across ${contributors.length} collaborators and is ready to be replaced with deeper originality and significance evaluation later.`,
    contributors
  };
}
