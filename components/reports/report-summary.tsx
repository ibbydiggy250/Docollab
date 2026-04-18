import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/dates";
import type { Report } from "@/types/report";

type ReportSummaryProps = {
  report: Report;
};

export function ReportSummary({ report }: ReportSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-2xl">{report.doc_title}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">Analyzed {formatDateTime(report.created_at)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>{report.total_collaborators} collaborators</Badge>
            <Badge variant="outline">{report.total_revisions} revisions processed</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="leading-7 text-muted-foreground">{report.overall_summary}</p>
      </CardContent>
    </Card>
  );
}
