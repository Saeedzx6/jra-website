# Connecting a custom domain

The site is live on `jra-website-omega.vercel.app`. Everything below is
account work — it needs the Vercel dashboard and the DNS panel at whoever
registered the domain, so it cannot be done from this repository.

The code is already ready for it. Nothing in `src/` needs to change.

## 1. Add the domain in Vercel

Vercel dashboard → the `jra-website` project → **Settings** → **Domains** →
add the domain (e.g. `jra.jo` and `www.jra.jo`).

Vercel then shows the exact DNS records to create. Use the records it shows
rather than any written down elsewhere — Vercel has changed its apex IP before,
and a stale value silently fails to verify.

## 2. Create the records at the registrar

In the DNS panel for the domain, add exactly what Vercel listed. Typically:

- an `A` record on the apex (`@`) pointing at the IP Vercel gives
- a `CNAME` on `www` pointing at the hostname Vercel gives

Propagation is usually minutes, occasionally up to 48 hours. Vercel issues the
TLS certificate automatically once it can see the records; the domain shows a
green check when it is done.

Pick one of `jra.jo` or `www.jra.jo` as primary in Vercel and let it redirect
the other. Serving both without a redirect splits search ranking between two
addresses for identical pages.

## 3. Set the canonical origin — do not skip this

Vercel dashboard → **Settings** → **Environment Variables** → add, for
**Production** only:

    NEXT_PUBLIC_SITE_URL = https://jra.jo

No trailing slash. Use whichever hostname was made primary in step 2.

Then **redeploy** — environment variables are read at build time, so an
existing deployment will not pick it up.

This one variable controls every absolute URL the site publishes: canonical
tags, hreflang alternates, `sitemap.xml`, `robots.txt`, `llms.txt`, and the
Open Graph and Twitter image URLs. Without it, `src/lib/seo.ts` falls back to
the `.vercel.app` hostname, and the site will keep telling search engines that
the `.vercel.app` address is the real one — while the custom domain serves the
same pages as apparent duplicates.

## 4. Verify

    curl -s https://jra.jo/en/about | grep canonical
    curl -s https://jra.jo/robots.txt
    curl -s https://jra.jo/sitemap.xml | head -20

All three should show the custom domain and no `.vercel.app` anywhere.

## 5. Tell search engines

1. Google Search Console → add the domain as a property, verify it (the DNS
   TXT method reuses the panel from step 2).
2. Submit `https://jra.jo/sitemap.xml`.
3. Bing Webmaster Tools can import the Search Console property directly.

The sitemap regenerates hourly and covers both languages, so it does not need
resubmitting when restaurants or news are published.
