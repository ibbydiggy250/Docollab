import { notFound } from "next/navigation";
import { ContributorCard } from "@/components/reports/contributor-card";
import { ReportSummary } from "@/components/reports/report-summary";
import { getReportForUser } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import type { Contributor } from "@/types/contributor";
import type { Report } from "@/types/report";

export const dynamic = "force-dynamic";

type ReportPageProps = {
  params: {
    id: string;
  };
};

export default async function ReportPage({ params }: ReportPageProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  let report: Report | null = null;

  try {
    report = (await getReportForUser(supabase, user.id, params.id)) as Report;
  } catch {
    notFound();
  }

  const contributors = [...(report.contributors ?? [])].sort(
    (a: Contributor, b: Contributor) => Number(b.contribution_percent) - Number(a.contribution_percent)
  );

  return (
    <div className="space-y-8">
      <ReportSummary report={report} />
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Contributor analysis</h2>
          <p className="text-sm text-muted-foreground">
            Mock scoring based on grouped revision chunks. Replace this with LLM-backed evaluation later.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {contributors.map((contributor) => (
            <ContributorCard key={contributor.id} contributor={contributor} />
          ))}
        </div>
      </section>
    </div>
  );
}
