import { buildGoogleContributorSignals } from "@/lib/google/contribution-signals";
import type {
  GoogleContributorSignal,
  GoogleDocSnapshotRecord,
  ObservedContributionBreakdown,
  ObservedContributorScore
} from "@/types/google";

const SCORE_WEIGHTS = {
  activity: 0.3,
  temporalPresence: 0.25,
  consistency: 0.25,
  ownershipProxy: 0.2
} as const;

const TIMELINE_BUCKETS = 5;
const SHORT_TIMELINE_MS = 15 * 60 * 1000;
const SUBSTANTIVE_ACTIONS = new Set(["edit", "comment", "suggestion"]);
const ADMIN_ACTIONS = new Set(["create", "rename", "move", "permissionchange"]);

export function buildObservedContributorScores(
  snapshot: GoogleDocSnapshotRecord
): ObservedContributorScore[] {
  const signals = buildGoogleContributorSignals(snapshot);
  const timelinePoints = signals.flatMap((signal) => parseTimelineMoments(signal.timelineMoments));
  const timelineStart = getEarliestTime(timelinePoints);
  const timelineEnd = getLatestTime(timelinePoints);
  const timelineSpan =
    timelineStart !== null && timelineEnd !== null ? Math.max(timelineEnd - timelineStart, 0) : 0;

  const maxWeightedActivity = Math.max(...signals.map((signal) => signal.weightedActivityPoints), 0);
  const maxRevisionCount = Math.max(...signals.map((signal) => signal.revisionCount), 0);
  const maxActionDiversity = Math.max(...signals.map((signal) => countMeaningfulActionTypes(signal.actionCounts)), 0);
  const totalWeightedUnits = signals.reduce(
    (sum, signal) => sum + signal.weightedActivityPoints + signal.revisionCount,
    0
  );

  return signals
    .map((signal) => {
      const breakdown = buildScoreBreakdown(signal, {
        timelineStart,
        timelineEnd,
        timelineSpan,
        maxWeightedActivity,
        maxRevisionCount,
        maxActionDiversity
      });
      const rawScore = Math.round(
        breakdown.activity * SCORE_WEIGHTS.activity +
          breakdown.temporal_presence * SCORE_WEIGHTS.temporalPresence +
          breakdown.consistency * SCORE_WEIGHTS.consistency +
          breakdown.ownership_proxy * SCORE_WEIGHTS.ownershipProxy
      );
      const observedContributionScore = hasOnlyLowValueActivity(signal) ? Math.min(rawScore, 35) : rawScore;
      const weightedUnits = signal.weightedActivityPoints + signal.revisionCount;
      const weightedActivitySharePercent =
        totalWeightedUnits === 0 ? 0 : Math.round((weightedUnits / totalWeightedUnits) * 100);

      return {
        ...signal,
        observedContributionScore,
        scoreBreakdown: breakdown,
        scoreConfidence: buildScoreConfidence(signal, snapshot),
        scoreLabel: getScoreLabel(observedContributionScore),
        scoreSummary: buildScoreSummary(signal, observedContributionScore),
        timelineBuckets: buildTimelineBuckets(signal.timelineMoments, timelineStart, timelineEnd),
        weightedActivitySharePercent
      };
    })
    .sort((first, second) => {
      if (second.observedContributionScore !== first.observedContributionScore) {
        return second.observedContributionScore - first.observedContributionScore;
      }

      if (second.weightedActivitySharePercent !== first.weightedActivitySharePercent) {
        return second.weightedActivitySharePercent - first.weightedActivitySharePercent;
      }

      return first.contributorName.localeCompare(second.contributorName);
    });
}

function buildScoreBreakdown(
  signal: GoogleContributorSignal,
  context: {
    timelineStart: number | null;
    timelineEnd: number | null;
    timelineSpan: number;
    maxWeightedActivity: number;
    maxRevisionCount: number;
    maxActionDiversity: number;
  }
): ObservedContributionBreakdown {
  const activity = buildActivityScore(signal, context.maxWeightedActivity, context.maxRevisionCount, context.maxActionDiversity);
  const temporalPresence = buildTemporalPresenceScore(signal, context.timelineStart, context.timelineEnd, context.timelineSpan);
  const consistency = buildConsistencyScore(signal.timelineMoments, context.timelineStart, context.timelineEnd, context.timelineSpan);
  const ownershipProxy = buildOwnershipProxyScore(signal, context.timelineStart, context.timelineEnd, context.timelineSpan);

  if (hasOnlyLowValueActivity(signal)) {
    return {
      activity,
      temporal_presence: Math.min(temporalPresence, 20),
      consistency: Math.min(consistency, 25),
      ownership_proxy: Math.min(ownershipProxy, 35)
    };
  }

  return {
    activity,
    temporal_presence: temporalPresence,
    consistency,
    ownership_proxy: ownershipProxy
  };
}

function buildActivityScore(
  signal: GoogleContributorSignal,
  maxWeightedActivity: number,
  maxRevisionCount: number,
  maxActionDiversity: number
) {
  const activityVolume = normalizeLog(signal.weightedActivityPoints, maxWeightedActivity);
  const revisionVolume = normalizeLog(signal.revisionCount, maxRevisionCount);
  const actionDiversity = normalizeLinear(
    countMeaningfulActionTypes(signal.actionCounts),
    maxActionDiversity
  );

  return Math.round(100 * (0.5 * activityVolume + 0.3 * revisionVolume + 0.2 * actionDiversity));
}

function buildTemporalPresenceScore(
  signal: GoogleContributorSignal,
  timelineStart: number | null,
  timelineEnd: number | null,
  timelineSpan: number
) {
  if (timelineStart === null || timelineEnd === null || timelineSpan === 0) {
    return 50;
  }

  const contributorStart = Date.parse(signal.firstActivityAt ?? "");
  const contributorEnd = Date.parse(signal.lastActivityAt ?? "");

  if (Number.isNaN(contributorStart) || Number.isNaN(contributorEnd)) {
    return 50;
  }

  const coverage = clamp01((contributorEnd - contributorStart) / timelineSpan);
  const earlyPresence = clamp01(1 - (contributorStart - timelineStart) / timelineSpan);
  const latePresence = clamp01(1 - (timelineEnd - contributorEnd) / timelineSpan);

  return Math.round(100 * (0.5 * coverage + 0.25 * earlyPresence + 0.25 * latePresence));
}

function buildConsistencyScore(
  timelineMoments: string[],
  timelineStart: number | null,
  timelineEnd: number | null,
  timelineSpan: number
) {
  const parsedMoments = parseTimelineMoments(timelineMoments);

  if (parsedMoments.length === 0) {
    return 0;
  }

  if (timelineStart === null || timelineEnd === null || timelineSpan <= SHORT_TIMELINE_MS) {
    return getShortTimelineConsistency(parsedMoments);
  }

  const buckets = buildTimelineBuckets(timelineMoments, timelineStart, timelineEnd);
  const bucketCoverage = buckets.filter(Boolean).length / TIMELINE_BUCKETS;
  const largestGapRatio = getLargestGapRatio(parsedMoments, timelineStart, timelineEnd, timelineSpan);

  return Math.round(100 * (0.7 * bucketCoverage + 0.3 * (1 - largestGapRatio)));
}

function buildOwnershipProxyScore(
  signal: GoogleContributorSignal,
  timelineStart: number | null,
  timelineEnd: number | null,
  timelineSpan: number
) {
  if (timelineStart === null || timelineEnd === null || timelineSpan === 0) {
    return 20 * Number(hasAdminAction(signal.actionCounts));
  }

  const contributorStart = Date.parse(signal.firstActivityAt ?? "");
  const contributorEnd = Date.parse(signal.lastActivityAt ?? "");

  if (Number.isNaN(contributorStart) || Number.isNaN(contributorEnd)) {
    return 20 * Number(hasAdminAction(signal.actionCounts));
  }

  const earlyDriverSignal = clamp01(1 - (contributorStart - timelineStart) / timelineSpan);
  const closingSignal = clamp01(1 - (timelineEnd - contributorEnd) / timelineSpan);
  const adminActionSignal = Math.min(countAdminActionTypes(signal.actionCounts), 2) / 2;

  return Math.round(100 * (0.4 * earlyDriverSignal + 0.3 * closingSignal + 0.3 * adminActionSignal));
}

function buildScoreConfidence(signal: GoogleContributorSignal, snapshot: GoogleDocSnapshotRecord) {
  let confidence = 100;

  if (signal.identityResolution === "heuristic") {
    confidence -= 20;
  }

  if (signal.identityResolution === "unresolved") {
    confidence -= 35;
  }

  if (!signal.contributorEmail) {
    confidence -= 10;
  }

  if (signal.timelineMoments.length < 2) {
    confidence -= 15;
  }

  if (snapshot.activity.hasNextPage) {
    confidence -= 10;
  }

  if (snapshot.revisions.hasNextPage) {
    confidence -= 10;
  }

  if (!snapshot.has_collaborator_identity) {
    confidence -= 20;
  }

  return clampScore(confidence);
}

function buildScoreSummary(signal: GoogleContributorSignal, score: number) {
  if (score >= 70) {
    return `${signal.contributorName} showed strong, sustained participation across the document timeline.`;
  }

  if (score >= 40) {
    return `${signal.contributorName} showed visible participation, but less sustained coverage than the leading contributors.`;
  }

  return `${signal.contributorName} showed limited or low-weight activity compared with the rest of the group.`;
}

function getScoreLabel(score: number): ObservedContributorScore["scoreLabel"] {
  if (score >= 70) {
    return "High Contributor";
  }

  if (score >= 40) {
    return "Moderate Contributor";
  }

  return "Minimal Contributor";
}

function buildTimelineBuckets(
  timelineMoments: string[],
  timelineStart: number | null,
  timelineEnd: number | null
) {
  const buckets = Array.from({ length: TIMELINE_BUCKETS }, () => false);
  const parsedMoments = parseTimelineMoments(timelineMoments);

  if (parsedMoments.length === 0 || timelineStart === null || timelineEnd === null || timelineEnd <= timelineStart) {
    if (parsedMoments.length > 0) {
      buckets[0] = true;
    }

    return buckets;
  }

  const bucketSize = (timelineEnd - timelineStart) / TIMELINE_BUCKETS;

  for (const moment of parsedMoments) {
    const offset = moment - timelineStart;
    const index =
      bucketSize === 0 ? 0 : Math.min(Math.floor(offset / bucketSize), TIMELINE_BUCKETS - 1);
    buckets[Math.max(index, 0)] = true;
  }

  return buckets;
}

function getShortTimelineConsistency(parsedMoments: number[]) {
  const clusterCount = countTimeClusters(parsedMoments);

  if (clusterCount <= 1) {
    return 30;
  }

  if (clusterCount === 2) {
    return 60;
  }

  return 85;
}

function countTimeClusters(parsedMoments: number[]) {
  if (parsedMoments.length === 0) {
    return 0;
  }

  let clusterCount = 1;

  for (let index = 1; index < parsedMoments.length; index += 1) {
    if (parsedMoments[index] - parsedMoments[index - 1] > SHORT_TIMELINE_MS) {
      clusterCount += 1;
    }
  }

  return clusterCount;
}

function getLargestGapRatio(
  parsedMoments: number[],
  timelineStart: number,
  timelineEnd: number,
  timelineSpan: number
) {
  const sortedMoments = [...parsedMoments].sort((first, second) => first - second);
  const gaps = [
    sortedMoments[0] - timelineStart,
    timelineEnd - sortedMoments[sortedMoments.length - 1]
  ];

  for (let index = 1; index < sortedMoments.length; index += 1) {
    gaps.push(sortedMoments[index] - sortedMoments[index - 1]);
  }

  return clamp01(Math.max(...gaps, 0) / timelineSpan);
}

function parseTimelineMoments(values: string[]) {
  return values
    .map((value) => Date.parse(value))
    .filter((value) => !Number.isNaN(value))
    .sort((first, second) => first - second);
}

function getEarliestTime(values: number[]) {
  return values.length === 0 ? null : values[0];
}

function getLatestTime(values: number[]) {
  return values.length === 0 ? null : values[values.length - 1];
}

function hasOnlyLowValueActivity(signal: GoogleContributorSignal) {
  if (signal.revisionCount > 0) {
    return false;
  }

  return !Object.keys(signal.actionCounts).some((action) => SUBSTANTIVE_ACTIONS.has(action));
}

function hasAdminAction(actionCounts: Record<string, number>) {
  return Object.keys(actionCounts).some((action) => ADMIN_ACTIONS.has(action));
}

function countAdminActionTypes(actionCounts: Record<string, number>) {
  return Object.keys(actionCounts).filter((action) => ADMIN_ACTIONS.has(action)).length;
}

function countMeaningfulActionTypes(actionCounts: Record<string, number>) {
  return Object.entries(actionCounts).filter(([, count]) => count > 0).length;
}

function normalizeLog(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) {
    return 0;
  }

  return clamp01(Math.log1p(value) / Math.log1p(maxValue));
}

function normalizeLinear(value: number, maxValue: number) {
  if (value <= 0 || maxValue <= 0) {
    return 0;
  }

  return clamp01(value / maxValue);
}

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function clampScore(value: number) {
  return Math.min(Math.max(Math.round(value), 0), 100);
}
