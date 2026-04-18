import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/dates";
import type { Report } from "@/types/report";

type ReportsListProps = {
  reports: Report[];
};

export function ReportsList({ reports }: ReportsListProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-background p-8 text-center">
        <h3 className="font-semibold">No reports yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste a Google Docs URL above to create your first mock contribution report.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {reports.map((report) => (
        <Card key={report.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-2">
              <CardTitle>{report.doc_title}</CardTitle>
              <p className="text-sm text-muted-foreground">{formatDateTime(report.created_at)}</p>
            </div>
            <Badge variant="secondary">{report.total_collaborators} collaborators</Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {report.overall_summary ?? "Analysis saved without a summary."}
            </p>
            <Button asChild variant="outline">
              <Link href={`/reports/${report.id}`}>Open report</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
