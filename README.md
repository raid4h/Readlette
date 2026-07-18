# ʚ Readlette ɞ

A whimsical, fairy-court/cottagecore-themed web app that randomly picks a book from my 1250+ book Goodreads to-read shelf. Built as a personal project and portfolio piece.

**Live at:** [readlette.vercel.app](https://readlette.vercel.app)

## What it does

- Randomly selects a book from your Goodreads to-read shelf, with filters for genre, decade/year, and author gender
- Automatically skips ahead in series — if you're mid-way through a series, only the next unread book is eligible, not later entries
- Lets you save picks to **Thy Fated Reads** (a shortlist for what to read next) or mark them finished on the spot
- A separate **Kobo Shelf** list for manually tracking what's loaded on an e-reader, plus a search bar to add any book to either list without waiting for the Oracle
- Periodic RSS sync ("Royal Messenger Service") to pick up newly-added Goodreads books automatically, plus genre/author-gender enrichment via external lookups
- Full CSV re-upload support that reconciles shelf changes (finished books, deleted books) back into the app

## Tech stack

- **Next.js 14** (App Router), plain JavaScript
- **Neon Postgres** (via Vercel Marketplace), using the `@neondatabase/serverless` driver
- **Papa Parse** for CSV parsing
- Book covers sourced live from [Open Library's Covers API](https://openlibrary.org/dev/docs/api/covers) via ISBN — no images are stored in the database

## Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/readlette.git
   cd readlette
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your own values:
   ```bash
   cp .env.example .env
   ```
   You'll need:
   - `DATABASE_URL` — a Neon Postgres connection string
   - `GOODREADS_USER_ID` — your numeric Goodreads user ID (found in your profile URL)

3. Run the schema against your database (see `schema.sql`) using the Neon SQL editor or your preferred Postgres client.

4. Start the dev server:
   ```bash
   npm run dev
   ```

5. Export your Goodreads library (Goodreads → My Books → Import & Export → Export Library) and upload the CSV on first load.

## Deployment

Deployed on Vercel, connected to this GitHub repo for auto-deploy on push to `main`. The database is a Neon Postgres instance provisioned through the Vercel Marketplace.

## A note on data & privacy

This app is built for personal use against my own Goodreads export. Per Goodreads' Terms of Use, collected account data is for personal, non-commercial use only — this project isn't monetized and isn't intended to be.

## License

MIT — see [LICENSE](./LICENSE).

## Author

Built by Tahmina Faiza Mahmud Raidah (https://github.com/raid4h). Feel free to reach out via the contact links on the [live site](https://readlette.vercel.app).