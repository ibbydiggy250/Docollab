"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const docUrlSchema = z
  .string()
  .trim()
  .min(1, "Paste a Google Docs URL to analyze.")
  .url("Enter a valid URL.")
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.hostname.endsWith("docs.google.com") && url.pathname.includes("/document/d/");
    } catch {
      return false;
    }
  }, "Enter a valid Google Docs document URL.");

export function DocUrlForm() {
  const router = useRouter();
  const [docUrl, setDocUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = docUrlSchema.safeParse(docUrl);

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
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-5">
      <div className="space-y-2">
        <Label htmlFor="doc-url">Google Doc URL</Label>
        <Input
          id="doc-url"
          type="url"
          placeholder="https://docs.google.com/document/d/..."
          value={docUrl}
          onChange={(event) => setDocUrl(event.target.value)}
        />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Analysis could not start</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Analyzing mock revisions..." : "Analyze Document"}
      </Button>
    </form>
  );
}
