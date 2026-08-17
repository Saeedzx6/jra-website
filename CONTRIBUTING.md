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

**Change `localhost` to `127.0.0.1` in both `DATABASE_URL` and `DIRECT_URL`.**
Docker binds 5433 on IPv4 and IPv6; on Windows `localhost` resolves to `::1`
first and Prisma intermittently fails to connect with "Can't reach database
server" even though the container is healthy.

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

Point `JRA_LEGACY_DATA_DIR` in `.env` at the folder holding `resutaurants.xlsx`,
`categories.xlsx`, `manufacturers.xlsx` and `restaurant_tags.xlsx`. Only
`04-content.ts` and the photo seeds need the larger `JRA-moreassets` folder; the
restaurant, supplier and classification seeds run from the four spreadsheets
alone.

> **The seed scripts do not read `.env`.** They run under `tsx`, which — unlike
> the Prisma CLI — does not load it automatically, and they fail with
> "Environment variable not found: DATABASE_URL". Wrap every one:
> ```bash
> npx dotenv -e .env -- tsx prisma/seed/01-lookups.ts
> ```

Two seeds exist that `seed:all` does not include, both added for the public
front end (see [docs/FRONTEND-PORT.md](docs/FRONTEND-PORT.md) §4):

```bash
npm run seed:suppliers        # 56 supplier rows — the table ships empty otherwise
npm run seed:legacy-images    # image URLs; without these every listing is imageless
```

Either way, create yourself a local admin login:

```bash
npm run seed:admin      # admin@jra.jo / ChangeMe123!  — local only, never production
```

Finally, build the public directory snapshot the front end reads:

```bash
npm run data:directory
```

## Running it

```bash
npm run dev             # http://localhost:3000
npm run db:studio       # http://localhost:5555 — browse/edit the database
```

The site is bilingual: `/en` and `/ar`. Check both when you change anything
visual — Arabic renders right-to-left and layouts break there in ways that are
invisible in English.

## Testing

```bash
npm test                # vitest — 82 unit tests, no server or database needed
npm run smoke           # 46 route checks; needs a server running
```

Keep the unit suite free of servers, databases and fixtures so it stays fast and
runnable anywhere. `npm run smoke` takes `BASE_URL` if you are not on port 3001.

It checks something a status code cannot: a page that returns 200 while still
showing its `loading.tsx` fallback, with the real markup stranded in a hidden
div. That has happened here — see [docs/FRONTEND-PORT.md](docs/FRONTEND-PORT.md)
§6.4.

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
| Direction B aliases, layout primitives, component classes | `src/styles/direction-b.css` |
| All user-facing text, EN + AR | `messages/` |
| Editorial prose (not UI chrome), EN + AR | `src/lib/content.ts`, `src/lib/modules.ts` |
| Public directory snapshot — **generated, do not hand-edit** | `src/data/*.json` |
| Database schema | `prisma/schema.prisma` |
| File uploads (Cloudinary + local fallback) | `src/lib/storage.ts` |

The public site was ported in from a separate front-end project. Read
[docs/FRONTEND-PORT.md](docs/FRONTEND-PORT.md) before changing anything under
`src/app/[locale]/` that is not `admin/` or `portal/`.

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

**The public directory reads a generated snapshot, not the database.** Editing a
restaurant in the admin panel will not change `/restaurants` until
`npm run data:directory` runs — it is wired into `npm run build`, so deploys
pick it up. This is deliberate: the directory filters client-side so search and
chips respond without a round trip. Do not "fix" it by querying per request; see
[docs/FRONTEND-PORT.md](docs/FRONTEND-PORT.md) §3.

**Stop the dev server before `npm run build`.** `prisma generate` renames
`query_engine-windows.dll.node`, which fails with `EPERM` while a dev server
holds it open. The build then reports success having never run `next build`.

**A stale `.next` can serve a broken page indefinitely.** If the database was
unreachable when a statically-revalidated route was first rendered, the cached
shell keeps serving its loading fallback with the real markup stranded in a
hidden div — a 200 response, no error in the logs. `rm -rf .next` and restart.

**Schema changes need a migration.** Edit `prisma/schema.prisma`, then:

```bash
npm run db:migrate      # creates the migration and applies it locally
```

Commit the generated folder under `prisma/migrations/`. The production build
runs `prisma migrate deploy`, so an uncommitted migration means a broken deploy.
Be careful with anything that drops or renames a column — production holds real
membership applications.

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
