import type { ProcessedContributionInput } from "@/types/revision";

export function clampScore(score: number, min = 1, max = 100) {
  return Math.min(max, Math.max(min, Math.round(score)));
}

export function normalize(value: number, maxValue: number) {
  if (maxValue <= 0) {
    return 0;
  }

  return value / maxValue;
}

export function estimateContributionPercentages(inputs: ProcessedContributionInput[]) {
  const totalWords = inputs.reduce((sum, input) => sum + input.totalWordsAdded, 0);

  if (totalWords === 0) {
    const evenShare = inputs.length > 0 ? 100 / inputs.length : 0;
    return new Map(inputs.map((input) => [input.contributorName, Math.round(evenShare)]));
  }

  const raw = inputs.map((input) => ({
    contributorName: input.contributorName,
    percent: (input.totalWordsAdded / totalWords) * 100
  }));

  const rounded = raw.map((item) => ({
    ...item,
    percent: Math.round(item.percent)
  }));

  const delta = 100 - rounded.reduce((sum, item) => sum + item.percent, 0);

  if (rounded[0]) {
    rounded[0].percent += delta;
  }

  return new Map(rounded.map((item) => [item.contributorName, item.percent]));
}
