# Readers

A book tracking web app with bookshelf style navigation. Shelves, ratings (stars, or chili peppers for romance), notes, stats, recommendations, and real book clubs with spoiler free chapter discussions.

Single file front end (`index.html`) plus a Supabase backend for accounts, saving and clubs.

## Setup

1. **Supabase**: create a free project at supabase.com. Open SQL Editor, paste `supabase/schema.sql`, run it once.
2. **Auth settings** (Authentication, Providers, Email): for friend testing, turn off "Confirm email" so sign up works instantly. Turn it back on before a public launch.
3. **Keys**: Project Settings, API. Copy the Project URL and the `anon` public key into the top of the script in `index.html`:
   `const SB_URL='...',SB_KEY='...';`
   The anon key is safe to publish. Row level security in the SQL protects the data. Never use the `service_role` key here.
4. **GitHub Pages**: push this repo, then Settings, Pages, deploy from the `main` branch root.
5. In Supabase, Authentication, URL Configuration: set Site URL to your Pages address.

With the keys left blank, the app runs in local demo mode and saves to the browser only.

## How clubs work

- Start a club from a book on your shelf. You get a 6 character invite code.
- Friends choose Join with code. Each member's progress is shared.
- Comments are tied to chapters. The database only lets you read chapters you have finished.
