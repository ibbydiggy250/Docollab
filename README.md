# Docollab

Docollab is a scaffolded MVP for a teacher-facing app that analyzes Google Doc collaboration history and stores contribution reports.

This project is intentionally scaffold-first. It builds the real app shape with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui-style components, Supabase Auth, Supabase Postgres, Route Handlers, mock Google revision data, and a placeholder analysis pipeline.

## What Is Included

- Marketing landing page with a clear product pitch
- Supabase auth scaffolding with Google OAuth sign-in
- Protected dashboard and report pages
- Google Doc URL submission form with friendly validation errors
- Mock revision fetching and preprocessing utilities
- Deterministic mock contribution analyzer
- Route Handlers for analysis and report retrieval
- Supabase schema with RLS policies
- Typed report, contributor, and revision models
- Reusable UI components based on shadcn/ui conventions
- TODO markers for Google Docs, OpenAI, and production hardening work

## What Is Mocked

- Google Doc metadata lookup returns a sample title.
- Google Doc revision history returns realistic mock data from `lib/google/mock-revisions.ts`.
- Contribution analysis uses simple deterministic heuristics in `lib/analysis/analyzer.ts`.
- The OpenAI prompt lives in `lib/analysis/prompts.ts`, but no live OpenAI call is made.

## What Is Real

- Next.js App Router pages and layouts
- Supabase browser, server, and middleware helpers
- Auth callback route
- Protected dashboard/report routes
- Supabase Postgres table design
- Row Level Security policies for user-owned reports and contributor rows
- Route Handlers under `app/api/...`
- Zod request validation
- Report and contributor database inserts after a mock analysis run

## Run Locally

Install dependencies:

```bash
npm install
```

Create an environment file:

```bash
cp .env.example .env.local
```

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Connect Supabase

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. In Supabase SQL Editor, run `supabase/schema.sql`.
5. Enable Google as an auth provider in Supabase.
6. Add `http://localhost:3000/auth/callback` to the allowed redirect URLs.

The app uses user-scoped RLS policies. Reports are readable only by the authenticated user who created them, and contributor rows are accessible through owned report records.

## MVP Flow

1. Sign in.
2. Open the dashboard.
3. Paste any valid-looking Google Docs URL.
4. Submit the analysis form.
5. The mock pipeline extracts the doc ID, loads mock revisions, groups contributor activity, generates deterministic scores, saves the report, and redirects to the report page.
6. Refresh the dashboard to see the saved report under previous reports.

## Next Steps

- Add Google OAuth scopes for Drive and Docs access, such as `https://www.googleapis.com/auth/drive.metadata.readonly` and document read scopes appropriate to the final integration.
- Build a real Google Docs or Drive revision fetcher and document the limitations of available authorship data.
- Replace the mock analyzer with a server-side OpenAI evaluation step.
- Add exportable teacher reports as PDF or CSV.
- Add team, classroom, and assignment organization.
- Add payment integration later, after the core teacher workflow is validated.

## Useful Files

- `app/api/analyze/route.ts` - main mock analysis endpoint
- `lib/google/revision-parser.ts` - Google integration placeholder
- `lib/analysis/analyzer.ts` - deterministic mock scoring
- `supabase/schema.sql` - database schema and RLS policies
- `components/dashboard/doc-url-form.tsx` - dashboard submission flow
