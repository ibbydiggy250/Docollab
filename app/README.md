# App Router Map

This folder uses Next.js App Router conventions. Folders wrapped in parentheses are route groups:
they organize files without changing the public URL.

- `(marketing)` contains public pages. Its `page.tsx` renders `/`.
- `(app)` contains authenticated application pages. Its routes render `/dashboard` and `/reports/[id]`.
- `api` contains backend Route Handlers.
- `auth` contains Supabase auth callback routes.
- `layout.tsx` is the root layout shared by all routes.
- `globals.css` contains global Tailwind styles and CSS variables.

The preferred future cleanup is to rename:

- `(marketing)` to `(public)`
- `(app)` to `(protected)`

Those route-group renames do not change URLs, but they may require OneDrive/dev-server file locks to be fully released first.
