import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildGoogleContributorSignals } from "@/lib/google/contribution-signals";
import { formatDateTime } from "@/lib/utils/dates";
import type { GoogleContributorSignal, GoogleDocSnapshotRecord } from "@/types/google";

type GoogleSnapshotsListProps = {
  snapshots: GoogleDocSnapshotRecord[];
};

function statusLabel(snapshot: GoogleDocSnapshotRecord) {
  if (snapshot.likely_supports_contribution_estimate) {
    return "Estimate supported";
  }

  return "Needs review";
}

export function GoogleSnapshotsList({ snapshots }: GoogleSnapshotsListProps) {
  if (snapshots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-background p-8 text-center">
        <h3 className="font-semibold">No saved Google data yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Fetch a Google Doc above to save its metadata, activity, revisions, and document preview.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {snapshots.map((snapshot) => {
        const contributorSignals = buildGoogleContributorSignals(snapshot);

        return (
          <Card key={snapshot.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle>{snapshot.doc_title ?? "Untitled document"}</CardTitle>
                <p className="text-sm text-muted-foreground">{formatDateTime(snapshot.created_at)}</p>
              </div>
              <Badge variant={snapshot.likely_supports_contribution_estimate ? "default" : "outline"}>
                {statusLabel(snapshot)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <p>
                  <span className="font-medium">{snapshot.activity_count}</span>{" "}
                  <span className="text-muted-foreground">activity events</span>
                </p>
                <p>
                  <span className="font-medium">{snapshot.revision_count}</span>{" "}
                  <span className="text-muted-foreground">revisions</span>
                </p>
                <p>
                  <span className="font-medium">{snapshot.document_text_length}</span>{" "}
                  <span className="text-muted-foreground">text characters</span>
                </p>
              </div>
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
                <p className="rounded-md border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                  {snapshot.document_text_preview}
                </p>
              ) : null}
              <ContributorSignalsList signals={contributorSignals} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ContributorSignalsList({ signals }: { signals: GoogleContributorSignal[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h4 className="text-sm font-semibold">Contributor signals</h4>
        <p className="text-sm text-muted-foreground">
          Based on Google activity events and revision metadata, not exact text deltas.
        </p>
      </div>
      {signals.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No contributor signals were found in the saved Google data.
        </p>
      ) : (
        <div className="grid gap-3">
          {signals.map((signal) => (
            <div key={signal.contributorKey} className="rounded-md border p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{signal.contributorName}</p>
                  {signal.contributorEmail ? (
                    <p className="text-sm text-muted-foreground">{signal.contributorEmail}</p>
                  ) : null}
                </div>
                <Badge variant="secondary">{signal.activitySharePercent}% activity share</Badge>
              </div>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <SignalStat label="Activity events" value={signal.activityCount} />
                <SignalStat label="Revision appearances" value={signal.revisionCount} />
                <SignalStat label="First seen" value={formatOptionalDate(signal.firstActivityAt)} />
                <SignalStat label="Last seen" value={formatOptionalDate(signal.lastActivityAt)} />
              </dl>
              {signal.actionTypes.length > 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Actions: {signal.actionTypes.join(", ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SignalStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function formatOptionalDate(value?: string) {
  if (!value) {
    return "Not available";
  }

  return formatDateTime(value);
}
