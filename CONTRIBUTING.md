# Contributing

Local setup and workflow for the JRA website.

## What you need

- **Node.js 20+**
- **Docker Desktop** (runs the local Postgres — must be open before you start)
- **Git**

## Setup

```bash
git clone https://github.com/Saeedzx6/jra-website.git
cd jra-website
npm install
```

Start the database. This runs Postgres 16 on port **5433** (not the default 5432,
so it won't collide with any Postgres already on your machine):

```bash
docker compose up -d
```

Create your env file:

```bash
cp .env.example .env
```

Then generate your own auth secret and paste it into `.env` as `AUTH_SECRET`:

```bash
npx auth secret
```

Leave the `CLOUDINARY_*` values **blank**. With no Cloudinary credentials the app
writes uploads to `public/uploads` on your own disk, which is exactly what you
want locally. Never put production credentials in this file.

Create the tables:

```bash
npx prisma migrate deploy
npx prisma generate
```

## Getting data

Your database is empty at this point. Two options:

**Ask for a dump** (easiest). Someone on the team sends you `jra-backup.dump` —
about 275 KB, containing all 701 restaurants, news, and classification criteria.
Restore it:

```bash
docker run --rm -v "/absolute/path/to/folder:/backup" postgres:18-alpine \
  pg_restore --no-owner --no-acl \
  -d "postgresql://jra:jra_dev_password@host.docker.internal:5433/jra" \
  /backup/jra-backup.dump
```

**Or run the seed scripts** (`npm run seed:all`). These read from `JRA/` and
`JRA-moreassets/` source folders that are not in the repo — they are hundreds of
megabytes of reference material — so you need those from the team first.

Either way, create yourself a local admin login:

```bash
npm run seed:admin      # admin@jra.jo / ChangeMe123!  — local only, never production
```

## Running it

```bash
npm run dev             # http://localhost:3000
npm run db:studio       # http://localhost:5555 — browse/edit the database
```

The site is bilingual: `/en` and `/ar`. Check both when you change anything
visual — Arabic renders right-to-left and layouts break there in ways that are
invisible in English.

## Making changes

**Never push to `main`.** Vercel deploys every push to `main` straight to the
live public site, with no review step.

```bash
git checkout -b short-description-of-change
# ...work...
npm run typecheck
npm run build
git add -A
git commit -m "what changed and why"
git push -u origin short-description-of-change
```

Then open a pull request. Vercel builds a preview URL for the branch so the
change can be seen running before anyone merges it.

## Where things live

| What | Where |
|---|---|
| Pages and routing | `src/app/[locale]/` |
| Shared components | `src/components/` |
| Server actions (form handling, admin ops) | `src/lib/actions/` |
| Colors, fonts, spacing tokens | `src/app/globals.css` |
| All user-facing text, EN + AR | `messages/` |
| Database schema | `prisma/schema.prisma` |
| File uploads (Cloudinary + local fallback) | `src/lib/storage.ts` |

## Things worth knowing before you break them

**Uploads go through `src/lib/storage.ts`.** Do not call `fs.writeFileSync` in a
server action. Production runs on a read-only serverless filesystem, so direct
writes throw there while appearing to work locally.

**Applicant documents are private.** They upload as Cloudinary `authenticated`
assets and are served only via `/api/documents/...`, which checks for an admin
session and then mints a URL that expires in five minutes. Do not store their
raw CDN URLs anywhere.

**`npm run build` and `npm start` read `.env.production.local` — which points at
production.** Next loads env files by precedence, and in production mode
`.env.production.local` wins over `.env.local` and `.env`. So if that file is
present, a local `npm start` serves pages from the **live Neon database** using
the **production `AUTH_SECRET`**, not your local Postgres. Symptoms: your local
admin password is rejected, and page content does not match what `npm run
db:studio` shows.

`npm run dev` is unaffected — it runs in development mode and uses `.env.local`
then `.env`.

The file is there on purpose for the `prod:*` scripts (`dotenv -e
.env.production.local -- …`). To build or serve against your local database,
move it aside first:

```bash
mv .env.production.local .env.production.local.off   # remember to move it back
```

**Schema changes need a migration.** Edit `prisma/schema.prisma`, then:

```bash
npm run db:migrate      # creates the migration and applies it locally
```

Commit the generated folder under `prisma/migrations/`. The production build
runs `prisma migrate deploy`, so an uncommitted migration means a broken deploy.
Be careful with anything that drops or renames a column — production holds real
membership applications.

**The design tokens reach ~82 files at once.** `src/app/globals.css` feeds the
tokens into Tailwind through `@theme inline`, so `bg-paper`, `text-ink`,
`border-rule` and the rest all resolve to CSS variables defined in one `:root`
block. Changing a value there re-skins the whole app. That is the point, but it
also means there is no such thing as a local colour tweak — re-measure contrast
before changing a token, and keep the measured ratio in the comment beside it.

**Olive and brass are fenced.** They are not brand colours. They exist for the
classification seal, the star bands and the sustainability score — the two marks
JRA alone can certify. For anything that is merely a status (draft/published,
pending/approved, a form succeeding) use the `success` / `warning` / `danger`
tokens. If you are reaching for olive or brass to make a panel look less blue,
the answer is no. `--color-brass` is `#ad871d` rather than the logo's lighter
value because a star is a graphic object and needs 3:1; the original measured
2.98:1 on white.

**Never hardcode `letter-spacing`, `font-style: italic` or `text-transform:
uppercase`.** Use `.font-display`, `.font-eyebrow` and the `--display-*` /
`--eyebrow-*` tokens. Each of those three properties actively damages Arabic:
Arabic has no italic tradition, so a slanted word reads as a rendering fault;
Arabic is cursive, so positive tracking pulls the joins apart into disconnected
glyphs; and uppercase is a no-op on Arabic glyphs but still shouts any Latin
mixed into the same run. The tokens neutralise all three under `[dir="rtl"]` in
one place — a hardcoded utility silently reintroduces the bug.

**Numbers go through next-intl's formatter**, never `toLocaleString`. The two
disagree: `toLocaleString("ar-JO")` selects Arabic-Indic digits while next-intl
renders Latin ones, and a page showing both looks unfinished. Use
`useFormatter()` in client components and `getFormatter()` on the server.

**A server-actions file can only export async functions.** `"use server"`
modules are compiled to server references, so a plain `const` exported from one
arrives on the client as a function stub — `NEWSLETTER_INTERESTS.map is not a
function` rather than anything that names the real cause. Constants shared with
client components live in their own module; see `src/lib/newsletter-interests.ts`.

**Unlayered CSS beats Tailwind utilities.** The `* { border-color: … }` rule in
`globals.css` sits outside any `@layer`, and unlayered CSS wins over anything in
`@layer utilities` no matter how specific. So `border-transparent` on an element
silently does nothing. Override it in `globals.css` further down the file rather
than reaching for `!important`.

**Do not run `next build` while `next dev` is running.** They share `.next/`, and
the build leaves the dev server serving stale chunks — every request then fails
with `Cannot find module './1331.js'` and reloading does not fix it. Stop the dev
server, `rm -rf .next`, start it again.

**Public forms are rate limited** (`src/lib/rate-limit.ts`): 5 submissions per
hour per IP for contact and membership, 10 for the newsletter. If you are testing
submissions repeatedly and start getting `rate_limited`, that is why.

## Never commit

`.env`, `.env.production.local`, `.env.vercel.local`, `public/uploads/restaurants/`,
`public/uploads/membership-documents/`, and the `JRA/` source folders. All are
gitignored — please keep it that way.

The rest of `public/uploads/` **is** committed on purpose. Staff photos,
classification standards, annual reports, HR manuals, publications, workforce
studies and newsletters are fixed site content that seeded database rows point at
with plain `/uploads/...` paths. They used to be gitignored along with everything
else, which meant every one of those paths 404'd in production — the About page
had no photos and the classification standards would not download. Do not
re-ignore them unless you have first moved them to the CDN with
`npm run migrate:images` and confirmed the database rows now hold `https://` URLs.

## Health check scripts

These run against whatever database `DATABASE_URL` points at. Aim them at your
local one; production credentials are not needed for development.

| Script | Checks |
|---|---|
| `node scripts/ping-db.mjs` | Database reachable, row counts |
| `node scripts/verify-prod.mjs` | Admin accounts, image URLs, content totals |
| `node scripts/check-cdn.mjs` | Images actually serve from the CDN |
| `node scripts/check-private-doc.mjs <publicId>` | Applicant documents are private |
