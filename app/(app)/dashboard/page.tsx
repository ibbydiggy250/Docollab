import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocUrlForm } from "@/components/dashboard/doc-url-form";
import { GoogleSnapshotForm } from "@/components/dashboard/google-snapshot-form";
import { GoogleSnapshotsList } from "@/components/dashboard/google-snapshots-list";
import { ReportsList } from "@/components/dashboard/reports-list";
import { listGoogleDocSnapshotsForUser } from "@/lib/db/google-snapshots";
import { listReportsForUser } from "@/lib/db/queries";
import { createClient } from "@/lib/supabase/server";
import type { GoogleDocSnapshotRecord } from "@/types/google";
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

  if (setupError === "google_token_storage") {
    return "Your sign-in worked, but Google token storage is not ready yet. Confirm SUPABASE_SERVICE_ROLE_KEY and GOOGLE_TOKEN_ENCRYPTION_KEY are loaded, rerun supabase/schema.sql so google_connections exists, then sign in again.";
  }

  return null;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let reports: Report[] = [];
  let snapshots: GoogleDocSnapshotRecord[] = [];
  let loadError: string | null = null;
  let snapshotLoadError: string | null = null;
  const setupMessage = getSetupMessage(searchParams?.setup_error);

  if (user) {
    try {
      reports = (await listReportsForUser(supabase, user.id)) as Report[];
    } catch {
      loadError = "Previous reports could not be loaded. Check your Supabase schema and RLS policies.";
    }

    try {
      snapshots = await listGoogleDocSnapshotsForUser(supabase, user.id);
    } catch {
      snapshotLoadError =
        "Saved Google data could not be loaded. Rerun supabase/schema.sql if this is your first time using snapshots.";
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">Dashboard</p>
        <h1 className="text-3xl font-bold tracking-normal">Welcome back{user?.email ? `, ${user.email}` : ""}</h1>
        <p className="max-w-2xl text-muted-foreground">
          Fetch real Google data first, then use mock reports separately while the contribution model is still being
          built.
        </p>
      </section>

      {setupMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Database setup needed</AlertTitle>
          <AlertDescription>{setupMessage}</AlertDescription>
        </Alert>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Fetch Google data</h2>
          <p className="text-sm text-muted-foreground">
            Saves Google metadata, activity, revisions, and current document text preview. This does not generate a
            final contribution report yet.
          </p>
        </div>
        <GoogleSnapshotForm />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Saved Google data</h2>
          <p className="text-sm text-muted-foreground">
            These snapshots are stored in Supabase and can be used for the next contribution-analysis step.
          </p>
        </div>
        {snapshotLoadError ? (
          <Alert variant="destructive">
            <AlertTitle>Google data unavailable</AlertTitle>
            <AlertDescription>{snapshotLoadError}</AlertDescription>
          </Alert>
        ) : (
          <GoogleSnapshotsList snapshots={snapshots} />
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Mock report flow</h2>
          <p className="text-sm text-muted-foreground">
            This still uses mock revisions while the real Google-based contribution model is being built.
          </p>
        </div>
        <DocUrlForm />
      </section>

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
