"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { googleDocUrlSchema } from "@/lib/google/doc-url-schema";
import type { GoogleDocSnapshotRecord } from "@/types/google";

type SnapshotResponse = {
  snapshot?: GoogleDocSnapshotRecord;
  error?: string;
};

function YesNoBadge({ value }: { value: boolean }) {
  return <Badge variant={value ? "default" : "outline"}>{value ? "Yes" : "No"}</Badge>;
}

export function GoogleSnapshotForm() {
  const router = useRouter();
  const [docUrl, setDocUrl] = useState("");
  const [snapshot, setSnapshot] = useState<GoogleDocSnapshotRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSnapshot(null);

    const parsed = googleDocUrlSchema.safeParse(docUrl);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the document URL and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/google/snapshots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ docUrl: parsed.data })
      });
      const payload = (await response.json()) as SnapshotResponse;

      if (!response.ok || !payload.snapshot) {
        setError(payload.error ?? "Google data could not be fetched.");
        return;
      }

      setSnapshot(payload.snapshot);
      setDocUrl("");
      router.refresh();
    } catch {
      setError("Something went wrong while fetching Google data.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="google-snapshot-url">Google Doc URL</Label>
          <Input
            id="google-snapshot-url"
            type="url"
            placeholder="https://docs.google.com/document/d/..."
            value={docUrl}
            aria-describedby={error ? "google-snapshot-error" : "google-snapshot-help"}
            aria-invalid={Boolean(error)}
            onChange={(event) => setDocUrl(event.target.value)}
          />
          <p id="google-snapshot-help" className="text-sm text-muted-foreground">
            Fetches real Google metadata, activity, revisions, and a current document text preview.
          </p>
        </div>
        {error ? (
          <Alert id="google-snapshot-error" variant="destructive">
            <AlertTitle>Google data could not be saved</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Fetching Google data..." : "Fetch Google Data"}
        </Button>
      </form>

      {snapshot ? (
        <Card>
          <CardHeader>
            <CardTitle>Saved Google data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium">{snapshot.doc_title ?? "Untitled document"}</p>
              <p className="text-sm text-muted-foreground">
                {snapshot.activity_count} activity events, {snapshot.revision_count} revisions,{" "}
                {snapshot.document_text_length} text characters
              </p>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Collaborator identity</span>
                <YesNoBadge value={snapshot.has_collaborator_identity} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Edit timestamps</span>
                <YesNoBadge value={snapshot.has_edit_timestamps} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Document text</span>
                <YesNoBadge value={snapshot.has_document_content} />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Exact text changes</span>
                <YesNoBadge value={snapshot.has_text_deltas} />
              </div>
            </div>
            {snapshot.document_text_preview ? (
              <p className="rounded-md border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
                {snapshot.document_text_preview}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
