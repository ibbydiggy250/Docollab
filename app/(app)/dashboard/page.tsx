import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GoogleSnapshotForm } from "@/components/dashboard/google-snapshot-form";
import { GoogleSnapshotsList } from "@/components/dashboard/google-snapshots-list";
import { listGoogleDocSnapshotsForUser } from "@/lib/db/google-snapshots";
import { createClient } from "@/lib/supabase/server";
import type { GoogleDocSnapshotRecord } from "@/types/google";

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

  let snapshots: GoogleDocSnapshotRecord[] = [];
  let snapshotLoadError: string | null = null;
  const setupMessage = getSetupMessage(searchParams?.setup_error);

  if (user) {
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
          Paste a Google Doc URL to fetch real collaboration data and score each contributor from the observed Google
          activity timeline.
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
          <h2 className="text-xl font-semibold">Analyze a Google Doc</h2>
          <p className="text-sm text-muted-foreground">
            Fetches Google metadata, activity, revisions, and current document text preview, then generates observed
            contribution scores from that real data.
          </p>
        </div>
        <GoogleSnapshotForm />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Saved Google data</h2>
          <p className="text-sm text-muted-foreground">
            Each snapshot is stored in Supabase and scored using weighted activity, temporal presence, consistency, and
            ownership signals.
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
    </div>
  );
}
