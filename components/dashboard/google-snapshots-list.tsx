import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildObservedContributorScores } from "@/lib/analysis/observed-score";
import { formatDateTime } from "@/lib/utils/dates";
import type { GoogleDocSnapshotRecord, ObservedContributorScore } from "@/types/google";

type GoogleSnapshotsListProps = {
  snapshots: GoogleDocSnapshotRecord[];
};

function statusLabel(snapshot: GoogleDocSnapshotRecord) {
  if (snapshot.likely_supports_contribution_estimate) {
    return "Ready to score";
  }

  return "Needs review";
}

export function GoogleSnapshotsList({ snapshots }: GoogleSnapshotsListProps) {
  if (snapshots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-background p-8 text-center">
        <h3 className="font-semibold">No Google docs analyzed yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste a Google Doc URL above to fetch the real collaboration data and score contributors.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {snapshots.map((snapshot) => {
        const contributors = buildObservedContributorScores(snapshot);

        return (
          <Card key={snapshot.id}>
            <CardHeader className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <CardTitle>{snapshot.doc_title ?? "Untitled document"}</CardTitle>
                  <p className="text-sm text-muted-foreground">{formatDateTime(snapshot.created_at)}</p>
                </div>
                <Badge variant={snapshot.likely_supports_contribution_estimate ? "default" : "outline"}>
                  {statusLabel(snapshot)}
                </Badge>
              </div>
              <div className="grid gap-3 rounded-md border bg-muted/20 p-4 text-sm sm:grid-cols-3">
                <SnapshotStat label="Activity events" value={snapshot.activity_count} />
                <SnapshotStat label="Revisions" value={snapshot.revision_count} />
                <SnapshotStat label="Text characters" value={snapshot.document_text_length} />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <Badge variant={snapshot.has_collaborator_identity ? "secondary" : "outline"}>
                  Collaborators {snapshot.has_collaborator_identity ? "found" : "missing"}
                </Badge>
                <Badge variant={snapshot.has_edit_timestamps ? "secondary" : "outline"}>
                  Timestamps {snapshot.has_edit_timestamps ? "found" : "missing"}
                </Badge>
                <Badge variant={snapshot.has_text_deltas ? "secondary" : "outline"}>
                  Text deltas {snapshot.has_text_deltas ? "found" : "not provided"}
                </Badge>
              </div>

              {snapshot.document_text_preview ? (
                <div className="rounded-md border bg-muted/20 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Document preview</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{snapshot.document_text_preview}</p>
                </div>
              ) : null}

              <section className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold">Observed contribution scores</h4>
                  <p className="text-sm text-muted-foreground">
                    Based on weighted activity, timeline coverage, consistency, and ownership signals from Google.
                  </p>
                </div>
                {contributors.length === 0 ? (
                  <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    No contributor signals were found in the saved Google data.
                  </p>
                ) : (
                  <div className="grid gap-3">
                    {contributors.map((contributor) => (
                      <ContributorScoreCard key={contributor.contributorKey} contributor={contributor} />
                    ))}
                  </div>
                )}
              </section>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function SnapshotStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function ContributorScoreCard({ contributor }: { contributor: ObservedContributorScore }) {
  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="font-medium">{contributor.contributorName}</p>
          {contributor.contributorEmail ? (
            <p className="text-sm text-muted-foreground">{contributor.contributorEmail}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{contributor.scoreLabel}</Badge>
          <Badge>{contributor.observedContributionScore}/100</Badge>
          <Badge variant="outline">{contributor.weightedActivitySharePercent}% of total activity</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreStat label="Activity" value={contributor.scoreBreakdown.activity} />
        <ScoreStat label="Temporal presence" value={contributor.scoreBreakdown.temporal_presence} />
        <ScoreStat label="Consistency" value={contributor.scoreBreakdown.consistency} />
        <ScoreStat label="Ownership proxy" value={contributor.scoreBreakdown.ownership_proxy} />
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">Timeline</span>
          <span className="text-muted-foreground">
            {formatOptionalDate(contributor.firstActivityAt)} to {formatOptionalDate(contributor.lastActivityAt)}
          </span>
        </div>
        <TimelineGraph buckets={contributor.timelineBuckets} contributorName={contributor.contributorName} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">{contributor.scoreSummary}</p>
    </div>
  );
}

function ScoreStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/20 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function TimelineGraph({ buckets, contributorName }: { buckets: boolean[]; contributorName: string }) {
  return (
    <div
      className="grid grid-cols-5 gap-2"
      role="img"
      aria-label={`${contributorName} timeline graph showing contribution across five document phases`}
    >
      {buckets.map((isActive, index) => (
        <div
          key={`${contributorName}-${index}`}
          className={`h-9 rounded-sm border ${isActive ? "border-primary bg-primary/80" : "border-border bg-muted/40"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function formatOptionalDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  return formatDateTime(value);
}
