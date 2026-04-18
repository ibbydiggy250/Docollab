"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { googleDocUrlSchema } from "@/lib/google/doc-url-schema";

export function DocUrlForm() {
  const router = useRouter();
  const [docUrl, setDocUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = googleDocUrlSchema.safeParse(docUrl);

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the document URL and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ docUrl: parsed.data })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Unable to analyze this document yet.");
        return;
      }

      router.push(`/reports/${payload.report.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong while starting analysis.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="doc-url">Google Doc URL</Label>
        <Input
          id="doc-url"
          type="url"
          placeholder="https://docs.google.com/document/d/..."
          value={docUrl}
          aria-describedby={error ? "doc-url-error" : "doc-url-help"}
          aria-invalid={Boolean(error)}
          onChange={(event) => setDocUrl(event.target.value)}
        />
        <p id="doc-url-help" className="text-sm text-muted-foreground">
          Any valid-looking Google Docs URL will run against mock revision data for now.
        </p>
      </div>
      {error ? (
        <Alert id="doc-url-error" variant="destructive">
          <AlertTitle>Analysis could not start</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting ? "Analyzing mock revisions..." : "Analyze Document"}
      </Button>
    </form>
  );
}
