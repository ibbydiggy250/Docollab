import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocUrlForm } from "@/components/dashboard/doc-url-form";
import { ReportsList } from "@/components/dashboard/reports-list";
import { listReportsForUser } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import type { Report } from "@/types/report";

export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams?: {
    setup_error?: string;
  };
};

function getSetupMessage(setupError?: string) {
  if (setupError === "missing_schema") {
    return "Your sign-in worked, but the Supabase tables are not available yet. Run supabase/schema.sql in the Supabase SQL Editor, then refresh this page.";
  }

  return null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let reports: Report[] = [];
  let loadError: string | null = null;
  const setupMessage = getSetupMessage(searchParams?.setup_error);

  if (user) {
    try {
      reports = (await listReportsForUser(supabase, user.id)) as Report[];
    } catch {
      loadError = "Previous reports could not be loaded. Check your Supabase schema and RLS policies.";
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h1 className="text-3xl font-bold tracking-normal">Welcome back{user?.email ? `, ${user.email}` : ""}</h1>
        <p className="max-w-2xl text-muted-foreground">
          Paste a Google Doc URL to run the scaffolded mock analysis pipeline and save a report.
        </p>
      </section>

      {setupMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Database setup needed</AlertTitle>
          <AlertDescription>{setupMessage}</AlertDescription>
        </Alert>
      ) : null}

      <DocUrlForm />

      <section id="reports" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Previous reports</h2>
          <p className="text-sm text-muted-foreground">Stored in Supabase and scoped to the signed-in teacher.</p>
        </div>
        {loadError ? (
          <Alert variant="destructive">
            <AlertTitle>Reports unavailable</AlertTitle>
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : (
          <ReportsList reports={reports} />
        )}
      </section>
    </div>
  );
}
