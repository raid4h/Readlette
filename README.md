# Spine Time 🌿

A little woodland magic for picking your next read from your Goodreads to-read shelf.

**How the sync works, in one paragraph:** Goodreads killed their API in 2020, so there's
no clean way to connect an app to your account. Instead, this app uses two workarounds
together: a **one-time CSV import** to backfill your full 1251-book history (Goodreads'
RSS feed caps at 100 books, far too small for your shelf), and then your shelf's **RSS
feed** (still alive, no login needed, works because your profile is public) to catch
anything new automatically, once a day, forever. You never touch the app to keep it
updated - you just add books to Goodreads like normal.

---

## Step 1 - Get the code running locally

You'll need [Node.js](https://nodejs.org) installed (version 18 or later).

```bash
cd spine-time
npm install
```

## Step 2 - Create your database

This app stores your books in Postgres, via Neon (Vercel retired its own Postgres
product and now offers Neon through the Marketplace instead - same idea, different name):

1. Go to [vercel.com](https://vercel.com) and create a free account if you don't have one.
2. Create a new empty project (you can connect it to this code in Step 5 - for now
   just get a project shell created).
3. In your project, go to the **Storage** tab → **Create Database** → choose **Neon**
   (or install it directly from the [Vercel Marketplace](https://vercel.com/marketplace/neon)).
   Pick the free plan.
4. Once it's created, connect it to your project - this auto-injects a `DATABASE_URL`
   environment variable (among a few others) into your Vercel project. For local dev,
   copy that `DATABASE_URL` value from the Storage tab.
5. Run the schema against your new database. The easiest way: from the Storage tab,
   click **Open in Neon** to reach the Neon Console, open the **SQL Editor**, paste in
   the entire contents of `schema.sql` from this project, and run it. This creates the
   `books` table.

## Step 3 - Set your environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

- **`GOODREADS_USER_ID`** - find this in your Goodreads profile URL. If your profile
  is `goodreads.com/user/show/12345678-jane-doe`, your ID is `12345678`.
- **`DATABASE_URL`** - paste the value Vercel gave you in Step 2.

Double check your Goodreads privacy setting is **Public** (Settings → Profile) - the
RSS feed trick only works on public profiles, and you mentioned yours already is. ✅

## Step 4 - Run it locally to test

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the upload screen.

## Step 5 - Deploy to Vercel

The simplest way, using Vercel's CLI:

```bash
npm install -g vercel
vercel
```

Follow the prompts - it'll ask to link to the project you created in Step 2. It will
also detect `vercel.json` and register the daily sync automatically (see "About the
daily sync" below).

Once deployed, go to your project's **Settings → Environment Variables** on
vercel.com and add `GOODREADS_USER_ID` there too (the CLI usually offers to do this,
but it's worth double-checking it's set for the Production environment).

## Step 6 - Import your library (one time)

1. On Goodreads: **My Books → Import and Export → Export Library**. This can take a
   few minutes to generate for a library your size - Goodreads will show a download
   link when it's ready.
2. Open your deployed Spine Time app and upload that CSV file on the first screen.
3. That's it - all 1251 (to-read) books are now in your database.

You can re-run this anytime (e.g. you want to force a full refresh) - it won't create
duplicates, it just updates what's already there.

## Step 7 - Sort genres & author info

After importing, open the app - you'll see a "Sort remaining books now" button. This
looks up genre and author info for each book via free public APIs (Open Library and
Wikidata). It runs in the background in batches, so feel free to just leave the tab
open, or come back later - it also runs a little at a time whenever the daily sync
happens.

---

## About the daily sync

`vercel.json` registers a Vercel Cron Job that hits `/api/sync-rss` once a day, which
checks your Goodreads RSS feed for anything new and adds it automatically. This is
included in Vercel's **free Hobby plan** - no credit card needed. The only limitation
on the free tier is that cron jobs can only run once a day (not hourly), and Vercel
doesn't guarantee the exact minute it fires (it'll happen sometime within the hour
you scheduled) - both totally fine for our purposes.

If you ever add more than ~100 books to Goodreads in a single day (!), the RSS feed
would only show the 100 most recent and you'd need to re-run the CSV import to catch
everything - but for normal use this will never come up.

You can also hit "Sync now" in the app anytime you don't want to wait for the cron.

---

## Customizing the look

Everything about the whimsical/fairy/cottagecore look lives in `app/globals.css`:

- The color palette is defined once at the top as CSS variables (`--moss`, `--fern`,
  `--petal`, `--honey`, `--parchment`, `--bark`) - change those and the whole app
  reflows.
- Fonts are set in `app/layout.js` (currently Fraunces for headings, Quicksand for
  body text) - swap in any [Google Font](https://fonts.google.com) the same way.

## Customizing genre buckets

The genre-matching keywords live in `lib/enrichGenre.js`, in the `GENRE_KEYWORDS`
object near the top. Add, remove, or rename buckets there - it'll take effect the
next time a book is enriched (or re-import + re-sort if you want it applied
retroactively).

---

## A couple of honest limitations

- **Genre matching isn't perfect.** It's based on Open Library's crowd-tagged
  subjects, matched against keywords - obscure or newer books sometimes come back
  with no genre at all. They'll still show up when no genre filter is applied.
- **Author gender defaults to "unknown"** whenever we can't confidently match the
  author to a real Wikidata entry - this is intentional (see the comments in
  `lib/enrichGender.js`) rather than guessing from their name.
# Readlette
