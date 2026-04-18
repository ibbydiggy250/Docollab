import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Contributor } from "@/types/contributor";

type ContributorCardProps = {
  contributor: Contributor;
};

function ScoreRow({ label, value }: { label: string; value: number }) {
  const scoreText = `${label} score: ${value} out of 100`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/100</span>
      </div>
      <Progress value={value} aria-label={scoreText} />
    </div>
  );
}

export function ContributorCard({ contributor }: ContributorCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{contributor.contributor_name}</CardTitle>
            {contributor.contributor_email ? (
              <p className="mt-1 text-sm text-muted-foreground">{contributor.contributor_email}</p>
            ) : null}
          </div>
          <Badge variant="secondary">{Number(contributor.contribution_percent).toFixed(0)}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-6 text-muted-foreground">{contributor.summary}</p>
        <div className="space-y-4">
          <ScoreRow label="Originality" value={contributor.originality_score} />
          <ScoreRow label="Significance" value={contributor.significance_score} />
          <ScoreRow label="Writing quality" value={contributor.writing_quality_score} />
        </div>
      </CardContent>
    </Card>
  );
}
