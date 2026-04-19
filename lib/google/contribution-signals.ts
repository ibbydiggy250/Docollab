import type {
  GoogleContributorSignal,
  GoogleDocSnapshotRecord,
  GoogleDriveActivityEvent,
  GoogleRevisionMetadata
} from "@/types/google";

type SignalDraft = Omit<GoogleContributorSignal, "actionTypes"> & {
  actionTypes: Set<string>;
};

type ContributorIdentity = {
  key: string;
  name: string;
  email?: string;
};

const UNKNOWN_CONTRIBUTOR: ContributorIdentity = {
  key: "unknown-collaborator",
  name: "Unknown collaborator"
};

const GOOGLE_PERSON_PREFIX = "people/";
const IDENTITY_MATCH_WINDOW_MS = 10 * 60 * 1000;

export function buildGoogleContributorSignals(
  snapshot: GoogleDocSnapshotRecord
): GoogleContributorSignal[] {
  const signals = new Map<string, SignalDraft>();

  for (const event of snapshot.activity.items) {
    const identities = getActivityIdentities(event);
    const happenedAt = getActivityTimestamp(event);

    for (const identity of identities) {
      const signal = getOrCreateSignal(signals, identity);

      signal.activityCount += 1;
      updateDateRange(signal, happenedAt);

      for (const action of event.actions) {
        signal.actionTypes.add(action);
      }
    }
  }

  for (const revision of snapshot.revisions.items) {
    const identity = getRevisionIdentity(revision);

    if (!identity) {
      continue;
    }

    const signal = getOrCreateSignal(signals, identity);

    signal.revisionCount += 1;
    signal.appearedAsLastModifier = true;
    updateDateRange(signal, revision.modifiedTime);
  }

  mergeLikelyGooglePersonMatches(signals);

  const totalActivityCount = Array.from(signals.values()).reduce(
    (sum, signal) => sum + signal.activityCount,
    0
  );

  return Array.from(signals.values())
    .map((signal) => ({
      ...signal,
      actionTypes: Array.from(signal.actionTypes).sort(),
      activitySharePercent:
        totalActivityCount === 0 ? 0 : Math.round((signal.activityCount / totalActivityCount) * 100)
    }))
    .sort((first, second) => {
      if (second.activityCount !== first.activityCount) {
        return second.activityCount - first.activityCount;
      }

      if (second.revisionCount !== first.revisionCount) {
        return second.revisionCount - first.revisionCount;
      }

      return first.contributorName.localeCompare(second.contributorName);
    });
}

function getActivityIdentities(event: GoogleDriveActivityEvent): ContributorIdentity[] {
  if (event.actors.length === 0) {
    return [UNKNOWN_CONTRIBUTOR];
  }

  return event.actors.map((actor) => {
    const name = actor.displayName ?? actor.emailAddress ?? actor.knownUserPersonName;
    const key = actor.emailAddress ?? actor.knownUserPersonName ?? actor.displayName;

    if (!name || !key) {
      return UNKNOWN_CONTRIBUTOR;
    }

    return {
      key: normalizeKey(key),
      name,
      email: actor.emailAddress
    };
  });
}

function getRevisionIdentity(revision: GoogleRevisionMetadata): ContributorIdentity | null {
  const user = revision.lastModifyingUser;

  if (!user) {
    return null;
  }

  const name = user.displayName ?? user.emailAddress;
  const key = user.emailAddress ?? user.displayName;

  if (!name || !key) {
    return null;
  }

  return {
    key: normalizeKey(key),
    name,
    email: user.emailAddress
  };
}

function mergeLikelyGooglePersonMatches(signals: Map<string, SignalDraft>) {
  const drafts = Array.from(signals.values());
  const googlePersonSignals = drafts.filter(isUnresolvedGooglePersonSignal);
  const namedRevisionSignals = drafts.filter(isNamedRevisionOnlySignal);
  const usedNamedKeys = new Set<string>();

  for (const googlePersonSignal of googlePersonSignals) {
    const matches = namedRevisionSignals
      .filter((signal) => !usedNamedKeys.has(signal.contributorKey))
      .map((signal) => ({
        signal,
        distance: closestTimestampDistance(googlePersonSignal, signal)
      }))
      .filter((match) => match.distance <= IDENTITY_MATCH_WINDOW_MS)
      .sort((first, second) => first.distance - second.distance);

    if (matches.length === 0 || hasAmbiguousBestMatch(matches)) {
      continue;
    }

    const namedSignal = matches[0].signal;

    namedSignal.activityCount += googlePersonSignal.activityCount;
    updateDateRange(namedSignal, googlePersonSignal.firstActivityAt);
    updateDateRange(namedSignal, googlePersonSignal.lastActivityAt);

    for (const action of googlePersonSignal.actionTypes) {
      namedSignal.actionTypes.add(action);
    }

    usedNamedKeys.add(namedSignal.contributorKey);
    signals.delete(googlePersonSignal.contributorKey);
  }
}

function isUnresolvedGooglePersonSignal(signal: SignalDraft) {
  return (
    signal.contributorKey.startsWith(GOOGLE_PERSON_PREFIX) &&
    signal.activityCount > 0 &&
    signal.revisionCount === 0
  );
}

function isNamedRevisionOnlySignal(signal: SignalDraft) {
  return (
    !signal.contributorKey.startsWith(GOOGLE_PERSON_PREFIX) &&
    signal.contributorKey !== UNKNOWN_CONTRIBUTOR.key &&
    signal.revisionCount > 0 &&
    signal.activityCount === 0
  );
}

function hasAmbiguousBestMatch(matches: Array<{ distance: number }>) {
  return matches.length > 1 && matches[0].distance === matches[1].distance;
}

function closestTimestampDistance(first: SignalDraft, second: SignalDraft) {
  const firstTimes = getSignalTimes(first);
  const secondTimes = getSignalTimes(second);

  if (firstTimes.length === 0 || secondTimes.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.min(
    ...firstTimes.flatMap((firstTime) =>
      secondTimes.map((secondTime) => Math.abs(firstTime.getTime() - secondTime.getTime()))
    )
  );
}

function getSignalTimes(signal: SignalDraft) {
  return [signal.firstActivityAt, signal.lastActivityAt]
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()));
}

function getActivityTimestamp(event: GoogleDriveActivityEvent) {
  return event.timestamp ?? event.timeRange?.startTime ?? event.timeRange?.endTime;
}

function getOrCreateSignal(
  signals: Map<string, SignalDraft>,
  identity: ContributorIdentity
): SignalDraft {
  const existing = signals.get(identity.key);

  if (existing) {
    return existing;
  }

  const signal: SignalDraft = {
    contributorKey: identity.key,
    contributorName: identity.name,
    contributorEmail: identity.email,
    activityCount: 0,
    revisionCount: 0,
    actionTypes: new Set<string>(),
    appearedAsLastModifier: false,
    activitySharePercent: 0
  };

  signals.set(identity.key, signal);
  return signal;
}

function updateDateRange(signal: SignalDraft, timestamp?: string) {
  if (!timestamp) {
    return;
  }

  if (!signal.firstActivityAt || timestamp < signal.firstActivityAt) {
    signal.firstActivityAt = timestamp;
  }

  if (!signal.lastActivityAt || timestamp > signal.lastActivityAt) {
    signal.lastActivityAt = timestamp;
  }
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}
